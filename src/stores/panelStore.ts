import { create } from "zustand";

interface PanelStore {
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;
  focusedPanel: "terminal" | "explorer" | "diff";
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setFocusedPanel: (panel: "terminal" | "explorer" | "diff") => void;
}

export const usePanelStore = create<PanelStore>((set) => ({
  leftPanelVisible: true,
  rightPanelVisible: false,
  focusedPanel: "terminal",

  toggleLeftPanel: () =>
    set((s) => {
      const willBeVisible = !s.leftPanelVisible;
      return {
        leftPanelVisible: willBeVisible,
        focusedPanel: willBeVisible ? "explorer" : "terminal",
      };
    }),

  toggleRightPanel: () =>
    set((s) => {
      const willBeVisible = !s.rightPanelVisible;
      return {
        rightPanelVisible: willBeVisible,
        focusedPanel: willBeVisible ? "diff" : "terminal",
      };
    }),

  setFocusedPanel: (panel) => set({ focusedPanel: panel }),
}));
