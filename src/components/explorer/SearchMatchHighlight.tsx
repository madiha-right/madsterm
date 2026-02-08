import { useThemeStore } from "../../stores/themeStore";
import type { SearchMatch } from "../../types";

export const SearchMatchHighlight: React.FC<{ match: SearchMatch }> = ({ match }) => {
  const theme = useThemeStore((s) => s.theme);
  const { lineContent, matchStart, matchEnd } = match;
  const chars = [...lineContent];
  const before = chars.slice(0, matchStart).join("");
  const matched = chars.slice(matchStart, matchEnd).join("");
  const after = chars.slice(matchEnd).join("");

  // Trim leading whitespace, show ... if trimmed
  const trimmedBefore = before.trimStart();
  const wasTrimmed = trimmedBefore.length < before.length;

  return (
    <span>
      {wasTrimmed && <span style={{ color: theme.textMuted }}>...</span>}
      {trimmedBefore}
      <span
        style={{
          backgroundColor: "rgba(230, 180, 60, 0.35)",
          color: theme.textBright,
          borderRadius: 1,
        }}
      >
        {matched}
      </span>
      {after}
    </span>
  );
};
