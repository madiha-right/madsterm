import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PanelState {
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;
  settingsOpen: boolean;
  aboutOpen: boolean;
  focusedPanel: "terminal" | "explorer" | "diff";
}

interface PanelActions {
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setSettingsOpen: (open: boolean) => void;
  setAboutOpen: (open: boolean) => void;
  setFocusedPanel: (panel: "terminal" | "explorer" | "diff") => void;
}

type PanelStore = PanelState & PanelActions;

export const usePanelStore = create<PanelStore>()(
  persist(
    (set) => ({
      leftPanelVisible: true,
      rightPanelVisible: false,
      settingsOpen: false,
      aboutOpen: false,
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

      setSettingsOpen: (open) => set({ settingsOpen: open }),
      setAboutOpen: (open) => set({ aboutOpen: open }),
      setFocusedPanel: (panel) => set({ focusedPanel: panel }),
    }),
    {
      name: "madsterm-panels",
      partialize: (state) => ({
        leftPanelVisible: state.leftPanelVisible,
        rightPanelVisible: state.rightPanelVisible,
      }),
    },
  ),
);
