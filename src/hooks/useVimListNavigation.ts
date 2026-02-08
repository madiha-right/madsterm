import { useCallback, useRef } from "react";

interface UseVimListNavigationOptions {
  items: { length: number };
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  onExpand?: () => void;
  onCollapse?: () => void;
  onEscape?: () => void;
}

export function useVimListNavigation({
  items,
  focusedIndex,
  setFocusedIndex,
  onExpand,
  onCollapse,
  onEscape,
}: UseVimListNavigationOptions) {
  const gPressedRef = useRef(false);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // g -> wait for next key (gg = jump to first)
      if (e.key === "g") {
        if (gPressedRef.current) {
          setFocusedIndex(0);
          gPressedRef.current = false;
          e.preventDefault();
          return;
        }
        gPressedRef.current = true;
        setTimeout(() => {
          gPressedRef.current = false;
        }, 500);
        e.preventDefault();
        return;
      }
      gPressedRef.current = false;

      // Ctrl+D / Ctrl+U — half-page jump
      if (e.ctrlKey && (e.key === "d" || e.key === "u")) {
        e.preventDefault();
        const jump = 10;
        if (e.key === "d") {
          setFocusedIndex(Math.min(focusedIndex + jump, items.length - 1));
        } else {
          setFocusedIndex(Math.max(focusedIndex - jump, 0));
        }
        return;
      }

      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex(Math.min(focusedIndex + 1, items.length - 1));
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex(Math.max(focusedIndex - 1, 0));
          break;
        case "l":
        case "ArrowRight":
        case "Enter":
        case " ":
          e.preventDefault();
          onExpand?.();
          break;
        case "h":
        case "ArrowLeft":
          e.preventDefault();
          onCollapse?.();
          break;
        case "G":
          e.preventDefault();
          setFocusedIndex(items.length - 1);
          break;
        case "Escape":
          e.preventDefault();
          onEscape?.();
          break;
      }
    },
    [focusedIndex, items.length, setFocusedIndex, onExpand, onCollapse, onEscape],
  );

  return { handleKeyDown };
}
