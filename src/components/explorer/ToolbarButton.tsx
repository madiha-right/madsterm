import { useEffect, useRef, useState } from "react";
import { useThemeStore } from "../../stores/themeStore";

export const ToolbarButton: React.FC<{
  icon: React.ReactNode;
  tooltip: string;
  onClick: (e: React.MouseEvent) => void;
  isActive?: boolean;
}> = ({ icon, tooltip, onClick, isActive }) => {
  const theme = useThemeStore((s) => s.theme);
  const [hovered, setHovered] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  // Position tooltip so it never gets clipped by the window
  useEffect(() => {
    if (!hovered || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const tipWidth = tooltip.length * 7 + 16; // rough estimate
    const style: React.CSSProperties = {
      position: "fixed",
      top: rect.bottom + 6,
      zIndex: 9999,
      padding: "4px 8px",
      backgroundColor: theme.bgPanel,
      border: `1px solid ${theme.border}`,
      color: theme.text,
      fontSize: 11,
      whiteSpace: "nowrap",
      pointerEvents: "none",
    };
    // Center under button, but clamp to window
    let left = rect.left + rect.width / 2 - tipWidth / 2;
    if (left < 4) left = 4;
    if (left + tipWidth > window.innerWidth - 4) left = window.innerWidth - 4 - tipWidth;
    style.left = left;
    setTooltipStyle(style);
  }, [hovered, theme, tooltip]);

  return (
    <div ref={btnRef} style={{ position: "relative" }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered || isActive ? theme.bgHover : "transparent",
          border: "none",
          cursor: "pointer",
          padding: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: hovered || isActive ? theme.textBright : theme.textMuted,
          transition: "color 0.12s ease, background-color 0.12s ease",
        }}
      >
        {icon}
      </button>
      {hovered && <div style={tooltipStyle}>{tooltip}</div>}
    </div>
  );
};
