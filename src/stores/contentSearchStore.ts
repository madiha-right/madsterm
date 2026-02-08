import { create } from "zustand";
import type { SearchResults } from "../types";

interface ContentSearchStore {
  contentSearchQuery: string;
  contentSearchResults: SearchResults | null;
  contentSearchLoading: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  expandedResultFiles: Set<string>;
  searchFocusedIndex: number;

  setContentSearchQuery: (query: string) => void;
  setContentSearchResults: (results: SearchResults | null) => void;
  setContentSearchLoading: (loading: boolean) => void;
  toggleCaseSensitive: () => void;
  toggleWholeWord: () => void;
  toggleUseRegex: () => void;
  toggleResultFileExpanded: (path: string) => void;
  setSearchFocusedIndex: (index: number) => void;
  resetContentSearch: () => void;
}

export const useContentSearchStore = create<ContentSearchStore>((set) => ({
  contentSearchQuery: "",
  contentSearchResults: null,
  contentSearchLoading: false,
  caseSensitive: false,
  wholeWord: false,
  useRegex: false,
  expandedResultFiles: new Set<string>(),
  searchFocusedIndex: 0,

  setContentSearchQuery: (query) => set({ contentSearchQuery: query }),

  setContentSearchResults: (results) =>
    set(() => {
      if (!results) {
        return {
          contentSearchResults: null,
          expandedResultFiles: new Set<string>(),
        };
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

  resetContentSearch: () =>
    set({
      contentSearchQuery: "",
      contentSearchResults: null,
      contentSearchLoading: false,
      expandedResultFiles: new Set<string>(),
      searchFocusedIndex: 0,
    }),
}));
