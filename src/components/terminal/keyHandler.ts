import type { Terminal } from "@xterm/xterm";
import { writePty } from "../../commands/pty";
import { useSettingsStore } from "../../stores/settingsStore";
import { handleVimNormalMode, type VimMode } from "./vimMode";

// Shortcuts that should propagate to the app (not be consumed by xterm)
const isMac = navigator.platform.includes("Mac");

export function isAppShortcut(e: KeyboardEvent): boolean {
  // On macOS, only Cmd triggers app shortcuts. On Windows/Linux, Ctrl does.
  const meta = isMac ? e.metaKey : e.ctrlKey;
  if (!meta) return false;

  const key = e.key.toLowerCase();

  // Cmd+T (new tab), Cmd+W (close tab), Cmd+B (toggle explorer), Cmd+F (search), Cmd+1-9 (switch tab)
  if (!e.shiftKey && !e.altKey && ["t", "w", "b", "f", "p"].includes(key)) return true;
  if (!e.shiftKey && !e.altKey && e.key >= "1" && e.key <= "9") return true;

  // Cmd+Plus/Minus/0 (font size)
  if (
    !e.shiftKey &&
    !e.altKey &&
    (e.key === "+" || e.key === "=" || e.key === "-" || e.key === "0")
  )
    return true;

  // Cmd+Shift+T (reopen tab), Cmd+Shift+E (toggle explorer), Cmd+Shift+F (search), Cmd+Shift+= (toggle diff)
  if (
    e.shiftKey &&
    !e.altKey &&
    (key === "t" || key === "e" || key === "f" || e.key === "+" || e.key === "=")
  )
    return true;

  // Alt+Cmd+C/W/R (search toggles)
  if (e.altKey && !e.shiftKey && ["c", "w", "r"].includes(key)) return true;

  // Cmd+Alt+Left/Right (prev/next tab), Cmd+[/] (prev/next tab)
  if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) return true;
  if (!e.altKey && !e.shiftKey && (e.key === "[" || e.key === "]")) return true;

  return false;
}

interface KeyHandlerDeps {
  terminal: Terminal;
  sessionIdRef: React.MutableRefObject<string | null>;
  vimStateRef: React.MutableRefObject<VimMode>;
  gPressedRef: React.MutableRefObject<boolean>;
  updateVimState: (mode: VimMode) => void;
}

export function createKeyEventHandler(deps: KeyHandlerDeps): (e: KeyboardEvent) => boolean {
  const { terminal, sessionIdRef, vimStateRef, gPressedRef, updateVimState } = deps;

  return (e: KeyboardEvent): boolean => {
    if (isAppShortcut(e)) return false; // Don't handle, let it bubble

    const isVimEnabled = useSettingsStore.getState().vimMode;
    const currentVimMode = vimStateRef.current;

    // In vim normal mode, block ALL events (keydown, keypress, keyup) to prevent typing
    if (isVimEnabled && currentVimMode === "normal" && e.type !== "keydown") {
      e.preventDefault();
      return false;
    }

    // Only handle keydown events for our custom handlers
    if (e.type !== "keydown") return true;

    const meta = e.metaKey;
    const ctrl = e.ctrlKey;
    const metaOrCtrl = meta || ctrl;

    if (isVimEnabled && currentVimMode === "normal") {
      const handled = handleVimNormalMode(
        e,
        terminal,
        sessionIdRef.current,
        gPressedRef,
        updateVimState,
      );
      if (handled) return false;
      return true;
    }

    // === Insert mode / vim disabled: normal terminal behavior ===

    // Escape -> enter normal mode (only if vim is enabled)
    if (isVimEnabled && e.key === "Escape" && !meta && !ctrl && !e.shiftKey && !e.altKey) {
      updateVimState("normal");
      return false;
    }

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
  };
}
