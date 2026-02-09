import { Check, Palette } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useVimListNavigation } from "../../hooks/useVimListNavigation";
import { useThemeStore } from "../../stores/themeStore";
import { THEME_LIST } from "../../theme/themes";

export const ThemePicker: React.FC = () => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { themeId, theme, setTheme } = useThemeStore();
  const [dropdownPos, setDropdownPos] = useState<{
    left: number;
    bottom: number;
    maxHeight: number;
  } | null>(null);
  const [hovered, setHovered] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectFocused = useCallback(() => {
    if (focusedIndex >= 0 && focusedIndex < THEME_LIST.length) {
      setTheme(THEME_LIST[focusedIndex].id);
      setOpen(false);
    }
  }, [focusedIndex, setTheme]);

  const { handleKeyDown: vimKeyDown } = useVimListNavigation({
    items: THEME_LIST,
    focusedIndex,
    setFocusedIndex,
    onExpand: selectFocused,
    onEscape: () => setOpen(false),
  });

  // Reset focused index to active theme when opening
  useEffect(() => {
    if (open) {
      const activeIdx = THEME_LIST.findIndex((t) => t.id === themeId);
      setFocusedIndex(activeIdx >= 0 ? activeIdx : 0);
    }
  }, [open, themeId]);

  // Scroll focused item into view
  useEffect(() => {
    if (open && focusedIndex >= 0) {
      itemRefs.current[focusedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [open, focusedIndex]);

  useLayoutEffect(() => {
    if (!hovered || open || !buttonRef.current) {
      setTooltipStyle(null);
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    const tipText = "Theme";
    const tipWidth = tipText.length * 7 + 16;
    let left = rect.left + rect.width / 2 - tipWidth / 2;
    if (left < 4) left = 4;
    if (left + tipWidth > window.innerWidth - 4) left = window.innerWidth - 4 - tipWidth;
    setTooltipStyle({
      position: "fixed",
      bottom: window.innerHeight - rect.top + 6,
      left,
      zIndex: 9999,
      padding: "4px 8px",
      backgroundColor: theme.bgPanel,
      border: `1px solid ${theme.border}`,
      color: theme.text,
      fontSize: 11,
      whiteSpace: "nowrap",
      pointerEvents: "none",
    });
  }, [hovered, open, theme]);

  // Calculate fixed position when dropdown opens
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setDropdownPos(null);
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = 240;
    let left = rect.left + rect.width / 2 - dropdownWidth / 2;
    if (left < 4) left = 4;
    if (left + dropdownWidth > window.innerWidth - 4) left = window.innerWidth - 4 - dropdownWidth;
    const bottomOffset = window.innerHeight - rect.top + 8;
    // Cap maxHeight so the dropdown doesn't go above the viewport
    const availableHeight = window.innerHeight - bottomOffset - 8;
    setDropdownPos({
      left,
      bottom: bottomOffset,
      maxHeight: Math.min(400, availableHeight),
    });
  }, [open]);

  // Focus the popover when it opens
  useEffect(() => {
    if (open && popoverRef.current) {
      popoverRef.current.focus();
    }
  }, [open, dropdownPos]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  const dropdown =
    open && dropdownPos ? (
      <div
        ref={popoverRef}
        tabIndex={0}
        onKeyDown={vimKeyDown}
        style={{
          position: "fixed",
          bottom: dropdownPos.bottom,
          left: dropdownPos.left,
          width: 240,
          maxHeight: dropdownPos.maxHeight,
          display: "flex",
          flexDirection: "column",
          backgroundColor: theme.bgPanel,
          border: `1px solid ${theme.border}`,
          borderRadius: 0,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          zIndex: 10000,
          outline: "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "8px 12px",
            fontSize: 11,
            fontWeight: 600,
            color: theme.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            borderBottom: `1px solid ${theme.border}`,
            flexShrink: 0,
          }}
        >
          Theme
        </div>

        {/* Theme list */}
        <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
          {THEME_LIST.map((t, index) => {
            const isActive = t.id === themeId;
            const isFocused = index === focusedIndex;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "7px 12px",
                  border: "none",
                  background: isFocused ? theme.bgHover : isActive ? theme.bgActive : "transparent",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "inherit",
                  color: isActive ? theme.textBright : theme.text,
                  textAlign: "left",
                  transition: "background-color 0.1s",
                }}
                onMouseEnter={(e) => {
                  setFocusedIndex(index);
                  if (!isActive) e.currentTarget.style.backgroundColor = theme.bgHover;
                }}
                onMouseLeave={(e) => {
                  if (!isFocused && !isActive)
                    e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {/* Color swatch preview */}
                <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                  {t.previewColors.map((color, i) => (
                    <div
                      key={i}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 0,
                        backgroundColor: color,
                        border: i === 0 ? `1px solid ${theme.border}` : "none",
                      }}
                    />
                  ))}
                </div>

                {/* Name */}
                <span style={{ flex: 1 }}>{t.name}</span>

                {/* Checkmark */}
                {isActive && <Check size={14} color={theme.accent} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          color: open ? theme.accent : theme.statusBarText,
          cursor: "pointer",
          padding: "2px 6px",
          borderRadius: 0,
          height: 20,
          width: 24,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.bgHover;
          setHovered(true);
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          setHovered(false);
        }}
      >
        <Palette size={13} />
      </button>
      {hovered && !open && tooltipStyle && <div style={tooltipStyle}>Theme</div>}
      {createPortal(dropdown, document.body)}
    </div>
  );
};
