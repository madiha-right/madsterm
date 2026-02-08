import { describe, it, expect, beforeEach } from "vitest";
import { useFileExplorerStore } from "../fileExplorerStore";

describe("fileExplorerStore", () => {
  beforeEach(() => {
    useFileExplorerStore.setState({
      rootPath: null,
      tree: null,
      expandedPaths: new Set(),
      focusedIndex: 0,
      searchQuery: "",
      isSearching: false,
      refreshFlag: 0,
    });
  });

  it("should set root path", () => {
    useFileExplorerStore.getState().setRootPath("/home/user/project");
    expect(useFileExplorerStore.getState().rootPath).toBe("/home/user/project");
  });

  it("should toggle expanded path", () => {
    useFileExplorerStore.getState().toggleExpanded("/home/user/src");
    expect(useFileExplorerStore.getState().expandedPaths.has("/home/user/src")).toBe(true);

    useFileExplorerStore.getState().toggleExpanded("/home/user/src");
    expect(useFileExplorerStore.getState().expandedPaths.has("/home/user/src")).toBe(false);
  });

  it("should set expanded explicitly", () => {
    useFileExplorerStore.getState().setExpanded("/home/user/src", true);
    expect(useFileExplorerStore.getState().expandedPaths.has("/home/user/src")).toBe(true);

    useFileExplorerStore.getState().setExpanded("/home/user/src", false);
    expect(useFileExplorerStore.getState().expandedPaths.has("/home/user/src")).toBe(false);
  });

  it("should collapse all but keep root", () => {
    useFileExplorerStore.getState().setRootPath("/home/user");
    useFileExplorerStore.getState().setExpanded("/home/user", true);
    useFileExplorerStore.getState().setExpanded("/home/user/src", true);
    useFileExplorerStore.getState().setExpanded("/home/user/test", true);

    useFileExplorerStore.getState().collapseAll();

    const expanded = useFileExplorerStore.getState().expandedPaths;
    expect(expanded.size).toBe(1);
    expect(expanded.has("/home/user")).toBe(true);
    expect(useFileExplorerStore.getState().focusedIndex).toBe(0);
  });

  it("should set and clear search query", () => {
    useFileExplorerStore.getState().setSearchQuery("test");
    expect(useFileExplorerStore.getState().searchQuery).toBe("test");

    useFileExplorerStore.getState().setSearchQuery("");
    expect(useFileExplorerStore.getState().searchQuery).toBe("");
  });

  it("should toggle searching mode", () => {
    useFileExplorerStore.getState().setIsSearching(true);
    expect(useFileExplorerStore.getState().isSearching).toBe(true);

    useFileExplorerStore.getState().setIsSearching(false);
    expect(useFileExplorerStore.getState().isSearching).toBe(false);
  });

  it("should increment refresh flag", () => {
    const initial = useFileExplorerStore.getState().refreshFlag;
    useFileExplorerStore.getState().refreshTree();
    expect(useFileExplorerStore.getState().refreshFlag).toBe(initial + 1);
  });
});
