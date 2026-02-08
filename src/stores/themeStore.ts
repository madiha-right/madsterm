import { create } from "zustand";
import { type AppTheme, THEMES, type ThemeId } from "../theme/themes";

interface ThemeStore {
  themeId: ThemeId;
  theme: AppTheme;
  setTheme: (id: ThemeId) => void;
}

const STORAGE_KEY = "madsterm-theme-id";

function loadSavedThemeId(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in THEMES) return saved as ThemeId;
  } catch {
    // localStorage unavailable, use default
  }
  return "paradigm";
}

const initialId = loadSavedThemeId();

export const useThemeStore = create<ThemeStore>((set) => ({
  themeId: initialId,
  theme: THEMES[initialId],
  setTheme: (id) => {
    localStorage.setItem(STORAGE_KEY, id);
    set({ themeId: id, theme: THEMES[id] });
  },
}));
