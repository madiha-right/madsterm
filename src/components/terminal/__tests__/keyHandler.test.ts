import { describe, expect, it, vi } from "vitest";
import { isAppShortcut } from "../keyHandler";

// In jsdom, navigator.platform is "", so isMac = false, meaning ctrlKey is the meta modifier.

function makeKeyEvent(overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return {
    key: "",
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    preventDefault: vi.fn(),
    ...overrides,
  } as unknown as KeyboardEvent;
}

describe("isAppShortcut", () => {
  it("should return false when no meta key pressed", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "t" }))).toBe(false);
  });

  it("should return true for Ctrl+T (new tab)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "t", ctrlKey: true }))).toBe(true);
  });

  it("should return true for Ctrl+W (close tab)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "w", ctrlKey: true }))).toBe(true);
  });

  it("should return true for Ctrl+B (toggle explorer)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "b", ctrlKey: true }))).toBe(true);
  });

  it("should return true for Ctrl+F (search)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "f", ctrlKey: true }))).toBe(true);
  });

  it("should return true for Ctrl+P (search focus)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "p", ctrlKey: true }))).toBe(true);
  });

  it("should return true for Ctrl+1 through Ctrl+9 (tab switch)", () => {
    for (let i = 1; i <= 9; i++) {
      expect(isAppShortcut(makeKeyEvent({ key: String(i), ctrlKey: true }))).toBe(true);
    }
  });

  it("should return true for Ctrl+= (font size increase)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "=", ctrlKey: true }))).toBe(true);
  });

  it("should return true for Ctrl+- (font size decrease)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "-", ctrlKey: true }))).toBe(true);
  });

  it("should return true for Ctrl+0 (font size reset)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "0", ctrlKey: true }))).toBe(true);
  });

  it("should return true for Ctrl++ (font size increase)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "+", ctrlKey: true }))).toBe(true);
  });

  it("should return true for Ctrl+Shift+T (reopen tab)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "t", ctrlKey: true, shiftKey: true }))).toBe(true);
  });

  it("should return true for Ctrl+Shift+E (toggle explorer alias)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "e", ctrlKey: true, shiftKey: true }))).toBe(true);
  });

  it("should return true for Ctrl+Shift+F (global search)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "f", ctrlKey: true, shiftKey: true }))).toBe(true);
  });

  it("should return true for Ctrl+Shift+= (toggle diff panel)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "=", ctrlKey: true, shiftKey: true }))).toBe(true);
  });

  it("should return true for Ctrl+Alt+C (toggle case sensitive)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "c", ctrlKey: true, altKey: true }))).toBe(true);
  });

  it("should return true for Ctrl+Alt+W (toggle whole word)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "w", ctrlKey: true, altKey: true }))).toBe(true);
  });

  it("should return true for Ctrl+Alt+R (toggle regex)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "r", ctrlKey: true, altKey: true }))).toBe(true);
  });

  it("should return true for Ctrl+Alt+Left (prev tab)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "ArrowLeft", ctrlKey: true, altKey: true }))).toBe(
      true,
    );
  });

  it("should return true for Ctrl+Alt+Right (next tab)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "ArrowRight", ctrlKey: true, altKey: true }))).toBe(
      true,
    );
  });

  it("should return true for Ctrl+[ (prev tab)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "[", ctrlKey: true }))).toBe(true);
  });

  it("should return true for Ctrl+] (next tab)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "]", ctrlKey: true }))).toBe(true);
  });

  it("should return false for Ctrl+Z (not an app shortcut)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "z", ctrlKey: true }))).toBe(false);
  });

  it("should return false for Ctrl+X (not an app shortcut)", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "x", ctrlKey: true }))).toBe(false);
  });

  it("should return false for just letter keys without meta", () => {
    expect(isAppShortcut(makeKeyEvent({ key: "a" }))).toBe(false);
    expect(isAppShortcut(makeKeyEvent({ key: "t" }))).toBe(false);
    expect(isAppShortcut(makeKeyEvent({ key: "w" }))).toBe(false);
  });
});
