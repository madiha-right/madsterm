import { FolderOpen, GitBranch, GitCompareArrows, Info, Settings, Terminal } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getCwd, getShellName } from "../../commands/fs";
import { fetchGitBranch } from "../../commands/git";
import { usePanelStore } from "../../stores/panelStore";
import { useThemeStore } from "../../stores/themeStore";
import { ThemePicker } from "./ThemePicker";

const StatusBarButton: React.FC<{
  onClick: () => void;
  ariaLabel: string;
  ariaPressed?: boolean;
  isActive: boolean;
  tooltipText: string;
  children: React.ReactNode;
}> = ({ onClick, ariaLabel, ariaPressed, isActive, tooltipText, children }) => {
  const theme = useThemeStore((s) => s.theme);
  const [hovered, setHovered] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties | null>(null);

  useLayoutEffect(() => {
    if (!hovered || !btnRef.current) {
      setTooltipStyle(null);
      return;
    }
    const rect = btnRef.current.getBoundingClientRect();
    const tipWidth = tooltipText.length * 7 + 16;
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
  }, [hovered, theme, tooltipText]);

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={btnRef}
        onClick={onClick}
        aria-label={ariaLabel}
        aria-pressed={ariaPressed}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          color: isActive ? theme.accent : theme.statusBarText,
          cursor: "pointer",
          padding: "2px 6px",
          borderRadius: 0,
          fontSize: 10,
          fontFamily: "var(--font-ui)",
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
        {children}
      </button>
      {hovered && tooltipStyle && <div style={tooltipStyle}>{tooltipText}</div>}
    </div>
  );
};

export const StatusBar: React.FC = () => {
  const {
    toggleLeftPanel,
    toggleRightPanel,
    leftPanelVisible,
    rightPanelVisible,
    setSettingsOpen,
    setAboutOpen,
  } = usePanelStore();
  const theme = useThemeStore((s) => s.theme);
  const [branch, setBranch] = useState<string | null>(null);
  const [shellName, setShellName] = useState<string>("sh");

  useEffect(() => {
    getShellName()
      .then(setShellName)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const loadBranch = async () => {
      try {
        const cwd = await getCwd();
        const b = await fetchGitBranch(cwd);
        setBranch(b);
      } catch {
        setBranch(null);
      }
    };
    loadBranch();
    const interval = setInterval(loadBranch, 5000);
    return () => clearInterval(interval);
  }, []);

  const infoItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 4,
    color: theme.statusBarText,
    fontSize: 10,
    fontFamily: "var(--font-ui)",
    padding: "0 6px",
    height: 20,
    borderRadius: 0,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  return (
    <div
      role="status"
      aria-label="Status bar"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 24,
        minHeight: 24,
        backgroundColor: theme.statusBarBg,
        borderTop: `1px solid ${theme.border}`,
        padding: "0 8px",
        fontSize: 11,
        fontFamily: "var(--font-ui)",
      }}
    >
      {/* Left side - panel toggles */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <StatusBarButton
          onClick={toggleLeftPanel}
          ariaLabel="Toggle file explorer"
          ariaPressed={leftPanelVisible}
          isActive={leftPanelVisible}
          tooltipText={"Explorer  \u2318B"}
        >
          <FolderOpen size={13} />
        </StatusBarButton>

        <StatusBarButton
          onClick={toggleRightPanel}
          ariaLabel="Toggle changes panel"
          ariaPressed={rightPanelVisible}
          isActive={rightPanelVisible}
          tooltipText={"Changes  \u2318\u21E7="}
        >
          <GitCompareArrows size={13} />
        </StatusBarButton>

        {/* Separator */}
        <div
          style={{
            width: 1,
            height: 14,
            backgroundColor: theme.border,
            margin: "0 4px",
          }}
        />

        <ThemePicker />

        {/* Separator */}
        <div
          style={{
            width: 1,
            height: 14,
            backgroundColor: theme.border,
            margin: "0 4px",
          }}
        />

        <StatusBarButton
          onClick={() => setSettingsOpen(true)}
          ariaLabel="Open settings"
          isActive={false}
          tooltipText={"Settings  \u2318,"}
        >
          <Settings size={13} />
        </StatusBarButton>

        <StatusBarButton
          onClick={() => setAboutOpen(true)}
          ariaLabel="About Madsterm"
          isActive={false}
          tooltipText={"About"}
        >
          <Info size={13} />
        </StatusBarButton>
      </div>

      {/* Right side - shell, git branch, encoding */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <div
          style={infoItemStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.bgHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <Terminal size={11} />
          <span>{shellName}</span>
        </div>

        {branch && (
          <div
            style={infoItemStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.bgHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <GitBranch size={11} />
            <span>{branch}</span>
          </div>
        )}

        {/* Separator */}
        <div
          style={{
            width: 1,
            height: 14,
            backgroundColor: theme.border,
            margin: "0 4px",
          }}
        />

        <div
          style={{
            ...infoItemStyle,
            color: theme.statusBarText,
          }}
        >
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};
