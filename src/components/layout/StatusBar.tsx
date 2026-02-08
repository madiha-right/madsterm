import { useEffect, useState } from "react";
import { FolderOpen, GitCompareArrows, GitBranch, Terminal, Settings } from "lucide-react";
import { usePanelStore } from "../../stores/panelStore";
import { useThemeStore } from "../../stores/themeStore";
import { fetchGitBranch } from "../../hooks/useGitDiff";
import { getCwd } from "../../hooks/useFileExplorer";
import { ThemePicker } from "./ThemePicker";

export const StatusBar: React.FC = () => {
  const { toggleLeftPanel, toggleRightPanel, leftPanelVisible, rightPanelVisible, setSettingsOpen } =
    usePanelStore();
  const theme = useThemeStore((s) => s.theme);
  const [branch, setBranch] = useState<string | null>(null);

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

  const buttonStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    color: active ? theme.accent : theme.statusBarText,
    cursor: "pointer",
    padding: "2px 6px",
    borderRadius: 0,
    fontSize: 10,
    fontFamily: "var(--font-ui)",
    height: 20,
    width: 24,
  });

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
        <button
          onClick={toggleLeftPanel}
          title="Toggle Explorer (Cmd+B)"
          style={buttonStyle(leftPanelVisible)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.bgHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <FolderOpen size={13} />
        </button>

        <button
          onClick={toggleRightPanel}
          title="Toggle Changes (Cmd+Shift+=)"
          style={buttonStyle(rightPanelVisible)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.bgHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <GitCompareArrows size={13} />
        </button>

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

        <button
          onClick={() => setSettingsOpen(true)}
          title="Settings (Cmd+,)"
          style={buttonStyle(false)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.bgHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <Settings size={13} />
        </button>
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
          <span>zsh</span>
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
