import type { SearchAddon } from "@xterm/addon-search";
import { useEffect, useRef, useState } from "react";
import { usePanelStore } from "../../stores/panelStore";
import { useTabStore } from "../../stores/tabStore";
import { useThemeStore } from "../../stores/themeStore";
import { SearchBar } from "./SearchBar";
import { TerminalInstance } from "./TerminalInstance";

const SHORTCUTS = [
  { keys: "T", label: "New Tab" },
  { keys: "B", label: "Toggle Explorer" },
  { keys: "K", label: "Clear Terminal" },
  { keys: "F", label: "Find in Terminal" },
  { keys: "P", label: "Quick Search Files" },
  { keys: "Ctrl+F", label: "Fullscreen", useMeta: false },
];

const KbdBox: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useThemeStore((s) => s.theme);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        fontWeight: 400,
        color: theme.text,
        backgroundColor: theme.bgActive,
        border: `1px solid ${theme.border}`,
        borderRadius: 0,
        lineHeight: "16px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
};

const WelcomeScreen: React.FC = () => {
  const theme = useThemeStore((s) => s.theme);
  const isMac = navigator.platform.includes("Mac");
  const metaSymbol = isMac ? "\u2318" : "Ctrl+";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 28,
        userSelect: "none",
      }}
    >
      {/* Logo icon */}
      <div
        style={{
          fontSize: 56,
          fontWeight: 300,
          fontFamily: "var(--font-mono)",
          color: theme.accent,
          lineHeight: 1,
          letterSpacing: -4,
        }}
      >
        {">_"}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 400,
          color: theme.textMuted,
          letterSpacing: 6,
          textTransform: "uppercase",
        }}
      >
        MADSTERM
      </div>

      {/* Shortcut grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px 32px",
          marginTop: 4,
        }}
      >
        {SHORTCUTS.map((s) => {
          const keyCombo =
            s.useMeta === false ? `${metaSymbol}${s.keys}` : `${metaSymbol}${s.keys}`;
          return (
            <div
              key={s.keys}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <KbdBox>{keyCombo}</KbdBox>
              <span
                style={{
                  fontSize: 12,
                  color: theme.textMuted,
                  fontWeight: 400,
                }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const TerminalPanel: React.FC = () => {
  const { tabs, activeTabId, updateTabTitle, removeTab } = useTabStore();
  const setFocusedPanel = usePanelStore((s) => s.setFocusedPanel);
  const [searchVisible, setSearchVisible] = useState(false);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const searchAddonRef = useRef<SearchAddon | null>(null);

  // Listen for Cmd+F (macOS) / Ctrl+F (Win/Linux) to show search
  useEffect(() => {
    const isMac = navigator.platform.includes("Mac");
    const handler = (e: KeyboardEvent) => {
      const meta = isMac ? e.metaKey : e.ctrlKey;
      // Skip if Ctrl is also held on macOS (Cmd+Ctrl+F = fullscreen toggle)
      if (isMac && e.ctrlKey) return;
      if (meta && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setSearchVisible(true);
        setFocusTrigger((n) => n + 1);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={() => setFocusedPanel("terminal")}
    >
      {tabs.length === 0 && <WelcomeScreen />}
      {searchVisible && (
        <SearchBar
          searchAddon={searchAddonRef.current}
          focusTrigger={focusTrigger}
          onClose={() => setSearchVisible(false)}
        />
      )}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {tabs.map((tab) => (
          <TerminalInstance
            key={tab.id}
            tabId={tab.id}
            cwd={tab.cwd}
            isActive={tab.id === activeTabId}
            onTitleChange={(title) => updateTabTitle(tab.id, title)}
            onExit={() => removeTab(tab.id)}
            onSearchAddonReady={(addon) => {
              if (tab.id === activeTabId) {
                searchAddonRef.current = addon;
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};
