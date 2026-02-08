import { create } from "zustand";
import { FileChange, FileDiff } from "../types";

interface DiffStore {
  changes: FileChange[];
  selectedFilePath: string | null;
  selectedFileDiff: FileDiff | null;
  expandedFiles: Set<string>;
  focusedIndex: number;
  isLoading: boolean;
  setChanges: (changes: FileChange[]) => void;
  setSelectedFile: (path: string | null) => void;
  setSelectedFileDiff: (diff: FileDiff | null) => void;
  toggleFileExpanded: (path: string) => void;
  setFocusedIndex: (index: number) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useDiffStore = create<DiffStore>((set) => ({
  changes: [],
  selectedFilePath: null,
  selectedFileDiff: null,
  expandedFiles: new Set<string>(),
  focusedIndex: 0,
  isLoading: false,

  setChanges: (changes) => set({ changes }),

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

  setFocusedIndex: (index) => set({ focusedIndex: index }),

  setIsLoading: (loading) => set({ isLoading: loading }),
}));
