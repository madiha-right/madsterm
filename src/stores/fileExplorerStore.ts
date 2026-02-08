import { create } from "zustand";
import type { FileNode } from "../types";
import { useContentSearchStore } from "./contentSearchStore";

interface FileExplorerStore {
  rootPath: string | null;
  tree: FileNode | null;
  expandedPaths: Set<string>;
  focusedIndex: number;
  searchQuery: string;
  isSearching: boolean;
  refreshFlag: number;

  setRootPath: (path: string) => void;
  setTree: (tree: FileNode | null) => void;
  toggleExpanded: (path: string) => void;
  setExpanded: (path: string, expanded: boolean) => void;
  collapseAll: () => void;
  setFocusedIndex: (index: number) => void;
  setSearchQuery: (query: string) => void;
  setIsSearching: (searching: boolean) => void;
  refreshTree: () => void;
}

export const useFileExplorerStore = create<FileExplorerStore>((set) => ({
  rootPath: null,
  tree: null,
  expandedPaths: new Set<string>(),
  focusedIndex: 0,
  searchQuery: "",
  isSearching: false,
  refreshFlag: 0,

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

  setIsSearching: (searching) => {
    if (searching) {
      set({ isSearching: true, searchQuery: "" });
    } else {
      set({ isSearching: false, searchQuery: "" });
      useContentSearchStore.getState().resetContentSearch();
    }
  },

  refreshTree: () => set((state) => ({ refreshFlag: state.refreshFlag + 1 })),
}));
