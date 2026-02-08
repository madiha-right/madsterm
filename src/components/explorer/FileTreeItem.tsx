import {
  ChevronDown,
  ChevronRight,
  File,
  FileArchive,
  FileCode,
  FileImage,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
  Lock,
} from "lucide-react";
import { useRef } from "react";
import { useThemeStore } from "../../stores/themeStore";
import type { AppTheme } from "../../theme/themes";
import type { FileNode } from "../../types";

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  isFocused: boolean;
  isExpanded: boolean;
  onClick: () => void;
}

function getFileIcon(name: string, isDir: boolean, isExpanded: boolean, theme: AppTheme) {
  if (isDir) {
    return isExpanded ? (
      <FolderOpen size={14} color="#e8a838" />
    ) : (
      <Folder size={14} color="#e8a838" />
    );
  }

  const lower = name.toLowerCase();
  const ext = lower.split(".").pop();

  // Special filenames
  if (lower === "cargo.toml" || lower === "cargo.lock")
    return <FileCode size={14} color="#e06c75" />;
  if (lower === "package.json" || lower === "package-lock.json")
    return <FileJson size={14} color="#98c379" />;
  if (lower === "tsconfig.json") return <FileJson size={14} color="#61afef" />;
  if (lower === ".gitignore" || lower === ".env")
    return <FileText size={14} color={theme.textMuted} />;
  if (lower === "dockerfile" || lower.startsWith("dockerfile"))
    return <FileCode size={14} color="#61afef" />;
  if (lower === "makefile") return <FileCode size={14} color="#e8a838" />;
  if (lower === "license" || lower === "licence") return <FileText size={14} color="#e8a838" />;
  if (lower.endsWith(".lock")) return <Lock size={14} color={theme.textMuted} />;

  switch (ext) {
    // JavaScript/TypeScript
    case "ts":
    case "tsx":
      return <FileCode size={14} color="#61afef" />;
    case "js":
    case "jsx":
      return <FileCode size={14} color="#e8a838" />;
    case "mjs":
    case "cjs":
      return <FileCode size={14} color="#e8a838" />;

    // Data/Config
    case "json":
      return <FileJson size={14} color="#e8a838" />;
    case "toml":
    case "yaml":
    case "yml":
      return <FileJson size={14} color="#98c379" />;
    case "xml":
      return <FileJson size={14} color="#e06c75" />;
    case "env":
      return <FileText size={14} color={theme.textMuted} />;

    // Rust
    case "rs":
      return <FileCode size={14} color="#e06c75" />;

    // Web
    case "html":
    case "htm":
      return <FileCode size={14} color="#e06c75" />;
    case "css":
    case "scss":
    case "sass":
    case "less":
      return <FileCode size={14} color="#c678dd" />;
    case "svg":
      return <FileImage size={14} color="#e8a838" />;

    // Markdown/docs
    case "md":
    case "mdx":
    case "txt":
      return <FileText size={14} color="#56b6c2" />;

    // Python
    case "py":
    case "pyi":
      return <FileCode size={14} color="#61afef" />;

    // Go
    case "go":
      return <FileCode size={14} color="#56b6c2" />;

    // Shell
    case "sh":
    case "bash":
    case "zsh":
    case "fish":
      return <FileCode size={14} color="#98c379" />;

    // Images
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
    case "ico":
    case "bmp":
      return <FileImage size={14} color="#c678dd" />;

    // Archives
    case "zip":
    case "tar":
    case "gz":
    case "bz2":
    case "7z":
    case "rar":
      return <FileArchive size={14} color="#e8a838" />;

    // C/C++
    case "c":
    case "h":
    case "cpp":
    case "hpp":
    case "cc":
      return <FileCode size={14} color="#61afef" />;

    // Java/Kotlin
    case "java":
    case "kt":
    case "kts":
      return <FileCode size={14} color="#e06c75" />;

    // SQL
    case "sql":
      return <FileCode size={14} color="#e8a838" />;

    // Docker/Infra
    case "dockerfile":
      return <FileCode size={14} color="#61afef" />;

    default:
      return <File size={14} color={theme.explorerIcon} />;
  }
}

export const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node,
  depth,
  isFocused,
  isExpanded,
  onClick,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const theme = useThemeStore((s) => s.theme);

  return (
    <div
      ref={itemRef}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        paddingLeft: 12 + depth * 16,
        paddingRight: 8,
        height: 26,
        cursor: "pointer",
        backgroundColor: isFocused ? theme.explorerSelected : "transparent",
        color: isFocused ? theme.textBright : theme.text,
        fontSize: 13,
        fontFamily: "inherit",
        whiteSpace: "nowrap",
        overflow: "hidden",
        transition: "background-color 0.12s ease",
        borderLeft: isFocused ? `2px solid ${theme.accent}` : "2px solid transparent",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!isFocused) e.currentTarget.style.backgroundColor = theme.explorerHover;
      }}
      onMouseLeave={(e) => {
        if (!isFocused) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {/* Expand/collapse chevron for directories */}
      <span style={{ width: 14, flexShrink: 0, display: "flex", alignItems: "center" }}>
        {node.isDir ? (
          isExpanded ? (
            <ChevronDown size={14} color={theme.textMuted} />
          ) : (
            <ChevronRight size={14} color={theme.textMuted} />
          )
        ) : null}
      </span>

      {/* File/folder icon */}
      <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
        {getFileIcon(node.name, node.isDir, isExpanded, theme)}
      </span>

      {/* File name */}
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: isFocused ? theme.textBright : theme.text,
          opacity: isFocused ? 1 : 0.9,
        }}
      >
        {node.name}
      </span>
    </div>
  );
};
