import { useCallback, useEffect, useRef } from "react";
import {
  type ImperativePanelHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { DiffPanel } from "./components/diff/DiffPanel";
import { FileExplorer } from "./components/explorer/FileExplorer";
import { AboutDialog } from "./components/layout/AboutDialog";
import { SettingsPanel } from "./components/layout/SettingsPanel";
import { StatusBar } from "./components/layout/StatusBar";
import { TabBar } from "./components/layout/TabBar";
import { TerminalPanel } from "./components/terminal/TerminalPanel";
import { ToastContainer } from "./components/ui/Toast";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { usePanelStore } from "./stores/panelStore";
import { useTabStore } from "./stores/tabStore";
import { useThemeStore } from "./stores/themeStore";

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export default function App() {
  const { leftPanelVisible, rightPanelVisible } = usePanelStore();
  const { tabs, activeTabId, addTab, removeTab } = useTabStore();
  const theme = useThemeStore((s) => s.theme);
  const { settingsOpen, setSettingsOpen, aboutOpen, setAboutOpen } = usePanelStore();

  const leftPanelRef = useRef<ImperativePanelHandle>(null);
  const rightPanelRef = useRef<ImperativePanelHandle>(null);

  const handleOpenSettings = useCallback(() => {
    setSettingsOpen(true);
  }, [setSettingsOpen]);

  const handleNewTab = useCallback(() => {
    const id = generateId();
    addTab({
      id,
      title: "Terminal",
      sessionId: "",
      cwd: "",
      isActive: true,
    });
  }, [addTab]);

  const handleCloseTab = useCallback(() => {
    if (activeTabId) {
      removeTab(activeTabId);
    }
  }, [activeTabId, removeTab]);

  // Create initial tab on mount
  const initializedRef = useRef(false);
  useEffect(() => {
    if (tabs.length === 0 && !initializedRef.current) {
      initializedRef.current = true;
      handleNewTab();
    }
  }, [handleNewTab, tabs.length]);

  useKeyboardShortcuts(handleNewTab, handleCloseTab, handleOpenSettings);

  // Sync panel collapse/expand with visibility state
  useEffect(() => {
    if (leftPanelVisible) {
      leftPanelRef.current?.expand();
    } else {
      leftPanelRef.current?.collapse();
    }
  }, [leftPanelVisible]);

  useEffect(() => {
    if (rightPanelVisible) {
      rightPanelRef.current?.expand();
    } else {
      rightPanelRef.current?.collapse();
    }
  }, [rightPanelVisible]);

  // Sync body background and CSS variables when theme changes
  useEffect(() => {
    document.body.style.backgroundColor = theme.bg;
    document.documentElement.style.setProperty("--accent", theme.accent);
    document.documentElement.style.setProperty("--accent-hover", theme.accentHover);
    document.documentElement.style.setProperty("--accent-glow", `${theme.accent}33`);
  }, [theme]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: theme.bg,
        color: theme.text,
        fontFamily: "var(--font-ui)",
        fontSize: 13,
      }}
    >
      <TabBar onNewTab={handleNewTab} />

      <div
        style={{
          flex: 1,
          overflow: "hidden",
          visibility: settingsOpen || aboutOpen ? "hidden" : "visible",
          pointerEvents: settingsOpen || aboutOpen ? "none" : "auto",
        }}
      >
        <PanelGroup direction="horizontal">
          <Panel
            ref={leftPanelRef}
            id="file-explorer"
            order={1}
            defaultSize={leftPanelVisible ? 20 : 0}
            minSize={15}
            maxSize={35}
            collapsible
            collapsedSize={0}
          >
            <FileExplorer />
          </Panel>
          <PanelResizeHandle
            className="resize-handle"
            hitAreaMargins={{ fine: 8, coarse: 15 }}
            disabled={!leftPanelVisible}
            style={!leftPanelVisible ? { opacity: 0, width: 0 } : undefined}
          />

          <Panel id="terminal" order={2} minSize={30}>
            <TerminalPanel />
          </Panel>

          <PanelResizeHandle
            className="resize-handle"
            hitAreaMargins={{ fine: 8, coarse: 15 }}
            disabled={!rightPanelVisible}
            style={!rightPanelVisible ? { opacity: 0, width: 0 } : undefined}
          />
          <Panel
            ref={rightPanelRef}
            id="diff-panel"
            order={3}
            defaultSize={rightPanelVisible ? 30 : 0}
            minSize={20}
            maxSize={50}
            collapsible
            collapsedSize={0}
          >
            <DiffPanel />
          </Panel>
        </PanelGroup>
      </div>

      <StatusBar />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <ToastContainer />
    </div>
  );
}
