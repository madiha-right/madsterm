import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useVimListNavigation } from "../useVimListNavigation";

function makeKeyEvent(
  key: string,
  overrides: Partial<React.KeyboardEvent> = {},
): React.KeyboardEvent {
  return {
    key,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    preventDefault: vi.fn(),
    ...overrides,
  } as unknown as React.KeyboardEvent;
}

describe("useVimListNavigation", () => {
  const items = { length: 20 };
  let onExpand: () => void;
  let onCollapse: () => void;
  let onEscape: () => void;

  beforeEach(() => {
    onExpand = vi.fn() as unknown as () => void;
    onCollapse = vi.fn() as unknown as () => void;
    onEscape = vi.fn() as unknown as () => void;
  });

  function setupHook(initialIndex = 0) {
    return renderHook(() => {
      const [focusedIndex, setFocusedIndex] = useState(initialIndex);
      const nav = useVimListNavigation({
        items,
        focusedIndex,
        setFocusedIndex,
        onExpand,
        onCollapse,
        onEscape,
      });
      return { ...nav, focusedIndex };
    });
  }

  it("should increment focusedIndex with j key", () => {
    const { result } = setupHook(0);

    act(() => {
      result.current.handleKeyDown(makeKeyEvent("j"));
    });

    expect(result.current.focusedIndex).toBe(1);
  });

  it("should decrement focusedIndex with k key", () => {
    const { result } = setupHook(5);

    act(() => {
      result.current.handleKeyDown(makeKeyEvent("k"));
    });

    expect(result.current.focusedIndex).toBe(4);
  });

  it("should behave like j with ArrowDown", () => {
    const { result } = setupHook(0);

    act(() => {
      result.current.handleKeyDown(makeKeyEvent("ArrowDown"));
    });

    expect(result.current.focusedIndex).toBe(1);
  });

  it("should behave like k with ArrowUp", () => {
    const { result } = setupHook(5);

    act(() => {
      result.current.handleKeyDown(makeKeyEvent("ArrowUp"));
    });

    expect(result.current.focusedIndex).toBe(4);
  });

  it("should jump to last item with G key", () => {
    const { result } = setupHook(0);

    act(() => {
      result.current.handleKeyDown(makeKeyEvent("G"));
    });

    expect(result.current.focusedIndex).toBe(19);
  });

  it("should call onExpand with l key", () => {
    const { result } = setupHook(0);

    act(() => {
      result.current.handleKeyDown(makeKeyEvent("l"));
    });

    expect(onExpand).toHaveBeenCalled();
  });

  it("should call onCollapse with h key", () => {
    const { result } = setupHook(0);

    act(() => {
      result.current.handleKeyDown(makeKeyEvent("h"));
    });

    expect(onCollapse).toHaveBeenCalled();
  });

  it("should call onExpand with Enter key", () => {
    const { result } = setupHook(0);

    act(() => {
      result.current.handleKeyDown(makeKeyEvent("Enter"));
    });

    expect(onExpand).toHaveBeenCalled();
  });

  it("should call onExpand with Space key", () => {
    const { result } = setupHook(0);

    act(() => {
      result.current.handleKeyDown(makeKeyEvent(" "));
    });

    expect(onExpand).toHaveBeenCalled();
  });

  it("should call onEscape with Escape key", () => {
    const { result } = setupHook(0);

    act(() => {
      result.current.handleKeyDown(makeKeyEvent("Escape"));
    });

    expect(onEscape).toHaveBeenCalled();
  });

  it("should jump forward by 10 with Ctrl+D (capped at items.length - 1)", () => {
    const { result } = setupHook(5);

    act(() => {
      result.current.handleKeyDown(makeKeyEvent("d", { ctrlKey: true }));
    });

    expect(result.current.focusedIndex).toBe(15);
  });

  it("should cap Ctrl+D at last item", () => {
    const { result } = setupHook(15);

    act(() => {
      result.current.handleKeyDown(makeKeyEvent("d", { ctrlKey: true }));
    });

    expect(result.current.focusedIndex).toBe(19);
  });

  it("should jump backward by 10 with Ctrl+U (capped at 0)", () => {
    const { result } = setupHook(15);

    act(() => {
      result.current.handleKeyDown(makeKeyEvent("u", { ctrlKey: true }));
    });

    expect(result.current.focusedIndex).toBe(5);
  });

  it("should cap Ctrl+U at 0", () => {
    const { result } = setupHook(3);

    act(() => {
      result.current.handleKeyDown(makeKeyEvent("u", { ctrlKey: true }));
    });

    expect(result.current.focusedIndex).toBe(0);
  });

  it("should stay at last item when j at last item", () => {
    const { result } = setupHook(19);

    act(() => {
      result.current.handleKeyDown(makeKeyEvent("j"));
    });

    expect(result.current.focusedIndex).toBe(19);
  });

  it("should stay at 0 when k at first item", () => {
    const { result } = setupHook(0);

    act(() => {
      result.current.handleKeyDown(makeKeyEvent("k"));
    });

    expect(result.current.focusedIndex).toBe(0);
  });
});
