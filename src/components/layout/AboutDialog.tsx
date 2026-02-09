import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useThemeStore } from "../../stores/themeStore";

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

const AppLogoLarge: React.FC = () => {
  const theme = useThemeStore((s) => s.theme);
  return (
    <svg width="48" height="48" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="0.5"
        y="0.5"
        width="15"
        height="15"
        stroke={theme.accent}
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M4 11L7 8L4 5"
        stroke={theme.accent}
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <line
        x1="9"
        y1="11"
        x2="12"
        y2="11"
        stroke={theme.accent}
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
};

export const AboutDialog: React.FC<AboutDialogProps> = ({ open, onClose }) => {
  const theme = useThemeStore((s) => s.theme);

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

  const isMac = navigator.platform.includes("Mac");
  const mod = isMac ? "\u2318" : "Ctrl+";

  const shortcuts = [
    { key: `${mod}T`, label: "New tab" },
    { key: `${mod}W`, label: "Close tab" },
    { key: `${mod}B`, label: "Toggle explorer" },
    { key: `${mod},`, label: "Settings" },
  ];

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10001,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        // @ts-expect-error — WebKit vendor prefix to opt out of native drag region
        WebkitAppRegion: "no-drag",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      <div
        style={{
          width: 400,
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
            About
          </span>
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
        <div
          style={{
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Logo and App Name */}
          <AppLogoLarge />
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: theme.textBright,
                letterSpacing: 3,
                textTransform: "uppercase",
                fontFamily: "var(--font-ui)",
              }}
            >
              Madsterm
            </div>
            <div
              style={{
                fontSize: 11,
                color: theme.textMuted,
                fontFamily: "var(--font-mono)",
                marginTop: 4,
              }}
            >
              v0.1.0
            </div>
          </div>

          <div
            style={{
              fontSize: 12,
              color: theme.text,
              fontFamily: "var(--font-ui)",
              textAlign: "center",
            }}
          >
            A modern terminal emulator
          </div>

          {/* Separator */}
          <div
            style={{
              width: "100%",
              height: 1,
              backgroundColor: theme.border,
              margin: "8px 0",
            }}
          />

          {/* Keyboard Shortcuts */}
          <div style={{ width: "100%" }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: theme.textMuted,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginBottom: 12,
                fontFamily: "var(--font-ui)",
              }}
            >
              Keyboard Shortcuts
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
                fontSize: 12,
                fontFamily: "var(--font-ui)",
              }}
            >
              {shortcuts.map((s) => (
                <div
                  key={s.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 12px",
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

          {/* Separator */}
          <div
            style={{
              width: "100%",
              height: 1,
              backgroundColor: theme.border,
              margin: "4px 0",
            }}
          />

          {/* Built with */}
          <div
            style={{
              fontSize: 11,
              color: theme.textMuted,
              fontFamily: "var(--font-ui)",
              textAlign: "center",
            }}
          >
            Built with Tauri, React, and xterm.js
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
