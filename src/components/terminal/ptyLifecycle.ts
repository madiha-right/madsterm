import type { Terminal } from "@xterm/xterm";
import { getHomeDir } from "../../commands/fs";
import {
  closePty,
  createPtySession,
  onPtyExit,
  onPtyOutput,
  resizePty,
  writePty,
} from "../../commands/pty";

interface PtyCallbacks {
  onConnected: (sessionId: string) => void;
  onSessionEnded: () => void;
  onError: (message: string) => void;
  onTitleChange?: (title: string) => void;
  updateTabCwd: (tabId: string, cwd: string) => void;
  tabId: string;
  copyOnSelect: boolean;
}

interface PtyCleanupRefs {
  unlistenOutput: (() => void) | null;
  unlistenExit: (() => void) | null;
}

export async function initPty(
  terminal: Terminal,
  cols: number,
  rows: number,
  cwd: string | undefined,
  callbacks: PtyCallbacks,
  cleanupRefs: PtyCleanupRefs,
): Promise<string> {
  const sessionId = await createPtySession(cols, rows, cwd);
  callbacks.onConnected(sessionId);

  const unlisten1 = await onPtyOutput(sessionId, (data) => {
    terminal.write(data);
  });
  cleanupRefs.unlistenOutput = unlisten1;

  const unlisten2 = await onPtyExit(sessionId, () => {
    terminal.write("\r\n\x1b[90m[Process completed]\x1b[0m\r\n");
    callbacks.onSessionEnded();
  });
  cleanupRefs.unlistenExit = unlisten2;

  terminal.onData((data) => {
    writePty(sessionId, data);
  });

  terminal.onBinary((data) => {
    writePty(sessionId, data);
  });

  terminal.onResize(({ cols, rows }) => {
    resizePty(sessionId, cols, rows);
  });

  // Send an explicit resize to ensure PTY and terminal are synced
  const currentCols = terminal.cols;
  const currentRows = terminal.rows;
  if (currentCols !== cols || currentRows !== rows) {
    resizePty(sessionId, currentCols, currentRows);
  }

  // Fetch home dir for tilde expansion in CWD tracking
  const homeDir = await getHomeDir();

  // Track CWD from terminal title (most shells set title to user@host:cwd)
  terminal.onTitleChange((title) => {
    callbacks.onTitleChange?.(title);
    // Extract path from title: try "user@host: ~/path" or "host: /path" format first,
    // then fall back to bare path starting with ~ or /
    const colonMatch = title.match(/:\s*(.+?)\s*$/);
    const pathMatch = title.match(/^(~\/.*|\/\S+)/);
    let extracted = colonMatch?.[1]?.trim() || pathMatch?.[1] || null;
    if (extracted) {
      // Expand tilde to home directory
      if (extracted.startsWith("~")) {
        extracted = homeDir + extracted.slice(1);
      }
      if (extracted.startsWith("/")) {
        callbacks.updateTabCwd(callbacks.tabId, extracted);
      }
    }
  });

  // Copy on select
  terminal.onSelectionChange(() => {
    if (callbacks.copyOnSelect && terminal.hasSelection()) {
      const selection = terminal.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection);
      }
    }
  });

  return sessionId;
}

export function cleanupPty(
  sessionIdRef: React.MutableRefObject<string | null>,
  cleanupRefs: PtyCleanupRefs,
): void {
  cleanupRefs.unlistenOutput?.();
  cleanupRefs.unlistenExit?.();
  if (sessionIdRef.current) {
    closePty(sessionIdRef.current);
    sessionIdRef.current = null;
  }
}
