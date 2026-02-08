import { ChevronDown, ChevronRight, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { useDiffStore } from "../../stores/diffStore";
import { useThemeStore } from "../../stores/themeStore";
import type { FileChange } from "../../types";
import { DiffViewer } from "./DiffViewer";

function getFileName(path: string) {
  return path.split("/").pop() || path;
}

function getFileDir(path: string) {
  const parts = path.split("/");
  parts.pop();
  return parts.length > 0 ? `${parts.join("/")}/` : "";
}

export const DiffFileSection: React.FC<{
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
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
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
