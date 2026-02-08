import { useEffect, useCallback, useRef } from "react";
import { GitCompareArrows, RefreshCw, Inbox } from "lucide-react";
import { useDiffStore } from "../../stores/diffStore";
import { usePanelStore } from "../../stores/panelStore";
import { useTabStore } from "../../stores/tabStore";
import { useThemeStore } from "../../stores/themeStore";
import { fetchGitStatus, fetchGitDiff } from "../../hooks/useGitDiff";
import { DiffFileList } from "./DiffFileList";
import { DiffViewer } from "./DiffViewer";

export const DiffPanel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gPressedRef = useRef(false);
  const theme = useThemeStore((s) => s.theme);
  const {
    changes,
    selectedFilePath,
    selectedFileDiff,
    focusedIndex,
    isLoading,
    setChanges,
    setSelectedFile,
    setSelectedFileDiff,
    setFocusedIndex,
    setIsLoading,
  } = useDiffStore();
  const { focusedPanel, setFocusedPanel } = usePanelStore();
  const activeTab = useTabStore((s) => s.tabs.find((t) => t.id === s.activeTabId));

  const loadStatus = useCallback(async () => {
    const cwd = activeTab?.cwd || "/Users";
    setIsLoading(true);
    try {
      const result = await fetchGitStatus(cwd);
      setChanges(result);
    } catch {
      setChanges([]);
    }
    setIsLoading(false);
  }, [activeTab?.cwd, setChanges, setIsLoading]);

  const loadFileDiff = useCallback(
    async (filePath: string) => {
      const cwd = activeTab?.cwd || "/Users";
      try {
        const diffs = await fetchGitDiff(cwd, filePath);
        if (diffs.length > 0) {
          setSelectedFileDiff(diffs[0]);
        }
      } catch {
        setSelectedFileDiff(null);
      }
    },
    [activeTab?.cwd, setSelectedFileDiff]
  );

  // Load on mount and poll
  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 3000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  // Load diff when file selected
  useEffect(() => {
    if (selectedFilePath) {
      loadFileDiff(selectedFilePath);
    } else {
      setSelectedFileDiff(null);
    }
  }, [selectedFilePath, loadFileDiff, setSelectedFileDiff]);

  // Vim keybindings
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // g -> wait for next key
      if (e.key === "g") {
        if (gPressedRef.current) {
          // gg -> jump to top
          setFocusedIndex(0);
          gPressedRef.current = false;
          e.preventDefault();
          return;
        }
        gPressedRef.current = true;
        setTimeout(() => { gPressedRef.current = false; }, 500);
        e.preventDefault();
        return;
      }
      gPressedRef.current = false;

      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex(Math.min(focusedIndex + 1, changes.length - 1));
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex(Math.max(focusedIndex - 1, 0));
          break;
        case "Enter":
        case "l":
        case "ArrowRight": {
          e.preventDefault();
          const file = changes[focusedIndex];
          if (file) {
            setSelectedFile(selectedFilePath === file.path ? null : file.path);
          }
          break;
        }
        case "h":
        case "ArrowLeft":
          e.preventDefault();
          setSelectedFile(null);
          break;
        case "G":
          e.preventDefault();
          setFocusedIndex(changes.length - 1);
          break;
        case "Escape":
          e.preventDefault();
          setFocusedPanel("terminal");
          break;
      }
    },
    [
      focusedIndex,
      changes,
      selectedFilePath,
      setFocusedIndex,
      setSelectedFile,
      setFocusedPanel,
    ]
  );

  useEffect(() => {
    if (focusedPanel === "diff" && containerRef.current) {
      containerRef.current.focus();
    }
  }, [focusedPanel]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => setFocusedPanel("diff")}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: theme.explorerBg,
        display: "flex",
        flexDirection: "column",
        outline: "none",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 12px",
          height: 38,
          minHeight: 38,
          fontSize: 11,
          fontWeight: 600,
          color: theme.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          borderBottom: `1px solid ${theme.border}`,
          backgroundColor: theme.bgSurface,
        }}
      >
        <GitCompareArrows size={13} />
        <span>Code review</span>
        {isLoading && (
          <span style={{ marginLeft: "auto", color: theme.textMuted, fontSize: 10 }}>...</span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            loadStatus();
          }}
          title="Refresh changes"
          style={{
            marginLeft: isLoading ? 0 : "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            color: theme.textMuted,
            cursor: "pointer",
            padding: 4,
            borderRadius: 0,
            height: 22,
            width: 22,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.bgHover;
            e.currentTarget.style.color = theme.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = theme.textMuted;
          }}
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Branch info */}
      <div
        style={{
          padding: "6px 12px",
          fontSize: 11,
          color: theme.textMuted,
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        Uncommitted changes
        {changes.length > 0 && (
          <span style={{ marginLeft: 8 }}>
            <span style={{ color: theme.diffAddedText }}>
              +{changes.reduce((sum, c) => sum + c.additions, 0)}
            </span>
            {" "}
            <span style={{ color: theme.diffRemovedText }}>
              -{changes.reduce((sum, c) => sum + c.deletions, 0)}
            </span>
          </span>
        )}
        <span style={{ marginLeft: 8, color: theme.textMuted }}>
          {changes.length} {changes.length === 1 ? "file" : "files"}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {changes.length === 0 && !isLoading ? (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              color: theme.textMuted,
              fontSize: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Inbox size={28} strokeWidth={1.2} color={theme.textMuted} style={{ opacity: 0.5 }} />
            <span>No changes detected</span>
          </div>
        ) : (
          <>
            <DiffFileList
              changes={changes}
              focusedIndex={focusedIndex}
              selectedFilePath={selectedFilePath}
              onFileClick={(path, index) => {
                setFocusedIndex(index);
                setSelectedFile(selectedFilePath === path ? null : path);
              }}
            />
            {selectedFileDiff && <DiffViewer diff={selectedFileDiff} />}
          </>
        )}
      </div>
    </div>
  );
};
