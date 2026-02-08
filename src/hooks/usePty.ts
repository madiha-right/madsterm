import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

export async function createPtySession(cols: number, rows: number, cwd?: string): Promise<string> {
  return invoke<string>("pty_create", { cols, rows, cwd: cwd || null });
}

export async function writePty(sessionId: string, data: string): Promise<void> {
  return invoke("pty_write", { sessionId, data });
}

export async function resizePty(sessionId: string, cols: number, rows: number): Promise<void> {
  return invoke("pty_resize", { sessionId, cols, rows });
}

export async function closePty(sessionId: string): Promise<void> {
  return invoke("pty_close", { sessionId });
}

export function onPtyOutput(
  sessionId: string,
  callback: (data: string) => void,
): Promise<UnlistenFn> {
  return listen<string>(`pty-output-${sessionId}`, (event) => {
    callback(event.payload);
  });
}

export function onPtyExit(sessionId: string, callback: () => void): Promise<UnlistenFn> {
  return listen(`pty-exit-${sessionId}`, () => callback());
}
