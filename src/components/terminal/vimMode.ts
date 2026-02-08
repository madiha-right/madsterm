import type { Terminal } from "@xterm/xterm";
import { writePty } from "../../commands/pty";

export type VimMode = "normal" | "insert";

/**
 * Handle a keydown event while in vim normal mode.
 * Returns true if the key was handled (should be blocked from xterm),
 * or false if it should pass through.
 */
export function handleVimNormalMode(
  e: KeyboardEvent,
  terminal: Terminal,
  sessionId: string | null,
  gPressedRef: React.MutableRefObject<boolean>,
  updateVimState: (mode: VimMode) => void,
): boolean {
  const meta = e.metaKey;
  const ctrl = e.ctrlKey;

  // Let Cmd shortcuts through (copy, paste, etc.)
  if (meta) {
    // Still handle our custom Cmd shortcuts
    if (!e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
      terminal.clear();
      return true;
    }
    if (e.key.toLowerCase() === "c" && terminal.hasSelection()) {
      document.execCommand("copy");
      return true;
    }
    if (e.key.toLowerCase() === "v") {
      navigator.clipboard.readText().then((text) => {
        if (text && sessionId) {
          writePty(sessionId, text);
        }
      });
      return true;
    }
    if (e.key.toLowerCase() === "a") {
      terminal.selectAll();
      return true;
    }
    return false; // Let other Cmd shortcuts pass through
  }

  // Enter insert mode
  if (e.key === "i" && !ctrl) {
    updateVimState("insert");
    return true;
  }
  if (e.key === "a" && !ctrl) {
    updateVimState("insert");
    // Move cursor right one (send right arrow to PTY)
    if (sessionId) writePty(sessionId, "\x1b[C");
    return true;
  }
  if (e.key === "A" && !ctrl) {
    updateVimState("insert");
    // Move to end of line
    if (sessionId) writePty(sessionId, "\x05");
    return true;
  }
  if (e.key === "I" && !ctrl) {
    updateVimState("insert");
    // Move to beginning of line
    if (sessionId) writePty(sessionId, "\x01");
    return true;
  }
  if (e.key === "o" && !ctrl) {
    updateVimState("insert");
    // Move to end of line and press Enter
    if (sessionId) {
      writePty(sessionId, "\x05");
      writePty(sessionId, "\r");
    }
    return true;
  }
  if (e.key === "O" && !ctrl) {
    updateVimState("insert");
    // Move to beginning of line and press Enter, then move up
    if (sessionId) {
      writePty(sessionId, "\x01");
      writePty(sessionId, "\r");
      writePty(sessionId, "\x1b[A");
    }
    return true;
  }

  // g-key combos
  if (e.key === "g" && !ctrl) {
    if (gPressedRef.current) {
      // gg: scroll to top
      terminal.scrollToTop();
      gPressedRef.current = false;
    } else {
      gPressedRef.current = true;
      setTimeout(() => {
        gPressedRef.current = false;
      }, 500);
    }
    return true;
  }

  // Navigation in normal mode
  switch (e.key) {
    case "j":
    case "ArrowDown":
      if (ctrl && e.key === "j") return false; // let ctrl+j through
      terminal.scrollLines(1);
      return true;
    case "k":
    case "ArrowUp":
      if (ctrl && e.key === "k") return false;
      terminal.scrollLines(-1);
      return true;
    case "G":
      terminal.scrollToBottom();
      return true;
    case "d":
      if (ctrl) {
        // Ctrl+D: half page down
        terminal.scrollLines(Math.floor(terminal.rows / 2));
      }
      return true;
    case "u":
      if (ctrl) {
        // Ctrl+U: half page up
        terminal.scrollLines(-Math.floor(terminal.rows / 2));
      }
      return true;
    case "h":
    case "ArrowLeft":
      // Send left arrow to PTY to move cursor
      if (sessionId) writePty(sessionId, "\x1b[D");
      return true;
    case "l":
    case "ArrowRight":
      // Send right arrow to PTY to move cursor
      if (sessionId) writePty(sessionId, "\x1b[C");
      return true;
    case "w":
      // Word forward: Alt+F
      if (sessionId) writePty(sessionId, "\x1bf");
      return true;
    case "b":
      // Word backward: Alt+B
      if (sessionId) writePty(sessionId, "\x1bb");
      return true;
    case "0":
      // Beginning of line
      if (sessionId) writePty(sessionId, "\x01");
      return true;
    case "$":
      // End of line
      if (sessionId) writePty(sessionId, "\x05");
      return true;
    case "x":
      // Delete char under cursor (send Delete)
      if (sessionId) writePty(sessionId, "\x1b[3~");
      return true;
    case "X":
      // Delete char before cursor (Backspace)
      if (sessionId) writePty(sessionId, "\x7f");
      return true;
    case "c":
      if (!meta) {
        // c enters insert mode (change) - for simplicity, just enter insert mode
        updateVimState("insert");
        return true;
      }
      break;
    case "p":
      // Paste from clipboard
      if (!ctrl && !meta) {
        navigator.clipboard.readText().then((text) => {
          if (text && sessionId) {
            writePty(sessionId, text);
          }
        });
        return true;
      }
      break;
    case "/":
      // Search: trigger terminal search if search addon available
      return true;
    case "^":
      // First non-whitespace on line (same as 0 for terminal)
      if (sessionId) writePty(sessionId, "\x01");
      return true;
    default:
      // Block all other keys from reaching PTY in normal mode
      e.preventDefault();
      return true;
  }

  e.preventDefault();
  return true; // Default: block in normal mode
}
