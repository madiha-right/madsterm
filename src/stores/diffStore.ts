import { create } from "zustand";
import { FileChange, FileDiff } from "../types";

interface DiffStore {
  changes: FileChange[];
  selectedFilePath: string | null;
  selectedFileDiff: FileDiff | null;
  expandedFiles: Set<string>;
  fileDiffs: Map<string, FileDiff>;
  focusedIndex: number;
  isLoading: boolean;
  setChanges: (changes: FileChange[]) => void;
  setSelectedFile: (path: string | null) => void;
  setSelectedFileDiff: (diff: FileDiff | null) => void;
  toggleFileExpanded: (path: string) => void;
  setFileDiff: (path: string, diff: FileDiff) => void;
  setFocusedIndex: (index: number) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useDiffStore = create<DiffStore>((set) => ({
  changes: [],
  selectedFilePath: null,
  selectedFileDiff: null,
  expandedFiles: new Set<string>(),
  fileDiffs: new Map<string, FileDiff>(),
  focusedIndex: 0,
  isLoading: false,

  setChanges: (changes) =>
    set((state) => {
      const prev = new Set(state.changes.map((c) => c.path));
      const expanded = new Set(state.expandedFiles);
      for (const c of changes) {
        if (!prev.has(c.path)) expanded.add(c.path);
      }
      return { changes, expandedFiles: expanded };
    }),

  setSelectedFile: (path) => set({ selectedFilePath: path }),

  setSelectedFileDiff: (diff) => set({ selectedFileDiff: diff }),

  toggleFileExpanded: (path) =>
    set((state) => {
      const next = new Set(state.expandedFiles);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return { expandedFiles: next };
    }),

  setFileDiff: (path, diff) =>
    set((state) => {
      const next = new Map(state.fileDiffs);
      next.set(path, diff);
      return { fileDiffs: next };
    }),

  setFocusedIndex: (index) => set({ focusedIndex: index }),

  setIsLoading: (loading) => set({ isLoading: loading }),
}));
