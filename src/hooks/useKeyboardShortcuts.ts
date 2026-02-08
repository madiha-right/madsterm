import { useEffect } from "react";
import { usePanelStore } from "../stores/panelStore";
import { useTabStore } from "../stores/tabStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useFileExplorerStore } from "../stores/fileExplorerStore";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function useKeyboardShortcuts(onNewTab: () => void, onCloseTab: () => void) {
  const toggleLeftPanel = usePanelStore((s) => s.toggleLeftPanel);
  const toggleRightPanel = usePanelStore((s) => s.toggleRightPanel);
  const { tabs, activeTabId, setActiveTab, reopenLastClosedTab, addTab } = useTabStore();
  const { increaseFontSize, decreaseFontSize, resetFontSize } = useSettingsStore();
  const setIsSearching = useFileExplorerStore((s) => s.setIsSearching);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;

      // Cmd+Ctrl+F -> Toggle fullscreen (must be checked BEFORE meta-only checks)
      if (e.ctrlKey && e.metaKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const win = getCurrentWindow();
        win.isFullscreen().then(isFs => win.setFullscreen(!isFs));
        return;
      }

      // Cmd+P -> Toggle explorer and focus search (must check before other meta shortcuts)
      if (!e.shiftKey && !e.altKey && e.key === "p") {
        e.preventDefault();
        // Make sure left panel is visible
        if (!usePanelStore.getState().leftPanelVisible) {
          toggleLeftPanel();
        }
        // Trigger search mode in explorer
        setIsSearching(true);
        return;
      }

      // Cmd+T -> new tab
      if (!e.shiftKey && !e.altKey && e.key === "t") {
        e.preventDefault();
        onNewTab();
        return;
      }

      // Cmd+Shift+T -> reopen last closed tab
      if (e.shiftKey && !e.altKey && (e.key === "T" || e.key === "t")) {
        e.preventDefault();
        const tab = reopenLastClosedTab();
        if (tab) {
          const id = Math.random().toString(36).substring(2, 10);
          addTab({
            id,
            title: tab.title || "Terminal",
            sessionId: "",
            cwd: tab.cwd,
            isActive: true,
          });
        }
        return;
      }

      // Cmd+W -> close tab
      if (!e.shiftKey && !e.altKey && e.key === "w") {
        e.preventDefault();
        onCloseTab();
        return;
      }

      // Cmd+B -> toggle file explorer
      if (!e.shiftKey && !e.altKey && e.key === "b") {
        e.preventDefault();
        toggleLeftPanel();
        return;
      }

      // Cmd+Shift+E -> toggle file explorer (alias)
      if (e.shiftKey && !e.altKey && (e.key === "E" || e.key === "e")) {
        e.preventDefault();
        toggleLeftPanel();
        return;
      }

      // Cmd+Shift+= (plus) -> toggle diff/changes panel
      if (e.shiftKey && !e.altKey && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        toggleRightPanel();
        return;
      }

      // Cmd+= or Cmd++ -> increase font size
      if (!e.shiftKey && !e.altKey && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        increaseFontSize();
        return;
      }

      // Cmd+- -> decrease font size
      if (!e.shiftKey && !e.altKey && e.key === "-") {
        e.preventDefault();
        decreaseFontSize();
        return;
      }

      // Cmd+0 -> reset font size
      if (!e.shiftKey && !e.altKey && e.key === "0") {
        e.preventDefault();
        resetFontSize();
        return;
      }

      // Cmd+1-9 -> switch to tab N
      if (!e.shiftKey && !e.altKey && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (idx < tabs.length) {
          setActiveTab(tabs[idx].id);
        }
        return;
      }

      // Cmd+Alt+Left / Cmd+[ -> previous tab (wraps around)
      if ((e.altKey && e.key === "ArrowLeft") || (!e.altKey && e.key === "[")) {
        e.preventDefault();
        const currentIdx = tabs.findIndex((t) => t.id === activeTabId);
        if (tabs.length > 0) {
          const prevIdx = currentIdx <= 0 ? tabs.length - 1 : currentIdx - 1;
          setActiveTab(tabs[prevIdx].id);
        }
        return;
      }

      // Cmd+Alt+Right / Cmd+] -> next tab (wraps around)
      if ((e.altKey && e.key === "ArrowRight") || (!e.altKey && e.key === "]")) {
        e.preventDefault();
        const currentIdx = tabs.findIndex((t) => t.id === activeTabId);
        if (tabs.length > 0) {
          const nextIdx = currentIdx >= tabs.length - 1 ? 0 : currentIdx + 1;
          setActiveTab(tabs[nextIdx].id);
        }
        return;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [toggleLeftPanel, toggleRightPanel, onNewTab, onCloseTab, tabs, activeTabId, setActiveTab, reopenLastClosedTab, addTab, increaseFontSize, decreaseFontSize, resetFontSize, setIsSearching]);
}
