import type { SearchAddon } from "@xterm/addon-search";
import { CaseSensitive, ChevronDown, ChevronUp, Regex, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useThemeStore } from "../../stores/themeStore";

interface SearchBarProps {
  searchAddon: SearchAddon | null;
  focusTrigger?: number;
  onClose: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ searchAddon, focusTrigger, onClose }) => {
  const [query, setQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [focusTrigger]);

  const doSearch = useCallback(
    (direction: "next" | "previous") => {
      if (!searchAddon || !query) return;
      const options = {
        caseSensitive,
        regex: useRegex,
        incremental: direction === "next",
      };
      if (direction === "next") {
        searchAddon.findNext(query, options);
      } else {
        searchAddon.findPrevious(query, options);
      }
    },
    [searchAddon, query, caseSensitive, useRegex],
  );

  // Search on query/option changes
  useEffect(() => {
    if (!query) {
      searchAddon?.clearDecorations();
      return;
    }
    doSearch("next");
  }, [query, doSearch, searchAddon]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      searchAddon?.clearDecorations();
      onClose();
    } else if (e.key === "Enter") {
      if (e.shiftKey) {
        doSearch("previous");
      } else {
        doSearch("next");
      }
    }
  };

  const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    border: "none",
    borderRadius: 0,
    cursor: "pointer",
    backgroundColor: active ? theme.accent : "transparent",
    color: active ? "#fff" : theme.textMuted,
    transition: "all 0.15s ease",
  });

  const navBtnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    border: "none",
    borderRadius: 0,
    cursor: "pointer",
    backgroundColor: "transparent",
    color: theme.textMuted,
    transition: "all 0.15s ease",
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 8,
        right: 16,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 10px",
        backgroundColor: theme.bgPanel,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${theme.border}`,
        borderRadius: 0,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setInputFocused(true)}
        onBlur={() => setInputFocused(false)}
        placeholder="Find in terminal..."
        style={{
          width: 240,
          padding: "5px 10px",
          fontSize: 12,
          fontFamily: "inherit",
          backgroundColor: theme.bg,
          border: `1px solid ${inputFocused ? theme.accent : theme.border}`,
          borderRadius: 0,
          color: theme.text,
          outline: "none",
          transition: "border-color 0.15s ease",
        }}
      />

      {/* Toggle buttons */}
      <button
        onClick={() => setCaseSensitive(!caseSensitive)}
        style={toggleBtnStyle(caseSensitive)}
        title="Case Sensitive"
        onMouseEnter={(e) => {
          if (!caseSensitive) e.currentTarget.style.backgroundColor = theme.bgHover;
        }}
        onMouseLeave={(e) => {
          if (!caseSensitive) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <CaseSensitive size={14} />
      </button>

      <button
        onClick={() => setUseRegex(!useRegex)}
        style={toggleBtnStyle(useRegex)}
        title="Use Regex"
        onMouseEnter={(e) => {
          if (!useRegex) e.currentTarget.style.backgroundColor = theme.bgHover;
        }}
        onMouseLeave={(e) => {
          if (!useRegex) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <Regex size={14} />
      </button>

      {/* Separator */}
      <div
        style={{
          width: 1,
          height: 18,
          backgroundColor: theme.border,
          margin: "0 4px",
        }}
      />

      {/* Nav buttons */}
      <button
        onClick={() => doSearch("previous")}
        style={navBtnStyle}
        title="Previous Match (Shift+Enter)"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.bgHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <ChevronUp size={14} />
      </button>

      <button
        onClick={() => doSearch("next")}
        style={navBtnStyle}
        title="Next Match (Enter)"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.bgHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <ChevronDown size={14} />
      </button>

      {/* Close */}
      <button
        onClick={() => {
          searchAddon?.clearDecorations();
          onClose();
        }}
        style={navBtnStyle}
        title="Close (Escape)"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.bgHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};
