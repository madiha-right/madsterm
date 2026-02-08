import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { WebglAddon } from "@xterm/addon-webgl";
import {
  createPtySession,
  writePty,
  resizePty,
  closePty,
  onPtyOutput,
  onPtyExit,
} from "../../hooks/usePty";
import { getHomeDir } from "../../hooks/useFileExplorer";
import { usePanelStore } from "../../stores/panelStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useTabStore } from "../../stores/tabStore";
import { useThemeStore } from "../../stores/themeStore";
import "@xterm/xterm/css/xterm.css";

interface TerminalInstanceProps {
  tabId: string;
  cwd?: string;
  isActive: boolean;
  onTitleChange?: (title: string) => void;
  onExit?: () => void;
  onSearchAddonReady?: (addon: SearchAddon) => void;
}

// Shortcuts that should propagate to the app (not be consumed by xterm)
function isAppShortcut(e: KeyboardEvent): boolean {
  const meta = e.metaKey || e.ctrlKey;
  if (!meta) return false;

  const key = e.key.toLowerCase();

  // Cmd+T (new tab), Cmd+W (close tab), Cmd+B (toggle explorer), Cmd+F (search), Cmd+1-9 (switch tab)
  if (!e.shiftKey && !e.altKey && ["t", "w", "b", "f", "p"].includes(key)) return true;
  if (!e.shiftKey && !e.altKey && e.key >= "1" && e.key <= "9") return true;

  // Cmd+Plus/Minus/0 (font size)
  if (!e.shiftKey && !e.altKey && (e.key === "+" || e.key === "=" || e.key === "-" || e.key === "0")) return true;

  // Cmd+Shift+T (reopen tab), Cmd+Shift+E (toggle explorer), Cmd+Shift+= (toggle diff)
  if (e.shiftKey && !e.altKey && (key === "t" || key === "e" || e.key === "+" || e.key === "=")) return true;

  // Cmd+Alt+Left/Right (prev/next tab), Cmd+[/] (prev/next tab)
  if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) return true;
  if (!e.altKey && !e.shiftKey && (e.key === "[" || e.key === "]")) return true;

  return false;
}

