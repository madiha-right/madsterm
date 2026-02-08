import { GitCompareArrows, Inbox, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useGitPolling } from "../../hooks/useGitPolling";
import { useVimListNavigation } from "../../hooks/useVimListNavigation";
import { useDiffStore } from "../../stores/diffStore";
import { usePanelStore } from "../../stores/panelStore";
import { useThemeStore } from "../../stores/themeStore";
import { DiffFileSection } from "./DiffFileSection";

export const DiffPanel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useThemeStore((s) => s.theme);
  const {
    changes,
    expandedFiles,
    fileDiffs,
    focusedIndex,
    isLoading,
    toggleFileExpanded,
    setFocusedIndex,
  } = useDiffStore();
  const { focusedPanel, setFocusedPanel, toggleRightPanel } = usePanelStore();
  const { branchName, handleToggleFile } = useGitPolling();

  const onExpand = useCallback(() => {
    const file = changes[focusedIndex];
    if (file) {
      handleToggleFile(file.path);
    }
  }, [changes, focusedIndex, handleToggleFile]);

  const onCollapse = useCallback(() => {
    const file = changes[focusedIndex];
    if (file && expandedFiles.has(file.path)) {
      toggleFileExpanded(file.path);
    }
  }, [changes, focusedIndex, expandedFiles, toggleFileExpanded]);

  const onEscape = useCallback(() => {
    setFocusedPanel("terminal");
  }, [setFocusedPanel]);

  const { handleKeyDown } = useVimListNavigation({
    items: changes,
    focusedIndex,
    setFocusedIndex,
    onExpand,
    onCollapse,
    onEscape,
  });

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
