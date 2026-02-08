import { beforeEach, describe, expect, it } from "vitest";
import { useSettingsStore } from "../settingsStore";

describe("settingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', 'Consolas', monospace",
      copyOnSelect: false,
      cursorStyle: "block",
      cursorBlink: true,
      scrollbackLines: 10000,
    });
  });

  it("should increase font size", () => {
    useSettingsStore.getState().increaseFontSize();
    expect(useSettingsStore.getState().fontSize).toBe(15);
  });

  it("should decrease font size", () => {
    useSettingsStore.getState().decreaseFontSize();
    expect(useSettingsStore.getState().fontSize).toBe(13);
  });

  it("should not go below min font size", () => {
    useSettingsStore.setState({ fontSize: 8 });
    useSettingsStore.getState().decreaseFontSize();
    expect(useSettingsStore.getState().fontSize).toBe(8);
  });

  it("should not go above max font size", () => {
    useSettingsStore.setState({ fontSize: 32 });
    useSettingsStore.getState().increaseFontSize();
    expect(useSettingsStore.getState().fontSize).toBe(32);
  });

  it("should reset font size", () => {
    useSettingsStore.getState().increaseFontSize();
    useSettingsStore.getState().resetFontSize();
    expect(useSettingsStore.getState().fontSize).toBe(14);
  });

  it("should set font family", () => {
    useSettingsStore.getState().setFontFamily("monospace");
    expect(useSettingsStore.getState().fontFamily).toBe("monospace");
  });

  it("should set cursor style", () => {
    useSettingsStore.getState().setCursorStyle("underline");
    expect(useSettingsStore.getState().cursorStyle).toBe("underline");
  });

  it("should set cursor blink", () => {
    useSettingsStore.getState().setCursorBlink(false);
    expect(useSettingsStore.getState().cursorBlink).toBe(false);
  });

  it("should set copy on select", () => {
    useSettingsStore.getState().setCopyOnSelect(true);
    expect(useSettingsStore.getState().copyOnSelect).toBe(true);
  });

  it("should enforce min scrollback lines", () => {
    useSettingsStore.getState().setScrollbackLines(50);
    expect(useSettingsStore.getState().scrollbackLines).toBe(100);
  });
});
