import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockInvoke, mockListen } from "../../test/setup";
import { closePty, createPtySession, onPtyExit, onPtyOutput, resizePty, writePty } from "../pty";

describe("pty commands", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    mockListen.mockReset();
    mockListen.mockReturnValue(Promise.resolve(() => {}));
  });

  it("should call invoke with correct command and args for createPtySession", async () => {
    mockInvoke.mockResolvedValue("session-123");
    const result = await createPtySession(80, 24, "/home/user");
    expect(mockInvoke).toHaveBeenCalledWith("pty_create", {
      cols: 80,
      rows: 24,
      cwd: "/home/user",
    });
    expect(result).toBe("session-123");
  });

  it("should pass null cwd when not provided to createPtySession", async () => {
    mockInvoke.mockResolvedValue("session-456");
    await createPtySession(80, 24);
    expect(mockInvoke).toHaveBeenCalledWith("pty_create", {
      cols: 80,
      rows: 24,
      cwd: null,
    });
  });

  it("should call invoke with correct command and args for writePty", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await writePty("sess1", "hello");
    expect(mockInvoke).toHaveBeenCalledWith("pty_write", {
      sessionId: "sess1",
      data: "hello",
    });
  });

  it("should call invoke with correct command and args for resizePty", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await resizePty("sess1", 120, 40);
    expect(mockInvoke).toHaveBeenCalledWith("pty_resize", {
      sessionId: "sess1",
      cols: 120,
      rows: 40,
    });
  });

  it("should call invoke with correct command and args for closePty", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await closePty("sess1");
    expect(mockInvoke).toHaveBeenCalledWith("pty_close", {
      sessionId: "sess1",
    });
  });

  it("should call listen with correct event name for onPtyOutput", async () => {
    const unlistenFn = vi.fn();
    mockListen.mockResolvedValue(unlistenFn);
    const callback = vi.fn();
    const result = await onPtyOutput("sess1", callback);
    expect(mockListen).toHaveBeenCalledWith("pty-output-sess1", expect.any(Function));
    expect(result).toBe(unlistenFn);
  });

  it("should call listen with correct event name for onPtyExit", async () => {
    const unlistenFn = vi.fn();
    mockListen.mockResolvedValue(unlistenFn);
    const callback = vi.fn();
    const result = await onPtyExit("sess1", callback);
    expect(mockListen).toHaveBeenCalledWith("pty-exit-sess1", expect.any(Function));
    expect(result).toBe(unlistenFn);
  });
});
