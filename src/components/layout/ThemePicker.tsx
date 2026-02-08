import { useState, useRef, useEffect } from "react";
import { Palette, Check } from "lucide-react";
import { useThemeStore } from "../../stores/themeStore";
import { THEME_LIST } from "../../theme/themes";

export const ThemePicker: React.FC = () => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { themeId, theme, setTheme } = useThemeStore();

  // Close on click outside or Escape
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
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        title="Change theme"
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
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <Palette size={13} />
      </button>

      {open && (
        <div
          ref={popoverRef}
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: 8,
            width: 240,
            backgroundColor: theme.bgPanel,
            border: `1px solid ${theme.border}`,
            borderRadius: 0,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            overflow: "hidden",
            zIndex: 1000,
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
            }}
          >
            Theme
          </div>

          {/* Theme list */}
          <div style={{ maxHeight: 320, overflowY: "auto", padding: "4px 0" }}>
            {THEME_LIST.map((t) => {
              const isActive = t.id === themeId;
              return (
                <button
                  key={t.id}
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
                    background: isActive ? theme.bgActive : "transparent",
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: "inherit",
                    color: isActive ? theme.textBright : theme.text,
                    textAlign: "left",
                    transition: "background-color 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = theme.bgHover;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
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
                  {isActive && (
                    <Check size={14} color={theme.accent} strokeWidth={2.5} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
