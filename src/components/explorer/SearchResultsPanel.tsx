import { CaseSensitive, ChevronDown, ChevronRight, FileText, Regex, Search } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { openFile } from "../../commands/fs";
import { useContentSearch } from "../../hooks/useContentSearch";
import { useVimListNavigation } from "../../hooks/useVimListNavigation";
import { usePanelStore } from "../../stores/panelStore";
import { useThemeStore } from "../../stores/themeStore";
import { SearchMatchHighlight } from "./SearchMatchHighlight";

export const SearchResultsPanel: React.FC = () => {
  const theme = useThemeStore((s) => s.theme);
  const focusedPanel = usePanelStore((s) => s.focusedPanel);
  const {
    contentSearchQuery,
    contentSearchResults,
    contentSearchLoading,
    caseSensitive,
    wholeWord,
    useRegex,
    expandedResultFiles,
    searchFocusedIndex,
    flatList,
    setContentSearchQuery,
    toggleCaseSensitive,
    toggleWholeWord,
    toggleUseRegex,
    toggleResultFileExpanded,
    setSearchFocusedIndex,
  } = useContentSearch();

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  // Scroll focused item into view
  useEffect(() => {
    const el = containerRef.current?.querySelector(`[data-search-idx="${searchFocusedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [searchFocusedIndex]);

  // Expand/collapse handlers for vim navigation
  const onExpand = useCallback(() => {
    const item = flatList[searchFocusedIndex];
    if (!item) return;
    if (item.type === "file") {
      toggleResultFileExpanded(item.file.path);
    } else {
      openFile(item.file.absolutePath).catch(console.error);
    }
  }, [flatList, searchFocusedIndex, toggleResultFileExpanded]);

  const onCollapse = useCallback(() => {
    const item = flatList[searchFocusedIndex];
    if (!item) return;
    if (item.type === "file" && expandedResultFiles.has(item.file.path)) {
      toggleResultFileExpanded(item.file.path);
    }
  }, [flatList, searchFocusedIndex, expandedResultFiles, toggleResultFileExpanded]);

  const onEscape = useCallback(() => {
    if (document.activeElement === inputRef.current) {
      inputRef.current?.blur();
      containerRef.current?.focus();
    }
  }, []);

  const { handleKeyDown: vimKeyDown } = useVimListNavigation({
    items: flatList,
    focusedIndex: searchFocusedIndex,
    setFocusedIndex: setSearchFocusedIndex,
    onExpand,
    onCollapse,
    onEscape,
  });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Don't intercept keys when input is focused (except Escape)
      if (document.activeElement === inputRef.current && e.key !== "Escape") return;
      vimKeyDown(e);
    },
    [vimKeyDown],
  );

  const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    border: "none",
    cursor: "pointer",
    backgroundColor: active ? theme.accent : "transparent",
    color: active ? "#fff" : theme.textMuted,
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    transition: "all 0.12s ease",
  });

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        outline: "none",
      }}
    >
      {/* "Search" label */}
      <div
        style={{
          padding: "6px 10px 2px",
          fontSize: 11,
          fontWeight: 600,
          color: theme.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        Search
      </div>

      {/* Search input with toggle buttons */}
      <div style={{ padding: "4px 8px 6px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: theme.bg,
            border: `1px solid ${theme.border}`,
            gap: 0,
          }}
        >
          <input
            ref={inputRef}
            value={contentSearchQuery}
            onChange={(e) => setContentSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                inputRef.current?.blur();
                containerRef.current?.focus();
              }
              if (e.key === "Enter") {
                e.stopPropagation();
                inputRef.current?.blur();
                containerRef.current?.focus();
              }
            }}
            placeholder="Search in files..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: theme.text,
              fontSize: 12,
              fontFamily: "inherit",
              outline: "none",
              padding: "4px 8px",
              lineHeight: "18px",
              minWidth: 0,
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              paddingRight: 2,
              gap: 1,
            }}
          >
            <button
              title="Match Case (Alt+Cmd+C)"
              onClick={() => toggleCaseSensitive()}
              style={toggleBtnStyle(caseSensitive)}
            >
              <CaseSensitive size={14} />
            </button>
            <button
              title="Match Whole Word (Alt+Cmd+W)"
              onClick={() => toggleWholeWord()}
              style={{
                ...toggleBtnStyle(wholeWord),
                textDecoration: "underline",
                textUnderlineOffset: "2px",
              }}
            >
              ab
            </button>
            <button
              title="Use Regex (Alt+Cmd+R)"
              onClick={() => toggleUseRegex()}
              style={toggleBtnStyle(useRegex)}
            >
              <Regex size={14} />
            </button>
          </div>
        </div>

        {/* Results summary */}
        {contentSearchResults && contentSearchQuery && (
          <div
            style={{
              fontSize: 10,
              color: theme.textMuted,
              paddingTop: 3,
              paddingLeft: 2,
            }}
          >
            {contentSearchResults.totalMatches} result
            {contentSearchResults.totalMatches !== 1 ? "s" : ""} in{" "}
            {contentSearchResults.totalFiles} file
            {contentSearchResults.totalFiles !== 1 ? "s" : ""}
            {contentSearchResults.truncated && (
              <span style={{ color: theme.accent }}> (results limited)</span>
            )}
          </div>
        )}
      </div>

      {/* Empty state */}
      {!contentSearchQuery && !contentSearchLoading && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            color: theme.textMuted,
            padding: 20,
          }}
        >
          <Search size={32} strokeWidth={1.2} />
          <div style={{ fontSize: 13, fontWeight: 500 }}>Global search</div>
          <div style={{ fontSize: 11, textAlign: "center", lineHeight: 1.5 }}>
            Search in files across your current directories.
          </div>
        </div>
      )}

      {/* Loading */}
      {contentSearchLoading && (
        <div style={{ padding: "8px 10px", fontSize: 11, color: theme.textMuted }}>
          Searching...
        </div>
      )}

      {/* No results */}
      {contentSearchQuery &&
        !contentSearchLoading &&
        contentSearchResults &&
        contentSearchResults.totalMatches === 0 && (
          <div
            style={{
              padding: "12px",
              textAlign: "center",
              color: theme.textMuted,
              fontSize: 12,
            }}
          >
            No results found
          </div>
        )}

      {/* Results list */}
      {contentSearchResults && contentSearchResults.totalMatches > 0 && (
        <div
          style={{
            flex: 1,
            overflow: focusedPanel === "explorer" ? "auto" : "hidden",
            paddingBottom: 8,
          }}
        >
          {flatList.map((item, idx) => {
            const isFocused = idx === searchFocusedIndex;

            if (item.type === "file") {
              const isExpanded = expandedResultFiles.has(item.file.path);
              return (
                <div
                  key={`file-${item.file.path}`}
                  data-search-idx={idx}
                  onClick={() => {
                    setSearchFocusedIndex(idx);
                    toggleResultFileExpanded(item.file.path);
                    containerRef.current?.focus();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "3px 8px",
                    cursor: "pointer",
                    backgroundColor: isFocused ? theme.explorerSelected : "transparent",
                    fontSize: 12,
                    fontWeight: 500,
                    color: theme.text,
                    userSelect: "none",
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown size={12} color={theme.textMuted} style={{ flexShrink: 0 }} />
                  ) : (
                    <ChevronRight size={12} color={theme.textMuted} style={{ flexShrink: 0 }} />
                  )}
                  <FileText size={12} color={theme.explorerIcon} style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}
                  >
                    {item.file.path}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: theme.textMuted,
                      backgroundColor: theme.bgActive,
                      padding: "0 5px",
                      borderRadius: 8,
                      flexShrink: 0,
                      lineHeight: "16px",
                    }}
                  >
                    {item.file.matches.length}
                  </span>
                </div>
              );
            }

            // Match line
            return (
              <div
                key={`match-${item.file.path}-${item.matchIndex}`}
                data-search-idx={idx}
                onClick={() => {
                  setSearchFocusedIndex(idx);
                  openFile(item.file.absolutePath).catch(console.error);
                  containerRef.current?.focus();
                }}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 6,
                  padding: "2px 8px 2px 30px",
                  cursor: "pointer",
                  backgroundColor: isFocused ? theme.explorerSelected : "transparent",
                  fontSize: 12,
                  color: theme.text,
                  lineHeight: "18px",
                  userSelect: "none",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: theme.textMuted,
                    minWidth: 28,
                    textAlign: "right",
                    flexShrink: 0,
                    lineHeight: "18px",
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  }}
                >
                  {item.match.lineNumber}
                </span>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontSize: 11,
                  }}
                >
                  <SearchMatchHighlight match={item.match} />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