export const TerminalInstance: React.FC<TerminalInstanceProps> = ({
  tabId,
  cwd,
  isActive,
  onTitleChange,
  onExit,
  onSearchAddonReady,
}) => {
  const { fontSize, fontFamily, copyOnSelect, cursorStyle, cursorBlink, scrollbackLines } = useSettingsStore();
  const theme = useThemeStore((s) => s.theme);
  const updateTabCwd = useTabStore((s) => s.updateTabCwd);
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mountedRef.current) return;
    mountedRef.current = true;

    const isMac = navigator.platform.includes("Mac");
    const terminal = new Terminal({
      cursorBlink: cursorBlink,
      cursorStyle: cursorStyle,
      fontSize: fontSize,
      fontFamily: fontFamily,
      lineHeight: 1.2,
      theme: theme.xtermTheme,
      allowProposedApi: true,
      scrollback: scrollbackLines,
      convertEol: false,
      windowsMode: false,
      macOptionIsMeta: true,
      macOptionClickForcesSelection: true,
      rightClickSelectsWord: true,
    });

    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();
    const unicode11Addon = new Unicode11Addon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(searchAddon);
    terminal.loadAddon(unicode11Addon);
    terminal.unicode.activeVersion = "11";

    // Let app-level shortcuts propagate through xterm, handle terminal-specific ones
    terminal.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      if (isAppShortcut(e)) return false; // Don't handle, let it bubble

      // Only handle keydown events for our custom handlers
      if (e.type !== "keydown") return true;

      const meta = e.metaKey;
      const ctrl = e.ctrlKey;
      const metaOrCtrl = meta || ctrl;

      // Cmd+K -> clear terminal
      if (metaOrCtrl && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
        terminal.clear();
        return false;
      }

      // Cmd+F -> find in terminal (handled by SearchAddon)
      if (metaOrCtrl && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "f") {
        return false; // Let the browser/addon handle it
      }

      // Cmd+C -> copy when there's a selection, otherwise send SIGINT
      if (isMac && meta && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "c") {
        if (terminal.hasSelection()) {
          document.execCommand("copy");
          return false;
        }
        // Let terminal handle Ctrl+C (SIGINT) via normal flow
        return true;
      }

      // Cmd+V -> paste from clipboard
      if (isMac && meta && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "v") {
        navigator.clipboard.readText().then((text) => {
          if (text && sessionIdRef.current) {
            writePty(sessionIdRef.current, text);
          }
        });
        return false;
      }

      // Cmd+A -> select all terminal content
      if (isMac && meta && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "a") {
        terminal.selectAll();
        return false;
      }

      // macOS-specific: Cmd+Delete -> delete to beginning of line (send Ctrl+U)
      if (isMac && meta && e.key === "Backspace") {
        if (sessionIdRef.current) writePty(sessionIdRef.current, "\x15");
        return false;
      }

      // macOS-specific: Cmd+Left -> move to beginning of line (send Home)
      if (isMac && meta && e.key === "ArrowLeft") {
        if (sessionIdRef.current) writePty(sessionIdRef.current, "\x01");
        return false;
      }

      // macOS-specific: Cmd+Right -> move to end of line (send End)
      if (isMac && meta && e.key === "ArrowRight") {
        if (sessionIdRef.current) writePty(sessionIdRef.current, "\x05");
        return false;
      }

      return true; // Let xterm handle everything else
    });

    terminal.open(containerRef.current);

    // Load WebGL renderer for GPU-accelerated rendering
    try {
      const webglAddon = new WebglAddon();
      webglAddon.onContextLoss(() => {
        webglAddon.dispose();
      });
      terminal.loadAddon(webglAddon);
    } catch {
      // WebGL not available, fall back to canvas renderer
    }

    fitAddon.fit();
    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;
    searchAddonRef.current = searchAddon;
    onSearchAddonReady?.(searchAddon);

    const cols = terminal.cols;
    const rows = terminal.rows;

    let unlistenOutput: (() => void) | null = null;
    let unlistenExit: (() => void) | null = null;

    const initPty = async () => {
      try {
        const sessionId = await createPtySession(cols, rows, cwd);
        sessionIdRef.current = sessionId;

        const unlisten1 = await onPtyOutput(sessionId, (data) => {
          terminal.write(data);
        });
        unlistenOutput = unlisten1;

        const unlisten2 = await onPtyExit(sessionId, () => {
          onExit?.();
        });
        unlistenExit = unlisten2;

        terminal.onData((data) => {
          writePty(sessionId, data);
        });

        terminal.onBinary((data) => {
          writePty(sessionId, data);
        });

        terminal.onResize(({ cols, rows }) => {
          resizePty(sessionId, cols, rows);
        });

        // Fetch home dir for tilde expansion in CWD tracking
        const homeDir = await getHomeDir();

        // Track CWD from terminal title (most shells set title to user@host:cwd)
        terminal.onTitleChange((title) => {
          onTitleChange?.(title);
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
              updateTabCwd(tabId, extracted);
            }
          }
        });

        // Copy on select
        terminal.onSelectionChange(() => {
          if (copyOnSelect && terminal.hasSelection()) {
            const selection = terminal.getSelection();
            if (selection) {
              navigator.clipboard.writeText(selection);
            }
          }
        });
      } catch (err: any) {
        const msg = typeof err === 'string' ? err : err?.message || JSON.stringify(err);
        terminal.write(`\x1b[31mPTY Error: ${msg}\x1b[0m\r\n`);
      }
    };
    initPty();

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        fitAddon.fit();
      });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      mountedRef.current = false;
      resizeObserver.disconnect();
      unlistenOutput?.();
      unlistenExit?.();
      if (sessionIdRef.current) {
        closePty(sessionIdRef.current);
        sessionIdRef.current = null;
      }
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
      searchAddonRef.current = null;
    };
  }, []);

  // Focus terminal when it becomes the active tab
  useEffect(() => {
    if (isActive && terminalRef.current) {
      terminalRef.current.focus();
      fitAddonRef.current?.fit();
    }
  }, [isActive]);

  // Focus terminal when panel focus returns to terminal
  const focusedPanel = usePanelStore((s) => s.focusedPanel);
  useEffect(() => {
    if (isActive && focusedPanel === "terminal" && terminalRef.current) {
      // Small delay to let panel transitions complete
      requestAnimationFrame(() => {
        terminalRef.current?.focus();
      });
    }
  }, [focusedPanel, isActive]);

  // React to font size changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.fontSize = fontSize;
      fitAddonRef.current?.fit();
    }
  }, [fontSize]);

  // React to font family changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.fontFamily = fontFamily;
      fitAddonRef.current?.fit();
    }
  }, [fontFamily]);

  // React to theme changes — update xterm theme at runtime
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.theme = theme.xtermTheme;
    }
  }, [theme]);

  return (
    <div
      ref={containerRef}
      data-tab-id={tabId}
      style={{
        width: "100%",
        height: "100%",
        display: isActive ? "block" : "none",
        overflow: "hidden",
        padding: 0,
      }}
    />
  );
};
