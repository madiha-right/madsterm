import { beforeEach, describe, expect, it } from "vitest";
import { THEMES } from "../../theme/themes";
import { useThemeStore } from "../themeStore";

describe("themeStore", () => {
  beforeEach(() => {
    useThemeStore.setState({
      themeId: "paradigm",
      theme: THEMES.paradigm,
    });
  });

  it("should have paradigm as default themeId", () => {
    const state = useThemeStore.getState();
    expect(state.themeId).toBe("paradigm");
  });

  it("should have default theme matching THEMES.paradigm", () => {
    const state = useThemeStore.getState();
    expect(state.theme).toEqual(THEMES.paradigm);
  });

  it("should change themeId and theme object with setTheme", () => {
    useThemeStore.getState().setTheme("dracula");
    const state = useThemeStore.getState();
    expect(state.themeId).toBe("dracula");
    expect(state.theme).toEqual(THEMES.dracula);
  });

  it("should set theme to dracula", () => {
    useThemeStore.getState().setTheme("dracula");
    expect(useThemeStore.getState().themeId).toBe("dracula");
    expect(useThemeStore.getState().theme).toEqual(THEMES.dracula);
  });

  it("should set theme to nord", () => {
    useThemeStore.getState().setTheme("nord");
    expect(useThemeStore.getState().themeId).toBe("nord");
    expect(useThemeStore.getState().theme).toEqual(THEMES.nord);
  });

  it("should set theme to tokyo-night", () => {
    useThemeStore.getState().setTheme("tokyo-night");
    expect(useThemeStore.getState().themeId).toBe("tokyo-night");
    expect(useThemeStore.getState().theme).toEqual(THEMES["tokyo-night"]);
  });

  it("should have expected structure on theme object", () => {
    const { theme } = useThemeStore.getState();
    expect(theme).toHaveProperty("bg");
    expect(theme).toHaveProperty("text");
    expect(theme).toHaveProperty("accent");
    expect(theme).toHaveProperty("xtermTheme");
    expect(theme.xtermTheme).toHaveProperty("background");
    expect(theme.xtermTheme).toHaveProperty("foreground");
    expect(theme.xtermTheme).toHaveProperty("cursor");
  });
});
