import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type AppTheme, THEMES, type ThemeId } from "../theme/themes";

interface ThemeStore {
  themeId: ThemeId;
  theme: AppTheme;
  setTheme: (id: ThemeId) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      themeId: "paradigm" as ThemeId,
      theme: THEMES.paradigm,
      setTheme: (id: ThemeId) => set({ themeId: id, theme: THEMES[id] }),
    }),
    {
      name: "madsterm-theme",
      partialize: (state) => ({ themeId: state.themeId }),
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<ThemeStore>) };
        merged.theme = THEMES[merged.themeId] || THEMES.paradigm;
        return merged;
      },
    },
  ),
);
