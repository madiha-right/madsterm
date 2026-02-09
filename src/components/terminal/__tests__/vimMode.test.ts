import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../commands/pty", () => ({
  writePty: vi.fn(),
}));

import { writePty } from "../../../commands/pty";
import { handleVimNormalMode } from "../vimMode";

const mockWritePty = vi.mocked(writePty);

function createMockTerminal() {
  return {
    clear: vi.fn(),
    hasSelection: vi.fn(() => false),
    selectAll: vi.fn(),
    scrollLines: vi.fn(),
    scrollToTop: vi.fn(),
    scrollToBottom: vi.fn(),
    rows: 24,
  } as any;
}

function makeKeyEvent(overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return {
    key: "",
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    preventDefault: vi.fn(),
    type: "keydown",
    ...overrides,
  } as unknown as KeyboardEvent;
}

describe("handleVimNormalMode", () => {
  let terminal: ReturnType<typeof createMockTerminal>;
  let gPressedRef: { current: boolean };
  let updateVimState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    terminal = createMockTerminal();
    gPressedRef = { current: false };
    updateVimState = vi.fn();
    mockWritePty.mockClear();
  });

  it("should enter insert mode with i key", () => {
    const result = handleVimNormalMode(
      makeKeyEvent({ key: "i" }),
      terminal,
      "sess1",
      gPressedRef,
      updateVimState,
    );
    expect(result).toBe(true);
    expect(updateVimState).toHaveBeenCalledWith("insert");
  });

  it("should enter insert mode and send right arrow with a key", () => {
    const result = handleVimNormalMode(
      makeKeyEvent({ key: "a" }),
      terminal,
      "sess1",
      gPressedRef,
      updateVimState,
    );
    expect(result).toBe(true);
    expect(updateVimState).toHaveBeenCalledWith("insert");
    expect(mockWritePty).toHaveBeenCalledWith("sess1", "\x1b[C");
  });

  it("should enter insert mode and send end-of-line with A key", () => {
    const result = handleVimNormalMode(
      makeKeyEvent({ key: "A" }),
      terminal,
      "sess1",
      gPressedRef,
      updateVimState,
    );
    expect(result).toBe(true);
    expect(updateVimState).toHaveBeenCalledWith("insert");
    expect(mockWritePty).toHaveBeenCalledWith("sess1", "\x05");
  });

  it("should enter insert mode and send beginning-of-line with I key", () => {
    const result = handleVimNormalMode(
      makeKeyEvent({ key: "I" }),
      terminal,
      "sess1",
      gPressedRef,
      updateVimState,
    );
    expect(result).toBe(true);
    expect(updateVimState).toHaveBeenCalledWith("insert");
    expect(mockWritePty).toHaveBeenCalledWith("sess1", "\x01");
  });

  it("should enter insert mode and send end-of-line + enter with o key", () => {
    const result = handleVimNormalMode(
      makeKeyEvent({ key: "o" }),
      terminal,
      "sess1",
      gPressedRef,
      updateVimState,
    );
    expect(result).toBe(true);
    expect(updateVimState).toHaveBeenCalledWith("insert");
    expect(mockWritePty).toHaveBeenCalledWith("sess1", "\x05");
    expect(mockWritePty).toHaveBeenCalledWith("sess1", "\r");
  });

  it("should enter insert mode and send begin-of-line + enter + up with O key", () => {
    const result = handleVimNormalMode(
      makeKeyEvent({ key: "O" }),
      terminal,
      "sess1",
      gPressedRef,
      updateVimState,
    );
    expect(result).toBe(true);
    expect(updateVimState).toHaveBeenCalledWith("insert");
    expect(mockWritePty).toHaveBeenCalledWith("sess1", "\x01");
    expect(mockWritePty).toHaveBeenCalledWith("sess1", "\r");
    expect(mockWritePty).toHaveBeenCalledWith("sess1", "\x1b[A");
  });

  it("should scroll down 1 line with j key", () => {
    const result = handleVimNormalMode(
      makeKeyEvent({ key: "j" }),
      terminal,
      "sess1",
      gPressedRef,
      updateVimState,
    );
    expect(result).toBe(true);
    expect(terminal.scrollLines).toHaveBeenCalledWith(1);
  });

  it("should scroll up 1 line with k key", () => {
    const result = handleVimNormalMode(
      makeKeyEvent({ key: "k" }),
      terminal,
      "sess1",
      gPressedRef,
      updateVimState,
    );
    expect(result).toBe(true);
    expect(terminal.scrollLines).toHaveBeenCalledWith(-1);
  });

  it("should scroll to bottom with G key", () => {
    const result = handleVimNormalMode(
      makeKeyEvent({ key: "G" }),
      terminal,
      "sess1",
      gPressedRef,
      updateVimState,
    );
    expect(result).toBe(true);
    expect(terminal.scrollToBottom).toHaveBeenCalled();
  });

  it("should scroll to top with gg (two g presses)", () => {
    // First g: sets gPressedRef
    handleVimNormalMode(makeKeyEvent({ key: "g" }), terminal, "sess1", gPressedRef, updateVimState);
    expect(gPressedRef.current).toBe(true);

    // Second g: calls scrollToTop
    handleVimNormalMode(makeKeyEvent({ key: "g" }), terminal, "sess1", gPressedRef, updateVimState);
    expect(terminal.scrollToTop).toHaveBeenCalled();
    expect(gPressedRef.current).toBe(false);
  });

  it("should send left arrow to PTY with h key", () => {
    handleVimNormalMode(makeKeyEvent({ key: "h" }), terminal, "sess1", gPressedRef, updateVimState);
    expect(mockWritePty).toHaveBeenCalledWith("sess1", "\x1b[D");
  });

  it("should send right arrow to PTY with l key", () => {
    handleVimNormalMode(makeKeyEvent({ key: "l" }), terminal, "sess1", gPressedRef, updateVimState);
    expect(mockWritePty).toHaveBeenCalledWith("sess1", "\x1b[C");
  });

  it("should send word-forward escape sequence with w key", () => {
    handleVimNormalMode(makeKeyEvent({ key: "w" }), terminal, "sess1", gPressedRef, updateVimState);
    expect(mockWritePty).toHaveBeenCalledWith("sess1", "\x1bf");
  });

  it("should send word-backward escape sequence with b key", () => {
    handleVimNormalMode(makeKeyEvent({ key: "b" }), terminal, "sess1", gPressedRef, updateVimState);
    expect(mockWritePty).toHaveBeenCalledWith("sess1", "\x1bb");
  });

  it("should send beginning-of-line with 0 key", () => {
    handleVimNormalMode(makeKeyEvent({ key: "0" }), terminal, "sess1", gPressedRef, updateVimState);
    expect(mockWritePty).toHaveBeenCalledWith("sess1", "\x01");
  });

  it("should send end-of-line with $ key", () => {
    handleVimNormalMode(makeKeyEvent({ key: "$" }), terminal, "sess1", gPressedRef, updateVimState);
    expect(mockWritePty).toHaveBeenCalledWith("sess1", "\x05");
  });

  it("should send delete with x key", () => {
    handleVimNormalMode(makeKeyEvent({ key: "x" }), terminal, "sess1", gPressedRef, updateVimState);
    expect(mockWritePty).toHaveBeenCalledWith("sess1", "\x1b[3~");
  });

  it("should send backspace with X key", () => {
    handleVimNormalMode(makeKeyEvent({ key: "X" }), terminal, "sess1", gPressedRef, updateVimState);
    expect(mockWritePty).toHaveBeenCalledWith("sess1", "\x7f");
  });

  it("should scroll half page down with Ctrl+D", () => {
    handleVimNormalMode(
      makeKeyEvent({ key: "d", ctrlKey: true }),
      terminal,
      "sess1",
      gPressedRef,
      updateVimState,
    );
    expect(terminal.scrollLines).toHaveBeenCalledWith(Math.floor(24 / 2));
  });

  it("should scroll half page up with Ctrl+U", () => {
    handleVimNormalMode(
      makeKeyEvent({ key: "u", ctrlKey: true }),
      terminal,
      "sess1",
      gPressedRef,
      updateVimState,
    );
    expect(terminal.scrollLines).toHaveBeenCalledWith(-Math.floor(24 / 2));
  });

  it("should clear terminal with Meta+K", () => {
    handleVimNormalMode(
      makeKeyEvent({ key: "k", metaKey: true }),
      terminal,
      "sess1",
      gPressedRef,
      updateVimState,
    );
    expect(terminal.clear).toHaveBeenCalled();
  });

  it("should copy when Meta+C and selection exists", () => {
    terminal.hasSelection.mockReturnValue(true);
    document.execCommand = vi.fn();
    const result = handleVimNormalMode(
      makeKeyEvent({ key: "c", metaKey: true }),
      terminal,
      "sess1",
      gPressedRef,
      updateVimState,
    );
    expect(result).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });

  it("should select all with Meta+A", () => {
    handleVimNormalMode(
      makeKeyEvent({ key: "a", metaKey: true }),
      terminal,
      "sess1",
      gPressedRef,
      updateVimState,
    );
    expect(terminal.selectAll).toHaveBeenCalled();
  });

  it("should return false for meta shortcuts that should pass through", () => {
    const result = handleVimNormalMode(
      makeKeyEvent({ key: "t", metaKey: true }),
      terminal,
      "sess1",
      gPressedRef,
      updateVimState,
    );
    expect(result).toBe(false);
  });

  it("should not call writePty without sessionId for navigation keys", () => {
    handleVimNormalMode(makeKeyEvent({ key: "h" }), terminal, null, gPressedRef, updateVimState);
    expect(mockWritePty).not.toHaveBeenCalled();

    handleVimNormalMode(makeKeyEvent({ key: "l" }), terminal, null, gPressedRef, updateVimState);
    expect(mockWritePty).not.toHaveBeenCalled();

    handleVimNormalMode(makeKeyEvent({ key: "w" }), terminal, null, gPressedRef, updateVimState);
    expect(mockWritePty).not.toHaveBeenCalled();
  });
});
