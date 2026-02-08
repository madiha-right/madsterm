import "@testing-library/jest-dom/vitest";

// Mock Tauri APIs for testing
const mockInvoke = vi.fn();
const mockListen = vi.fn(() => Promise.resolve(() => {}));
const mockEmit = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: mockListen,
  emit: mockEmit,
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    isFullscreen: () => Promise.resolve(false),
    setFullscreen: vi.fn(),
  }),
}));

// Export mocks so tests can access them
export { mockInvoke, mockListen, mockEmit };
