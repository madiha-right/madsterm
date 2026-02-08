import { beforeEach, describe, expect, it } from "vitest";
import { useTabStore } from "../tabStore";

describe("tabStore", () => {
  beforeEach(() => {
    useTabStore.setState({
      tabs: [],
      activeTabId: null,
      recentlyClosedTabs: [],
    });
  });

  it("should add a tab", () => {
    useTabStore.getState().addTab({
      id: "tab1",
      title: "Terminal",
      sessionId: "sess1",
      cwd: "/home",
      isActive: true,
    });

    const state = useTabStore.getState();
    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0].id).toBe("tab1");
    expect(state.activeTabId).toBe("tab1");
  });

  it("should remove a tab and track it in recently closed", () => {
    const { addTab } = useTabStore.getState();
    addTab({ id: "tab1", title: "T1", sessionId: "", cwd: "", isActive: true });
    addTab({ id: "tab2", title: "T2", sessionId: "", cwd: "", isActive: true });

    useTabStore.getState().removeTab("tab1");

    const state = useTabStore.getState();
    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0].id).toBe("tab2");
    expect(state.recentlyClosedTabs).toHaveLength(1);
    expect(state.recentlyClosedTabs[0].id).toBe("tab1");
  });

  it("should set active tab to last tab when removing the active one", () => {
    const { addTab } = useTabStore.getState();
    addTab({ id: "tab1", title: "T1", sessionId: "", cwd: "", isActive: true });
    addTab({ id: "tab2", title: "T2", sessionId: "", cwd: "", isActive: true });

    useTabStore.getState().removeTab("tab2");

    expect(useTabStore.getState().activeTabId).toBe("tab1");
  });

  it("should switch active tab", () => {
    const { addTab } = useTabStore.getState();
    addTab({ id: "tab1", title: "T1", sessionId: "", cwd: "", isActive: true });
    addTab({ id: "tab2", title: "T2", sessionId: "", cwd: "", isActive: true });

    useTabStore.getState().setActiveTab("tab1");
    expect(useTabStore.getState().activeTabId).toBe("tab1");
  });

  it("should update tab title", () => {
    useTabStore
      .getState()
      .addTab({ id: "tab1", title: "Terminal", sessionId: "", cwd: "", isActive: true });
    useTabStore.getState().updateTabTitle("tab1", "New Title");

    expect(useTabStore.getState().tabs[0].title).toBe("New Title");
  });

  it("should update tab CWD and derive title from folder name", () => {
    useTabStore
      .getState()
      .addTab({ id: "tab1", title: "Terminal", sessionId: "", cwd: "", isActive: true });
    useTabStore.getState().updateTabCwd("tab1", "/Users/test/projects/myapp");

    const tab = useTabStore.getState().tabs[0];
    expect(tab.cwd).toBe("/Users/test/projects/myapp");
    expect(tab.title).toBe("myapp");
  });

  it("should reopen last closed tab", () => {
    const { addTab } = useTabStore.getState();
    addTab({ id: "tab1", title: "T1", sessionId: "", cwd: "/home", isActive: true });

    useTabStore.getState().removeTab("tab1");
    const reopened = useTabStore.getState().reopenLastClosedTab();

    expect(reopened).not.toBeNull();
    expect(reopened?.id).toBe("tab1");
    expect(useTabStore.getState().recentlyClosedTabs).toHaveLength(0);
  });

  it("should move tabs", () => {
    const { addTab } = useTabStore.getState();
    addTab({ id: "tab1", title: "T1", sessionId: "", cwd: "", isActive: true });
    addTab({ id: "tab2", title: "T2", sessionId: "", cwd: "", isActive: true });
    addTab({ id: "tab3", title: "T3", sessionId: "", cwd: "", isActive: true });

    useTabStore.getState().moveTab(0, 2);

    const tabs = useTabStore.getState().tabs;
    expect(tabs[0].id).toBe("tab2");
    expect(tabs[1].id).toBe("tab3");
    expect(tabs[2].id).toBe("tab1");
  });
});
