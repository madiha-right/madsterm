import { create } from "zustand";

interface SettingsStore {
  fontSize: number;
  fontFamily: string;
  copyOnSelect: boolean;
  cursorStyle: "block" | "underline" | "bar";
  cursorBlink: boolean;
  scrollbackLines: number;

  setFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  setFontFamily: (family: string) => void;
  setCopyOnSelect: (enabled: boolean) => void;
  setCursorStyle: (style: "block" | "underline" | "bar") => void;
  setCursorBlink: (blink: boolean) => void;
  setScrollbackLines: (lines: number) => void;
}

const DEFAULT_FONT_SIZE = 14;
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 32;
const FONT_SIZE_STEP = 1;

export const useSettingsStore = create<SettingsStore>((set) => ({
  fontSize: DEFAULT_FONT_SIZE,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', 'Consolas', monospace",
  copyOnSelect: false,
  cursorStyle: "block",
  cursorBlink: true,
  scrollbackLines: 10000,

  setFontSize: (size) =>
    set({ fontSize: Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, size)) }),

  increaseFontSize: () =>
    set((s) => ({
      fontSize: Math.min(MAX_FONT_SIZE, s.fontSize + FONT_SIZE_STEP),
    })),

  decreaseFontSize: () =>
    set((s) => ({
      fontSize: Math.max(MIN_FONT_SIZE, s.fontSize - FONT_SIZE_STEP),
    })),

  resetFontSize: () => set({ fontSize: DEFAULT_FONT_SIZE }),

  setFontFamily: (family) => set({ fontFamily: family }),

  setCopyOnSelect: (enabled) => set({ copyOnSelect: enabled }),

  setCursorStyle: (style) => set({ cursorStyle: style }),

  setCursorBlink: (blink) => set({ cursorBlink: blink }),

  setScrollbackLines: (lines) => set({ scrollbackLines: Math.max(100, lines) }),
}));
