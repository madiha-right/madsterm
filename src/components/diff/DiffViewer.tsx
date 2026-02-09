import { useMemo, useState } from "react";
import { useThemeStore } from "../../stores/themeStore";
import type { FileDiff } from "../../types";
import { buildColorMap, detectLanguage, highlightLine } from "./highlightCode";

interface DiffViewerProps {
  diff: FileDiff;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diff }) => {
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  const theme = useThemeStore((s) => s.theme);

  const language = useMemo(() => detectLanguage(diff.path), [diff.path]);
  const colorMap = useMemo(() => buildColorMap(theme.xtermTheme), [theme]);

  if (diff.is_binary) {
    return <div style={{ padding: 12, color: theme.textMuted, fontSize: 12 }}>Binary file</div>;
  }

  return (
    <div
      style={{
        borderTop: `1px solid ${theme.border}`,
        fontSize: 12,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
        lineHeight: 1.5,
      }}
    >
      {diff.hunks.map((hunk, hunkIdx) => (
        <div key={hunkIdx}>
          {/* Hunk header */}
          <div
            style={{
              backgroundColor: theme.diffHunkHeader,
              color: theme.diffHunkHeaderText,
              padding: "2px 12px",
              fontSize: 11,
              fontStyle: "italic",
              borderTop: hunkIdx > 0 ? `1px solid ${theme.border}` : undefined,
            }}
          >
            {hunk.header.trim()}
          </div>

          {/* Lines */}
          {hunk.lines.map((line, lineIdx) => {
            const isAdd = line.origin === "+";
            const isDel = line.origin === "-";
            const lineKey = `${hunkIdx}-${lineIdx}`;
            const isHovered = hoveredLine === lineKey;
            const bgColor = isAdd
              ? theme.diffAddedBg
              : isDel
                ? theme.diffRemovedBg
                : isHovered
                  ? "rgba(255,255,255,0.02)"
                  : "transparent";

            const content = line.content.replace(/\n$/, "");
            const highlighted = language ? highlightLine(content, language, colorMap) : null;

            return (
              <div
                key={lineIdx}
                onMouseEnter={() => setHoveredLine(lineKey)}
                onMouseLeave={() => setHoveredLine(null)}
                style={{
                  display: "flex",
                  backgroundColor: bgColor,
                  minHeight: 20,
                  transition: "background-color 0.08s",
                }}
              >
                {/* Old line number */}
                <span
                  style={{
                    width: 45,
                    minWidth: 45,
                    textAlign: "right",
                    padding: "0 8px 0 4px",
                    color: theme.textMuted,
                    fontSize: 11,
                    userSelect: "none",
                    opacity: isHovered ? 0.8 : 0.5,
                    borderRight: `1px solid ${theme.border}`,
                    transition: "opacity 0.08s",
                  }}
                >
                  {line.old_lineno ?? ""}
                </span>

                {/* New line number */}
                <span
                  style={{
                    width: 45,
                    minWidth: 45,
                    textAlign: "right",
                    padding: "0 8px 0 4px",
                    color: theme.textMuted,
                    fontSize: 11,
                    userSelect: "none",
                    opacity: isHovered ? 0.8 : 0.5,
                    borderRight: `1px solid ${theme.border}`,
                    transition: "opacity 0.08s",
                  }}
                >
                  {line.new_lineno ?? ""}
                </span>

                {/* Origin indicator */}
                <span
                  style={{
                    width: 18,
                    minWidth: 18,
                    textAlign: "center",
                    color: isAdd
                      ? theme.diffAddedText
                      : isDel
                        ? theme.diffRemovedText
                        : "transparent",
                    userSelect: "none",
                    fontWeight: 600,
                    opacity: isAdd || isDel ? 0.9 : 0,
                  }}
                >
                  {line.origin === " " ? "" : line.origin}
                </span>

                {/* Content */}
                {highlighted ? (
                  <span
                    style={{
                      flex: 1,
                      color: theme.text,
                      whiteSpace: "pre",
                      overflow: "hidden",
                      paddingRight: 12,
                    }}
                    dangerouslySetInnerHTML={{ __html: highlighted }}
                  />
                ) : (
                  <span
                    style={{
                      flex: 1,
                      color: isAdd
                        ? theme.diffAddedText
                        : isDel
                          ? theme.diffRemovedText
                          : theme.text,
                      whiteSpace: "pre",
                      overflow: "hidden",
                      paddingRight: 12,
                    }}
                  >
                    {content}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
