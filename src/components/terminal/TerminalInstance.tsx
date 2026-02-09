import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { WebglAddon } from "@xterm/addon-webgl";
import { Terminal } from "@xterm/xterm";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNotificationStore } from "../../stores/notificationStore";
import { usePanelStore } from "../../stores/panelStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useTabStore } from "../../stores/tabStore";
import { useThemeStore } from "../../stores/themeStore";
import { createKeyEventHandler } from "./keyHandler";
import { cleanupPty, initPty } from "./ptyLifecycle";
import type { VimMode } from "./vimMode";
import "@xterm/xterm/css/xterm.css";

interface TerminalInstanceProps {
  tabId: string;
  cwd?: string;
  isActive: boolean;
  onTitleChange?: (title: string) => void;
  onExit?: () => void;
  onSearchAddonReady?: (addon: SearchAddon) => void;
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: Terminal creation is a one-time mount effect. Reactive changes (fontSize, fontFamily, theme, cursor) are handled by dedicated useEffect hooks below.
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

    // Attach key event handler
    const keyHandler = createKeyEventHandler({
      terminal,
      sessionIdRef,
      vimStateRef,
      gPressedRef,
      updateVimState,
    });
    terminal.attachCustomKeyEventHandler(keyHandler);

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

    const cleanupRefs = {
      unlistenOutput: null as (() => void) | null,
      unlistenExit: null as (() => void) | null,
    };
    let ptyInitialized = false;

    const startPty = async (cols: number, rows: number) => {
      if (ptyInitialized) return;
      ptyInitialized = true;
      try {
        await initPty(
          terminal,
          cols,
          rows,
          cwd,
          {
            onConnected: (sessionId) => {
              sessionIdRef.current = sessionId;
              setConnecting(false);
            },
            onSessionEnded: () => {
              setSessionEnded(true);
            },
            onError: () => {},
            onTitleChange,
            updateTabCwd,
            tabId,
            copyOnSelect,
          },
          cleanupRefs,
        );
      } catch (err: any) {
        ptyInitialized = false;
        setConnecting(false);
        const msg = typeof err === "string" ? err : err?.message || JSON.stringify(err);
        terminal.write(`\x1b[31mPTY Error: ${msg}\x1b[0m\r\n`);
        addNotification({
          type: "error",
          message: `Failed to create terminal session: ${msg}`,
        });
        setSessionEnded(true);
      }
    };

    // Delay PTY creation until container has real layout dimensions.
    // Use requestAnimationFrame after open() to ensure the container is measured,
    // then fit and create the PTY with correct cols/rows.
    requestAnimationFrame(() => {
      fitAddon.fit();
      startPty(terminal.cols, terminal.rows);
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
      cleanupPty(sessionIdRef, cleanupRefs);
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
      searchAddonRef.current = null;
    };
  }, []);

  // Focus terminal when it becomes the active tab
  const modalOpen = usePanelStore((s) => s.settingsOpen || s.aboutOpen);
  useEffect(() => {
    if (isActive && !modalOpen && terminalRef.current) {
      terminalRef.current.focus();
      fitAddonRef.current?.fit();
    }
  }, [isActive, modalOpen]);

  // Focus terminal when panel focus returns to terminal
  const focusedPanel = usePanelStore((s) => s.focusedPanel);
  useEffect(() => {
    if (isActive && !modalOpen && focusedPanel === "terminal" && terminalRef.current) {
      // Small delay to let panel transitions complete
      requestAnimationFrame(() => {
        terminalRef.current?.focus();
      });
    }
  }, [focusedPanel, isActive, modalOpen]);

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
