import { beforeEach, describe, expect, it } from "vitest";
import { useContentSearchStore } from "../contentSearchStore";

describe("contentSearchStore", () => {
  beforeEach(() => {
    useContentSearchStore.setState({
      contentSearchQuery: "",
      contentSearchResults: null,
      contentSearchLoading: false,
      caseSensitive: false,
      wholeWord: false,
      useRegex: false,
      expandedResultFiles: new Set(),
      searchFocusedIndex: 0,
    });
  });

  it("should update query with setContentSearchQuery", () => {
    useContentSearchStore.getState().setContentSearchQuery("hello");
    expect(useContentSearchStore.getState().contentSearchQuery).toBe("hello");
  });

  it("should toggle loading with setContentSearchLoading", () => {
    useContentSearchStore.getState().setContentSearchLoading(true);
    expect(useContentSearchStore.getState().contentSearchLoading).toBe(true);

    useContentSearchStore.getState().setContentSearchLoading(false);
    expect(useContentSearchStore.getState().contentSearchLoading).toBe(false);
  });

  it("should flip caseSensitive with toggleCaseSensitive", () => {
    expect(useContentSearchStore.getState().caseSensitive).toBe(false);
    useContentSearchStore.getState().toggleCaseSensitive();
    expect(useContentSearchStore.getState().caseSensitive).toBe(true);
    useContentSearchStore.getState().toggleCaseSensitive();
    expect(useContentSearchStore.getState().caseSensitive).toBe(false);
  });

  it("should flip wholeWord with toggleWholeWord", () => {
    expect(useContentSearchStore.getState().wholeWord).toBe(false);
    useContentSearchStore.getState().toggleWholeWord();
    expect(useContentSearchStore.getState().wholeWord).toBe(true);
    useContentSearchStore.getState().toggleWholeWord();
    expect(useContentSearchStore.getState().wholeWord).toBe(false);
  });

  it("should flip useRegex with toggleUseRegex", () => {
    expect(useContentSearchStore.getState().useRegex).toBe(false);
    useContentSearchStore.getState().toggleUseRegex();
    expect(useContentSearchStore.getState().useRegex).toBe(true);
    useContentSearchStore.getState().toggleUseRegex();
    expect(useContentSearchStore.getState().useRegex).toBe(false);
  });

  it("should auto-expand all file paths when setting search results", () => {
    const results = {
      files: [
        { path: "src/foo.ts", absolutePath: "/abs/src/foo.ts", matches: [] },
        { path: "src/bar.ts", absolutePath: "/abs/src/bar.ts", matches: [] },
      ],
      totalMatches: 5,
      totalFiles: 2,
      truncated: false,
    };

    useContentSearchStore.getState().setContentSearchResults(results);

    const state = useContentSearchStore.getState();
    expect(state.contentSearchResults).toEqual(results);
    expect(state.expandedResultFiles.has("src/foo.ts")).toBe(true);
    expect(state.expandedResultFiles.has("src/bar.ts")).toBe(true);
    expect(state.expandedResultFiles.size).toBe(2);
  });

  it("should clear results and expandedResultFiles when setting results to null", () => {
    // First set some results
    useContentSearchStore.getState().setContentSearchResults({
      files: [{ path: "src/foo.ts", absolutePath: "/abs/src/foo.ts", matches: [] }],
      totalMatches: 1,
      totalFiles: 1,
      truncated: false,
    });

    useContentSearchStore.getState().setContentSearchResults(null);

    const state = useContentSearchStore.getState();
    expect(state.contentSearchResults).toBeNull();
    expect(state.expandedResultFiles.size).toBe(0);
  });

  it("should toggle file expansion with toggleResultFileExpanded", () => {
    // Add a path
    useContentSearchStore.getState().toggleResultFileExpanded("src/foo.ts");
    expect(useContentSearchStore.getState().expandedResultFiles.has("src/foo.ts")).toBe(true);

    // Remove it
    useContentSearchStore.getState().toggleResultFileExpanded("src/foo.ts");
    expect(useContentSearchStore.getState().expandedResultFiles.has("src/foo.ts")).toBe(false);
  });

  it("should update index with setSearchFocusedIndex", () => {
    useContentSearchStore.getState().setSearchFocusedIndex(5);
    expect(useContentSearchStore.getState().searchFocusedIndex).toBe(5);
  });

  it("should clear all state back to defaults with resetContentSearch", () => {
    // Set some non-default state
    useContentSearchStore.getState().setContentSearchQuery("test");
    useContentSearchStore.getState().setContentSearchLoading(true);
    useContentSearchStore.getState().toggleCaseSensitive();
    useContentSearchStore.getState().setSearchFocusedIndex(3);

    useContentSearchStore.getState().resetContentSearch();

    const state = useContentSearchStore.getState();
    expect(state.contentSearchQuery).toBe("");
    expect(state.contentSearchResults).toBeNull();
    expect(state.contentSearchLoading).toBe(false);
    expect(state.expandedResultFiles.size).toBe(0);
    expect(state.searchFocusedIndex).toBe(0);
  });
});
