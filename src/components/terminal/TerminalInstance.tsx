import { useEffect, useRef, useState, useCallback } from "react";
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
import { useNotificationStore } from "../../stores/notificationStore";
import "@xterm/xterm/css/xterm.css";

interface TerminalInstanceProps {
  tabId: string;
  cwd?: string;
  isActive: boolean;
  onTitleChange?: (title: string) => void;
  onExit?: () => void;
  onSearchAddonReady?: (addon: SearchAddon) => void;
}

type VimMode = "normal" | "insert";

// Shortcuts that should propagate to the app (not be consumed by xterm)
const isMac = navigator.platform.includes("Mac");
function isAppShortcut(e: KeyboardEvent): boolean {
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

export const TerminalInstance: React.FC<TerminalInstanceProps> = ({
  tabId,
  cwd,
  isActive,
  onTitleChange,
  onExit,
  onSearchAddonReady,
}) => {
  const { fontSize, fontFamily, copyOnSelect, cursorStyle, cursorBlink, scrollbackLines, vimMode } =
    useSettingsStore();
  const theme = useThemeStore((s) => s.theme);
  const updateTabCwd = useTabStore((s) => s.updateTabCwd);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const mountedRef = useRef(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [connecting, setConnecting] = useState(true);

  // Vim mode state
  const [vimState, setVimState] = useState<VimMode>("insert");
  const vimStateRef = useRef<VimMode>("insert");
  const gPressedRef = useRef(false);

  // Keep ref in sync with state
  const updateVimState = useCallback((mode: VimMode) => {
    vimStateRef.current = mode;
    setVimState(mode);
  }, []);

  useEffect(() => {
    if (!containerRef.current || mountedRef.current) return;
    mountedRef.current = true;

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
        // In normal mode, block almost all keys from reaching the PTY
        // Only allow Cmd-based shortcuts through

        // Let Cmd shortcuts through (copy, paste, etc.)
        if (meta) {
          // Still handle our custom Cmd shortcuts
          if (!e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
            terminal.clear();
            return false;
          }
          if (e.key.toLowerCase() === "c" && terminal.hasSelection()) {
            document.execCommand("copy");
            return false;
          }
          if (e.key.toLowerCase() === "v") {
            navigator.clipboard.readText().then((text) => {
              if (text && sessionIdRef.current) {
                writePty(sessionIdRef.current, text);
              }
            });
            return false;
          }
          if (e.key.toLowerCase() === "a") {
            terminal.selectAll();
            return false;
          }
          return true;
        }

        // Enter insert mode
        if (e.key === "i" && !ctrl) {
          updateVimState("insert");
          return false;
        }
        if (e.key === "a" && !ctrl) {
          updateVimState("insert");
          // Move cursor right one (send right arrow to PTY)
          if (sessionIdRef.current) writePty(sessionIdRef.current, "\x1b[C");
          return false;
        }
        if (e.key === "A" && !ctrl) {
          updateVimState("insert");
          // Move to end of line
          if (sessionIdRef.current) writePty(sessionIdRef.current, "\x05");
          return false;
        }
        if (e.key === "I" && !ctrl) {
          updateVimState("insert");
          // Move to beginning of line
          if (sessionIdRef.current) writePty(sessionIdRef.current, "\x01");
          return false;
        }
        if (e.key === "o" && !ctrl) {
          updateVimState("insert");
          // Move to end of line and press Enter
          if (sessionIdRef.current) {
            writePty(sessionIdRef.current, "\x05");
            writePty(sessionIdRef.current, "\r");
          }
          return false;
        }
        if (e.key === "O" && !ctrl) {
          updateVimState("insert");
          // Move to beginning of line and press Enter, then move up
          if (sessionIdRef.current) {
            writePty(sessionIdRef.current, "\x01");
            writePty(sessionIdRef.current, "\r");
            writePty(sessionIdRef.current, "\x1b[A");
          }
          return false;
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
          return false;
        }

        // Navigation in normal mode
        switch (e.key) {
          case "j":
          case "ArrowDown":
            if (ctrl && e.key === "j") break; // let ctrl+j through
            terminal.scrollLines(1);
            return false;
          case "k":
          case "ArrowUp":
            if (ctrl && e.key === "k") break;
            terminal.scrollLines(-1);
            return false;
          case "G":
            terminal.scrollToBottom();
            return false;
          case "d":
            if (ctrl) {
              // Ctrl+D: half page down
              terminal.scrollLines(Math.floor(terminal.rows / 2));
              return false;
            }
            return false;
          case "u":
            if (ctrl) {
              // Ctrl+U: half page up
              terminal.scrollLines(-Math.floor(terminal.rows / 2));
              return false;
            }
            return false;
          case "h":
          case "ArrowLeft":
            // Send left arrow to PTY to move cursor
            if (sessionIdRef.current) writePty(sessionIdRef.current, "\x1b[D");
            return false;
          case "l":
          case "ArrowRight":
            // Send right arrow to PTY to move cursor
            if (sessionIdRef.current) writePty(sessionIdRef.current, "\x1b[C");
            return false;
          case "w":
            // Word forward: Alt+F
            if (sessionIdRef.current) writePty(sessionIdRef.current, "\x1bf");
            return false;
          case "b":
            // Word backward: Alt+B
            if (sessionIdRef.current) writePty(sessionIdRef.current, "\x1bb");
            return false;
          case "0":
            // Beginning of line
            if (sessionIdRef.current) writePty(sessionIdRef.current, "\x01");
            return false;
          case "$":
            // End of line
            if (sessionIdRef.current) writePty(sessionIdRef.current, "\x05");
            return false;
          case "x":
            // Delete char under cursor (send Delete)
            if (sessionIdRef.current) writePty(sessionIdRef.current, "\x1b[3~");
            return false;
          case "X":
            // Delete char before cursor (Backspace)
            if (sessionIdRef.current) writePty(sessionIdRef.current, "\x7f");
            return false;
          case "c":
            if (!meta) {
              // c enters insert mode (change) - for simplicity, just enter insert mode
              updateVimState("insert");
              return false;
            }
            break;
          case "p":
            // Paste from clipboard
            if (!ctrl && !meta) {
              navigator.clipboard.readText().then((text) => {
                if (text && sessionIdRef.current) {
                  writePty(sessionIdRef.current, text);
                }
              });
              return false;
            }
            break;
          case "/":
            // Search: trigger terminal search if search addon available
            return false;
          case "^":
            // First non-whitespace on line (same as 0 for terminal)
            if (sessionIdRef.current) writePty(sessionIdRef.current, "\x01");
            return false;
          default:
            // Block all other keys from reaching PTY in normal mode
            e.preventDefault();
            return false;
        }

        e.preventDefault();
        return false; // Default: block in normal mode
      }

      // === Insert mode / vim disabled: normal terminal behavior ===

      // Escape → enter normal mode (only if vim is enabled)
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

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;
    searchAddonRef.current = searchAddon;
    onSearchAddonReady?.(searchAddon);

    let unlistenOutput: (() => void) | null = null;
    let unlistenExit: (() => void) | null = null;
    let ptyInitialized = false;

    const initPty = async (cols: number, rows: number) => {
      if (ptyInitialized) return;
      ptyInitialized = true;
      try {
        const sessionId = await createPtySession(cols, rows, cwd);
        sessionIdRef.current = sessionId;
        setConnecting(false);

        const unlisten1 = await onPtyOutput(sessionId, (data) => {
          terminal.write(data);
        });
        unlistenOutput = unlisten1;

        const unlisten2 = await onPtyExit(sessionId, () => {
          terminal.write("\r\n\x1b[90m[Process completed]\x1b[0m\r\n");
          setSessionEnded(true);
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
        ptyInitialized = false;
        setConnecting(false);
        const msg = typeof err === "string" ? err : err?.message || JSON.stringify(err);
        terminal.write(`\x1b[31mPTY Error: ${msg}\x1b[0m\r\n`);
        addNotification({ type: "error", message: `Failed to create terminal session: ${msg}` });
        setSessionEnded(true);
      }
    };

    // Delay PTY creation until container has real layout dimensions.
    // Use requestAnimationFrame after open() to ensure the container is measured,
    // then fit and create the PTY with correct cols/rows.
    requestAnimationFrame(() => {
      fitAddon.fit();
      initPty(terminal.cols, terminal.rows);
    });

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

  // Update cursor style based on vim mode
  useEffect(() => {
    if (!terminalRef.current) return;

    if (!vimMode) {
      terminalRef.current.options.cursorStyle = cursorStyle;
      terminalRef.current.options.cursorBlink = cursorBlink;
      return;
    }

    if (vimState === "normal") {
      terminalRef.current.options.cursorStyle = "block";
      terminalRef.current.options.cursorBlink = false;
    } else {
      terminalRef.current.options.cursorStyle = cursorStyle;
      terminalRef.current.options.cursorBlink = cursorBlink;
    }
  }, [vimState, vimMode, cursorStyle, cursorBlink]);

  return (
    <div
      role="tabpanel"
      aria-label="Terminal session"
      style={{
        width: "100%",
        height: "100%",
        display: isActive ? "flex" : "none",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        ref={containerRef}
        data-tab-id={tabId}
        style={{
          width: "100%",
          flex: 1,
          overflow: "hidden",
          padding: 0,
        }}
      />
      {/* Vim mode indicator */}
      {vimMode && isActive && (
        <div
          style={{
            position: "absolute",
            bottom: sessionEnded ? 40 : 6,
            right: 10,
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            letterSpacing: "0.5px",
            color: vimState === "normal" ? theme.bg : theme.bg,
            backgroundColor: vimState === "normal" ? theme.accent : theme.diffAddedText,
            opacity: 0.9,
            pointerEvents: "none",
            zIndex: 10,
            textTransform: "uppercase",
          }}
        >
          {vimState === "normal" ? "VIM" : "INSERT"}
        </div>
      )}
      {connecting && !sessionEnded && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 12,
            fontSize: 11,
            color: theme.textMuted,
            fontFamily: "var(--font-ui)",
            pointerEvents: "none",
            opacity: 0.7,
            animation: "connecting-pulse 1.5s ease-in-out infinite",
          }}
        >
          Connecting...
        </div>
      )}
      {sessionEnded && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "6px 12px",
            backgroundColor: theme.bgSurface,
            borderTop: `1px solid ${theme.border}`,
            fontSize: 12,
            color: theme.textMuted,
            fontFamily: "var(--font-ui)",
          }}
        >
          <span>Session ended</span>
          <button
            aria-label="Close ended session"
            onClick={() => {
              setSessionEnded(false);
              onExit?.();
            }}
            style={{
              padding: "3px 10px",
              fontSize: 11,
              border: `1px solid ${theme.border}`,
              background: theme.bgActive,
              color: theme.text,
              cursor: "pointer",
              fontFamily: "var(--font-ui)",
            }}
          >
            Close tab
          </button>
        </div>
      )}
      <style>{`
        @keyframes connecting-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};
