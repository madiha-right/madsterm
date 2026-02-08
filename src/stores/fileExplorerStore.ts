import { create } from "zustand";
import type { FileNode, SearchResults } from "../types";

interface FileExplorerStore {
  rootPath: string | null;
  tree: FileNode | null;
  expandedPaths: Set<string>;
  focusedIndex: number;
  searchQuery: string;
  isSearching: boolean;
  refreshFlag: number;

  // Content search state
  contentSearchQuery: string;
  contentSearchResults: SearchResults | null;
  contentSearchLoading: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  expandedResultFiles: Set<string>;
  searchFocusedIndex: number;

  setRootPath: (path: string) => void;
  setTree: (tree: FileNode | null) => void;
  toggleExpanded: (path: string) => void;
  setExpanded: (path: string, expanded: boolean) => void;
  collapseAll: () => void;
  setFocusedIndex: (index: number) => void;
  setSearchQuery: (query: string) => void;
  setIsSearching: (searching: boolean) => void;
  refreshTree: () => void;

  // Content search actions
  setContentSearchQuery: (query: string) => void;
  setContentSearchResults: (results: SearchResults | null) => void;
  setContentSearchLoading: (loading: boolean) => void;
  toggleCaseSensitive: () => void;
  toggleWholeWord: () => void;
  toggleUseRegex: () => void;
  toggleResultFileExpanded: (path: string) => void;
  setSearchFocusedIndex: (index: number) => void;
}

export const useFileExplorerStore = create<FileExplorerStore>((set) => ({
  rootPath: null,
  tree: null,
  expandedPaths: new Set<string>(),
  focusedIndex: 0,
  searchQuery: "",
  isSearching: false,
  refreshFlag: 0,

  // Content search state
  contentSearchQuery: "",
  contentSearchResults: null,
  contentSearchLoading: false,
  caseSensitive: false,
  wholeWord: false,
  useRegex: false,
  expandedResultFiles: new Set<string>(),
  searchFocusedIndex: 0,

  setRootPath: (path) => set({ rootPath: path }),

  setTree: (tree) => set({ tree }),

  toggleExpanded: (path) =>
    set((state) => {
      const next = new Set(state.expandedPaths);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return { expandedPaths: next };
    }),

  setExpanded: (path, expanded) =>
    set((state) => {
      const next = new Set(state.expandedPaths);
      if (expanded) {
        next.add(path);
      } else {
        next.delete(path);
      }
      return { expandedPaths: next };
    }),

  collapseAll: () =>
    set((state) => {
      // Keep only the root path expanded so the top-level is still visible
      const next = new Set<string>();
      if (state.rootPath) {
        next.add(state.rootPath);
      }
      return { expandedPaths: next, focusedIndex: 0 };
    }),

  setFocusedIndex: (index) => set({ focusedIndex: index }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setIsSearching: (searching) =>
    set(
      searching
        ? { isSearching: true, searchQuery: "" }
        : {
            isSearching: false,
            searchQuery: "",
            contentSearchQuery: "",
            contentSearchResults: null,
            contentSearchLoading: false,
            expandedResultFiles: new Set<string>(),
            searchFocusedIndex: 0,
          },
    ),

  refreshTree: () => set((state) => ({ refreshFlag: state.refreshFlag + 1 })),

  // Content search actions
  setContentSearchQuery: (query) => set({ contentSearchQuery: query }),

  setContentSearchResults: (results) =>
    set(() => {
      if (!results) {
        return { contentSearchResults: null, expandedResultFiles: new Set<string>() };
      }
      // Auto-expand all file groups
      const expanded = new Set<string>(results.files.map((f) => f.path));
      return { contentSearchResults: results, expandedResultFiles: expanded };
    }),

  setContentSearchLoading: (loading) => set({ contentSearchLoading: loading }),

  toggleCaseSensitive: () => set((state) => ({ caseSensitive: !state.caseSensitive })),

  toggleWholeWord: () => set((state) => ({ wholeWord: !state.wholeWord })),

  toggleUseRegex: () => set((state) => ({ useRegex: !state.useRegex })),

  toggleResultFileExpanded: (path) =>
    set((state) => {
      const next = new Set(state.expandedResultFiles);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return { expandedResultFiles: next };
    }),

  setSearchFocusedIndex: (index) => set({ searchFocusedIndex: index }),
}));
