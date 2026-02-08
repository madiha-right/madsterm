import { create } from "zustand";
import type { Tab } from "../types";

interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;
  recentlyClosedTabs: Tab[];
  addTab: (tab: Tab) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabTitle: (tabId: string, title: string) => void;
  updateTabSessionId: (tabId: string, sessionId: string) => void;
  updateTabCwd: (tabId: string, cwd: string) => void;
  reopenLastClosedTab: () => Tab | null;
  moveTab: (fromIndex: number, toIndex: number) => void;
}

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  recentlyClosedTabs: [],

  addTab: (tab) =>
    set((state) => ({
      tabs: [...state.tabs, { ...tab, isActive: true }],
      activeTabId: tab.id,
    })),

  removeTab: (tabId) =>
    set((state) => {
      const closedTab = state.tabs.find((t) => t.id === tabId);
      const filtered = state.tabs.filter((t) => t.id !== tabId);
      const newActive =
        state.activeTabId === tabId
          ? (filtered[filtered.length - 1]?.id ?? null)
          : state.activeTabId;
      return {
        tabs: filtered,
        activeTabId: newActive,
        recentlyClosedTabs: closedTab
          ? [...state.recentlyClosedTabs, closedTab].slice(-10)
          : state.recentlyClosedTabs,
      };
    }),

  setActiveTab: (tabId) =>
    set((state) => ({
      activeTabId: tabId,
      tabs: state.tabs.map((t) => ({ ...t, isActive: t.id === tabId })),
    })),

  updateTabTitle: (tabId, title) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, title } : t)),
    })),

  updateTabSessionId: (tabId, sessionId) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, sessionId } : t)),
    })),

  updateTabCwd: (tabId, cwd) =>
    set((state) => {
      const folderName = cwd.split("/").filter(Boolean).pop() || "Terminal";
      return {
        tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, cwd, title: folderName } : t)),
      };
    }),

  reopenLastClosedTab: () => {
    const state = get();
    if (state.recentlyClosedTabs.length === 0) return null;
    const tab = state.recentlyClosedTabs[state.recentlyClosedTabs.length - 1];
    set({
      recentlyClosedTabs: state.recentlyClosedTabs.slice(0, -1),
    });
    return tab;
  },

  moveTab: (fromIndex, toIndex) =>
    set((state) => {
      const tabs = [...state.tabs];
      const [moved] = tabs.splice(fromIndex, 1);
      tabs.splice(toIndex, 0, moved);
      return { tabs };
    }),
}));
