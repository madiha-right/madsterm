import { useState, useEffect } from "react";
import { X, Check, Monitor } from "lucide-react";
import { useThemeStore } from "../../stores/themeStore";
import { THEME_LIST, THEMES, type ThemeId } from "../../theme/themes";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

const ThemeCard: React.FC<{
  themeId: ThemeId;
  name: string;
  previewColors?: [string, string, string, string, string];
  isActive: boolean;
  onSelect: () => void;
}> = ({ themeId, name, isActive, onSelect }) => {
  const currentTheme = useThemeStore((s) => s.theme);
  const preview = THEMES[themeId];
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        width: "100%",
        padding: 0,
        border: isActive
          ? `1px solid ${currentTheme.textBright}`
          : `1px solid ${hovered ? currentTheme.border : "transparent"}`,
        background: "transparent",
        cursor: "pointer",
        borderRadius: 0,
        overflow: "hidden",
        transition: "border-color 0.15s ease",
      }}
    >
      {/* Mini terminal preview */}
      <div
        style={{
          backgroundColor: preview.bg,
          padding: 12,
          height: 100,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {/* Fake title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            paddingBottom: 6,
            borderBottom: `1px solid ${preview.border}`,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#ff5f56" }} />
          <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#ffbd2e" }} />
          <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#27c93f" }} />
          <span
            style={{
              fontSize: 8,
              color: preview.textMuted,
              marginLeft: 6,
              fontFamily: "var(--font-mono)",
            }}
          >
            ~
          </span>
        </div>

        {/* Fake terminal lines */}
        <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>
          <div>
            <span style={{ color: preview.xtermTheme.green }}>$</span>
            <span style={{ color: preview.text }}> ls -la</span>
          </div>
          <div>
            <span style={{ color: preview.xtermTheme.blue }}>drwxr-xr-x</span>
            <span style={{ color: preview.text }}> src/</span>
          </div>
          <div>
            <span style={{ color: preview.xtermTheme.yellow }}>-rw-r--r--</span>
            <span style={{ color: preview.textMuted }}> package.json</span>
          </div>
        </div>
      </div>

      {/* Theme name */}
      <div
        style={{
          padding: "8px 12px",
          backgroundColor: preview.bgSurface,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: isActive ? 600 : 400,
            color: preview.textBright,
            letterSpacing: "0.3px",
            fontFamily: "var(--font-ui)",
          }}
        >
          {name}
        </span>
        {isActive && <Check size={12} color={preview.accent} strokeWidth={2.5} />}
      </div>
    </button>
  );
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ open, onClose }) => {
  const { themeId, theme, setTheme } = useThemeStore();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 680,
          maxHeight: "80vh",
          backgroundColor: theme.bg,
          border: `1px solid ${theme.border}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Monitor size={14} color={theme.textMuted} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: theme.textBright,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: "var(--font-ui)",
              }}
            >
              Settings
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              border: "none",
              background: "transparent",
              color: theme.textMuted,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.textBright;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.textMuted;
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {/* Theme section */}
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: theme.textMuted,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginBottom: 16,
                fontFamily: "var(--font-ui)",
              }}
            >
              Theme
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              {THEME_LIST.map((t) => (
                <ThemeCard
                  key={t.id}
                  themeId={t.id}
                  name={t.name}
                  previewColors={t.previewColors}
                  isActive={t.id === themeId}
                  onSelect={() => setTheme(t.id)}
                />
              ))}
            </div>
          </div>

          {/* Keyboard shortcuts reference */}
          <div style={{ marginTop: 32 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: theme.textMuted,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginBottom: 16,
                fontFamily: "var(--font-ui)",
              }}
            >
              Keyboard Shortcuts
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0",
                fontSize: 12,
                fontFamily: "var(--font-ui)",
              }}
            >
              {[
                { key: "\u2318T", label: "New tab" },
                { key: "\u2318W", label: "Close tab" },
                { key: "\u2318B", label: "Toggle explorer" },
                { key: "\u2318\u21E7=", label: "Toggle changes" },
                { key: "\u2318K", label: "Clear terminal" },
                { key: "\u2318F", label: "Find in terminal" },
                { key: "\u2318P", label: "Quick search" },
                { key: "\u2318,", label: "Settings" },
                { key: "\u23181-9", label: "Switch tab" },
                { key: "\u2303F", label: "Fullscreen" },
              ].map((s) => (
                <div
                  key={s.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderBottom: `1px solid ${theme.border}`,
                  }}
                >
                  <span style={{ color: theme.textMuted }}>{s.label}</span>
                  <span
                    style={{
                      color: theme.text,
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      backgroundColor: theme.bgActive,
                      padding: "2px 8px",
                    }}
                  >
                    {s.key}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
