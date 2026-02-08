import { useRef, useEffect } from "react";
import { FilePlus, FileEdit, FileX, FileSymlink } from "lucide-react";
import { FileChange } from "../../types";
import { useThemeStore } from "../../stores/themeStore";
import type { AppTheme } from "../../theme/themes";

interface DiffFileListProps {
  changes: FileChange[];
  focusedIndex: number;
  selectedFilePath: string | null;
  onFileClick: (path: string, index: number) => void;
}

function getStatusIcon(status: string, theme: AppTheme) {
  switch (status) {
    case "added":
      return <FilePlus size={13} color={theme.diffAddedText} strokeWidth={1.8} />;
    case "deleted":
      return <FileX size={13} color={theme.diffRemovedText} strokeWidth={1.8} />;
    case "renamed":
      return <FileSymlink size={13} color="#d19a66" strokeWidth={1.8} />;
    default:
      return <FileEdit size={13} color="#e8a838" strokeWidth={1.8} />;
  }
}

function getFileName(path: string) {
  return path.split("/").pop() || path;
}

function getFileDir(path: string) {
  const parts = path.split("/");
  parts.pop();
  return parts.length > 0 ? parts.join("/") + "/" : "";
}

const DiffFileItem: React.FC<{
  change: FileChange;
  index: number;
  isFocused: boolean;
  isSelected: boolean;
  onClick: () => void;
}> = ({ change, isFocused, isSelected, onClick }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [isFocused]);

  return (
    <div
      ref={itemRef}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 14px",
        cursor: "pointer",
        backgroundColor: isFocused
          ? theme.explorerSelected
          : isSelected
          ? theme.bgHover
          : "transparent",
        color: theme.text,
        fontSize: 12,
        fontFamily: "inherit",
        transition: "background-color 0.08s",
        borderLeft: isFocused
          ? `2px solid ${theme.accent}`
          : "2px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isFocused)
          e.currentTarget.style.backgroundColor = theme.explorerHover;
      }}
      onMouseLeave={(e) => {
        if (!isFocused && !isSelected)
          e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {getStatusIcon(change.status, theme)}
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontWeight: 500, whiteSpace: "nowrap" }}>{getFileName(change.path)}</span>
        <span
          style={{
            color: theme.textMuted,
            fontSize: 10,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {getFileDir(change.path)}
        </span>
      </div>
      <span style={{ fontSize: 11, display: "flex", gap: 6, flexShrink: 0 }}>
        {change.additions > 0 && (
          <span style={{ color: theme.diffAddedText, fontWeight: 500 }}>+{change.additions}</span>
        )}
        {change.deletions > 0 && (
          <span style={{ color: theme.diffRemovedText, fontWeight: 500 }}>-{change.deletions}</span>
        )}
      </span>
      {change.is_staged && (
        <span
          style={{
            fontSize: 9,
            color: theme.accent,
            backgroundColor: theme.bgActive,
            padding: "1px 5px",
            borderRadius: 0,
            fontWeight: 600,
            letterSpacing: "0.3px",
            textTransform: "uppercase",
          }}
        >
          staged
        </span>
      )}
    </div>
  );
};

export const DiffFileList: React.FC<DiffFileListProps> = ({
  changes,
  focusedIndex,
  selectedFilePath,
  onFileClick,
}) => {
  return (
    <div style={{ padding: "4px 0" }}>
      {changes.map((change, index) => (
        <DiffFileItem
          key={`${change.path}-${change.is_staged}`}
          change={change}
          index={index}
          isFocused={index === focusedIndex}
          isSelected={change.path === selectedFilePath}
          onClick={() => onFileClick(change.path, index)}
        />
      ))}
    </div>
  );
};
