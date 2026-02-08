import { useEffect, useRef } from "react";
import { usePanelStore } from "../stores/panelStore";
import { useTabStore } from "../stores/tabStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useFileExplorerStore } from "../stores/fileExplorerStore";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function useKeyboardShortcuts(
  onNewTab: () => void,
  onCloseTab: () => void,
  onOpenSettings?: () => void,
) {
  const toggleLeftPanel = usePanelStore((s) => s.toggleLeftPanel);
  const toggleRightPanel = usePanelStore((s) => s.toggleRightPanel);
  const { tabs, activeTabId, setActiveTab, reopenLastClosedTab, addTab } = useTabStore();
  const { increaseFontSize, decreaseFontSize, resetFontSize } = useSettingsStore();
  const setIsSearching = useFileExplorerStore((s) => s.setIsSearching);
  const toggleCaseSensitive = useFileExplorerStore((s) => s.toggleCaseSensitive);
  const toggleWholeWord = useFileExplorerStore((s) => s.toggleWholeWord);
  const toggleUseRegex = useFileExplorerStore((s) => s.toggleUseRegex);

  // Use refs for frequently-changing values to avoid recreating the listener
  const tabsRef = useRef(tabs);
  const activeTabIdRef = useRef(activeTabId);
  tabsRef.current = tabs;
  activeTabIdRef.current = activeTabId;

  useEffect(() => {
    const isMac = navigator.platform.includes("Mac");
    const handler = (e: KeyboardEvent) => {
      // On macOS, only Cmd triggers app shortcuts. On Windows/Linux, Ctrl does.
      const meta = isMac ? e.metaKey : e.ctrlKey;
      if (!meta) return;

      // Cmd+Ctrl+F -> Toggle fullscreen (macOS only, must be checked BEFORE meta-only checks)
      if (isMac && e.ctrlKey && e.metaKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const win = getCurrentWindow();
        win.isFullscreen().then((isFs) => win.setFullscreen(!isFs));
        return;
      }

      // Cmd+, -> Open settings
      if (!e.shiftKey && !e.altKey && e.key === ",") {
        e.preventDefault();
        onOpenSettings?.();
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
        setIsSearching(false);
        return;
      }

      // Cmd+Shift+E -> toggle file explorer (alias)
      if (e.shiftKey && !e.altKey && (e.key === "E" || e.key === "e")) {
        e.preventDefault();
        if (usePanelStore.getState().leftPanelVisible) {
          // Panel already open — if searching, switch to explorer mode; otherwise close
          if (useFileExplorerStore.getState().isSearching) {
            setIsSearching(false);
          } else {
            toggleLeftPanel();
          }
        } else {
          toggleLeftPanel();
          setIsSearching(false);
        }
        return;
      }

      // Cmd+Shift+F -> Global search (open explorer + activate search)
      if (e.shiftKey && !e.altKey && (e.key === "F" || e.key === "f")) {
        e.preventDefault();
        if (!usePanelStore.getState().leftPanelVisible) {
          toggleLeftPanel();
        }
        setIsSearching(true);
        return;
      }

      // Alt+Cmd+C -> Toggle case sensitive search
      if (e.altKey && !e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        toggleCaseSensitive();
        return;
      }

      // Alt+Cmd+W -> Toggle whole word search
      if (e.altKey && !e.shiftKey && e.key.toLowerCase() === "w") {
        e.preventDefault();
        toggleWholeWord();
        return;
      }

      // Alt+Cmd+R -> Toggle regex search
      if (e.altKey && !e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        toggleUseRegex();
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
        const currentTabs = tabsRef.current;
        if (idx < currentTabs.length) {
          setActiveTab(currentTabs[idx].id);
        }
        return;
      }

      // Cmd+Alt+Left / Cmd+[ -> previous tab (wraps around)
      if ((e.altKey && e.key === "ArrowLeft") || (!e.altKey && e.key === "[")) {
        e.preventDefault();
        const currentTabs = tabsRef.current;
        const currentActiveId = activeTabIdRef.current;
        const currentIdx = currentTabs.findIndex((t) => t.id === currentActiveId);
        if (currentTabs.length > 0) {
          const prevIdx = currentIdx <= 0 ? currentTabs.length - 1 : currentIdx - 1;
          setActiveTab(currentTabs[prevIdx].id);
        }
        return;
      }

      // Cmd+Alt+Right / Cmd+] -> next tab (wraps around)
      if ((e.altKey && e.key === "ArrowRight") || (!e.altKey && e.key === "]")) {
        e.preventDefault();
        const currentTabs = tabsRef.current;
        const currentActiveId = activeTabIdRef.current;
        const currentIdx = currentTabs.findIndex((t) => t.id === currentActiveId);
        if (currentTabs.length > 0) {
          const nextIdx = currentIdx >= currentTabs.length - 1 ? 0 : currentIdx + 1;
          setActiveTab(currentTabs[nextIdx].id);
        }
        return;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [
    toggleLeftPanel,
    toggleRightPanel,
    onNewTab,
    onCloseTab,
    onOpenSettings,
    setActiveTab,
    reopenLastClosedTab,
    addTab,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    setIsSearching,
    toggleCaseSensitive,
    toggleWholeWord,
    toggleUseRegex,
  ]);
}
