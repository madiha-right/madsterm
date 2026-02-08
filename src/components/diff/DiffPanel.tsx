import { useEffect, useCallback, useRef, useState } from "react";
import {
  GitCompareArrows,
  RefreshCw,
  X,
  Inbox,
  ChevronRight,
  ChevronDown,
  Copy,
} from "lucide-react";
import { useDiffStore } from "../../stores/diffStore";
import { usePanelStore } from "../../stores/panelStore";
import { useTabStore } from "../../stores/tabStore";
import { useThemeStore } from "../../stores/themeStore";
import { fetchGitStatus, fetchGitDiff } from "../../hooks/useGitDiff";
import { getHomeDir } from "../../hooks/useFileExplorer";
import { DiffViewer } from "./DiffViewer";
import { FileChange } from "../../types";

function getFileName(path: string) {
  return path.split("/").pop() || path;
}

function getFileDir(path: string) {
  const parts = path.split("/");
  parts.pop();
  return parts.length > 0 ? parts.join("/") + "/" : "";
}

export const DiffPanel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gPressedRef = useRef(false);
  const theme = useThemeStore((s) => s.theme);
  const {
    changes,
    expandedFiles,
    fileDiffs,
    focusedIndex,
    isLoading,
    setChanges,
    toggleFileExpanded,
    setFileDiff,
    setFocusedIndex,
    setIsLoading,
  } = useDiffStore();
  const { focusedPanel, setFocusedPanel, toggleRightPanel } = usePanelStore();
  const activeTab = useTabStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const [homeDir, setHomeDir] = useState<string | null>(null);
  const isGitRepoRef = useRef(true);
  const [branchName, setBranchName] = useState<string>("main");

  useEffect(() => {
    getHomeDir()
      .then(setHomeDir)
      .catch(() => {});
  }, []);

  const getEffectiveCwd = useCallback(() => {
    return activeTab?.cwd || homeDir || null;
  }, [activeTab?.cwd, homeDir]);

  const loadStatus = useCallback(async () => {
    const cwd = getEffectiveCwd();
    if (!cwd) {
      setChanges([]);
      return;
    }
    setIsLoading(true);
    try {
      const IGNORED_FILES = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "Cargo.lock"];
      const result = (await fetchGitStatus(cwd)).filter(
        (c) => !IGNORED_FILES.some((f) => c.path.endsWith(f)),
      );
      setChanges(result);
      isGitRepoRef.current = true;
      // Try to get branch name
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const branch = await invoke<string>("git_branch", { cwd });
        setBranchName(branch);
      } catch {
        // Branch name unavailable, keep default
      }
    } catch {
      setChanges([]);
      isGitRepoRef.current = false;
    }
    setIsLoading(false);
  }, [getEffectiveCwd, setChanges, setIsLoading]);

  const loadFileDiff = useCallback(
    async (filePath: string) => {
      const cwd = getEffectiveCwd();
      if (!cwd) return;
      try {
        const diffs = await fetchGitDiff(cwd, filePath);
        if (diffs.length > 0) {
          setFileDiff(filePath, diffs[0]);
        }
      } catch {
        // Diff load failed, silently ignore
      }
    },
    [getEffectiveCwd, setFileDiff],
  );

  // Load on mount and poll every 5s
  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  // Immediate refresh on tab switch
  useEffect(() => {
    loadStatus();
  }, [activeTab?.cwd, loadStatus]);

  // Load diff when a file is expanded — read from store directly to avoid stale closures
  const handleToggleFile = useCallback(
    (path: string) => {
      const state = useDiffStore.getState();
      const isExpanding = !state.expandedFiles.has(path);
      toggleFileExpanded(path);
      if (isExpanding && !state.fileDiffs.has(path)) {
        loadFileDiff(path);
      }
    },
    [toggleFileExpanded, loadFileDiff],
  );

  // Vim keybindings
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Ctrl+D / Ctrl+U — half-page jump
      if (e.ctrlKey && (e.key === "d" || e.key === "u")) {
        e.preventDefault();
        const jump = 10;
        if (e.key === "d") {
          setFocusedIndex(Math.min(focusedIndex + jump, changes.length - 1));
        } else {
          setFocusedIndex(Math.max(focusedIndex - jump, 0));
        }
        return;
      }

      // g -> wait for next key
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
        case " ":
        case "Enter":
        case "l":
        case "ArrowRight": {
          e.preventDefault();
          const file = changes[focusedIndex];
          if (file) {
            handleToggleFile(file.path);
          }
          break;
        }
        case "h":
        case "ArrowLeft": {
          e.preventDefault();
          const file = changes[focusedIndex];
          if (file && expandedFiles.has(file.path)) {
            toggleFileExpanded(file.path);
          }
          break;
        }
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
      expandedFiles,
      setFocusedIndex,
      handleToggleFile,
      toggleFileExpanded,
      setFocusedPanel,
    ],
  );

  useEffect(() => {
    if (focusedPanel === "diff" && containerRef.current) {
      containerRef.current.focus();
    }
  }, [focusedPanel]);

  const totalAdditions = changes.reduce((sum, c) => sum + c.additions, 0);
  const totalDeletions = changes.reduce((sum, c) => sum + c.deletions, 0);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Code review panel"
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
          <RefreshCw
            size={10}
            style={{
              marginLeft: "auto",
              color: theme.textMuted,
              animation: "spin-loading 1s linear infinite",
            }}
          />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleRightPanel();
          }}
          title="Close panel"
          aria-label="Close panel"
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
          <X size={12} />
        </button>
      </div>

      {/* Branch + summary bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          fontSize: 11,
          borderBottom: `1px solid ${theme.border}`,
          backgroundColor: theme.bgSurface,
        }}
      >
        <span style={{ color: theme.textBright, fontWeight: 600 }}>{branchName}</span>
        <span style={{ color: theme.textMuted }}>
          {changes.length} {changes.length === 1 ? "file" : "files"}
        </span>
        {(totalAdditions > 0 || totalDeletions > 0) && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "1px 6px",
              backgroundColor: theme.bgActive,
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            <span style={{ color: theme.diffAddedText }}>+{totalAdditions}</span>
            <span style={{ color: theme.diffRemovedText }}>-{totalDeletions}</span>
          </span>
        )}
        <span
          style={{
            marginLeft: "auto",
            color: theme.textMuted,
            fontSize: 10,
          }}
        >
          Uncommitted changes
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
          <div>
            {changes.map((change, index) => (
              <DiffFileSection
                key={`${change.path}-${change.is_staged}`}
                change={change}
                index={index}
                isFocused={index === focusedIndex}
                isExpanded={expandedFiles.has(change.path)}
                diff={fileDiffs.get(change.path) || null}
                onToggle={() => {
                  setFocusedIndex(index);
                  handleToggleFile(change.path);
                }}
                onFocus={() => setFocusedIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin-loading {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Accordion file section
const DiffFileSection: React.FC<{
  change: FileChange;
  index: number;
  isFocused: boolean;
  isExpanded: boolean;
  diff: ReturnType<typeof useDiffStore.getState>["fileDiffs"] extends Map<string, infer V>
    ? V | null
    : never;
  onToggle: () => void;
  onFocus: () => void;
}> = ({ change, isFocused, isExpanded, diff, onToggle, onFocus }) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const theme = useThemeStore((s) => s.theme);
  const [headerHovered, setHeaderHovered] = useState(false);
  const [copyHovered, setCopyHovered] = useState(false);

  useEffect(() => {
    if (isFocused && headerRef.current) {
      headerRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [isFocused]);

  return (
    <div style={{ borderBottom: `1px solid ${theme.border}` }}>
      {/* File header */}
      <div
        ref={headerRef}
        onClick={() => {
          onFocus();
          onToggle();
        }}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          cursor: "pointer",
          backgroundColor: isFocused
            ? theme.explorerSelected
            : headerHovered
              ? theme.explorerHover
              : "transparent",
          borderLeft: isFocused ? `2px solid ${theme.accent}` : "2px solid transparent",
          transition: "background-color 0.08s",
        }}
      >
        {/* Expand/collapse chevron */}
        {isExpanded ? (
          <ChevronDown size={14} color={theme.textMuted} style={{ flexShrink: 0 }} />
        ) : (
          <ChevronRight size={14} color={theme.textMuted} style={{ flexShrink: 0 }} />
        )}

        {/* File path */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              fontSize: 12,
              color: theme.text,
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {getFileDir(change.path)}
            <span style={{ color: theme.textBright, fontWeight: 600 }}>
              {getFileName(change.path)}
            </span>
          </span>
        </div>

        {/* Copy path button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(change.path);
          }}
          onMouseEnter={() => setCopyHovered(true)}
          onMouseLeave={() => setCopyHovered(false)}
          title="Copy path"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            color: copyHovered ? theme.text : theme.textMuted,
            cursor: "pointer",
            padding: 2,
            opacity: headerHovered || isFocused ? 1 : 0,
            transition: "opacity 0.1s",
          }}
        >
          <Copy size={12} />
        </button>

        {/* Stats badge */}
        {(change.additions > 0 || change.deletions > 0) && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              padding: "1px 6px",
              backgroundColor: theme.bgActive,
              fontSize: 10,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {change.additions > 0 && (
              <span style={{ color: theme.diffAddedText }}>+{change.additions}</span>
            )}
            {change.additions > 0 && change.deletions > 0 && (
              <span style={{ color: theme.textMuted }}>&middot;</span>
            )}
            {change.deletions > 0 && (
              <span style={{ color: theme.diffRemovedText }}>-{change.deletions}</span>
            )}
          </span>
        )}

        {/* Staged badge */}
        {change.is_staged && (
          <span
            style={{
              fontSize: 9,
              color: theme.accent,
              backgroundColor: theme.bgActive,
              padding: "1px 5px",
              fontWeight: 600,
              letterSpacing: "0.3px",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            staged
          </span>
        )}
      </div>

      {/* Inline diff viewer */}
      {isExpanded && (
        <div>
          {diff ? (
            <DiffViewer diff={diff} />
          ) : (
            <div
              style={{
                padding: "12px",
                color: theme.textMuted,
                fontSize: 11,
                textAlign: "center",
              }}
            >
              Loading diff...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
