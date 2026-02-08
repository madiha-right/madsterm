import { FolderTree, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useDirectoryLoader } from "../../hooks/useDirectoryLoader";
import { useVimListNavigation } from "../../hooks/useVimListNavigation";
import { useFileExplorerStore } from "../../stores/fileExplorerStore";
import { usePanelStore } from "../../stores/panelStore";
import { useThemeStore } from "../../stores/themeStore";
import { FileTree } from "./FileTree";
import { SearchResultsPanel } from "./SearchResultsPanel";
import { ToolbarButton } from "./ToolbarButton";

export const FileExplorer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useThemeStore((s) => s.theme);
  const {
    tree,
    expandedPaths,
    focusedIndex,
    isSearching,
    setExpanded,
    setFocusedIndex,
    setSearchQuery,
    setIsSearching,
  } = useFileExplorerStore();
  const { focusedPanel, setFocusedPanel, toggleLeftPanel } = usePanelStore();
  const { flatList, isLoading, loadError, handleFileOpen } = useDirectoryLoader();

  const onExpand = useCallback(() => {
    const item = flatList[focusedIndex];
    if (item) {
      handleFileOpen(item.node);
    }
  }, [flatList, focusedIndex, handleFileOpen]);

  const onCollapse = useCallback(() => {
    const item = flatList[focusedIndex];
    if (item?.node.isDir && expandedPaths.has(item.node.path)) {
      setExpanded(item.node.path, false);
    }
  }, [flatList, focusedIndex, expandedPaths, setExpanded]);

  const onEscape = useCallback(() => {
    setFocusedPanel("terminal");
  }, [setFocusedPanel]);

  const { handleKeyDown: vimKeyDown } = useVimListNavigation({
    items: flatList,
    focusedIndex,
    setFocusedIndex,
    onExpand,
    onCollapse,
    onEscape,
  });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // When in content search mode, let SearchResultsPanel handle its own keys
      if (isSearching) return;

      // "/" opens search mode
      if (e.key === "/") {
        e.preventDefault();
        setIsSearching(true);
        return;
      }

      vimKeyDown(e);
    },
    [isSearching, setIsSearching, vimKeyDown],
  );

  // Auto-focus when panel becomes focused
  useEffect(() => {
    if (focusedPanel === "explorer" && containerRef.current) {
      containerRef.current.focus();
    }
  }, [focusedPanel]);

  return (
    <div
      ref={containerRef}
      role="tree"
      aria-label="File explorer"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => setFocusedPanel("explorer")}
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
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "4px 6px",
          borderBottom: `1px solid ${theme.border}`,
          minHeight: 32,
          gap: 1,
        }}
      >
        <ToolbarButton
          icon={<FolderTree size={14} />}
          tooltip={"\u2318\u21E7E"}
          isActive={!isSearching}
          onClick={(e) => {
            e.stopPropagation();
            if (isSearching) {
              setIsSearching(false);
              setSearchQuery("");
              containerRef.current?.focus();
            }
          }}
        />
        <ToolbarButton
          icon={<Search size={14} />}
          tooltip={"\u2318\u21E7F"}
          isActive={isSearching}
          onClick={(e) => {
            e.stopPropagation();
            setIsSearching(true);
          }}
        />
        <div style={{ flex: 1 }} />
        <ToolbarButton
          icon={<X size={14} />}
          tooltip={"\u2318\u21E7E"}
          onClick={(e) => {
            e.stopPropagation();
            toggleLeftPanel();
          }}
        />
      </div>

      {/* Content search panel -- replaces tree when searching */}
      {isSearching ? (
        <SearchResultsPanel />
      ) : (
        <>
          {/* Loading skeleton */}
          {isLoading && !tree && (
            <div
              style={{
                padding: "8px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    paddingLeft: i % 3 === 0 ? 0 : 16,
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      backgroundColor: theme.bgActive,
                      animation: "skeleton-pulse 1.2s ease-in-out infinite",
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                  <div
                    style={{
                      height: 12,
                      backgroundColor: theme.bgActive,
                      width: `${45 + ((i * 17) % 40)}%`,
                      animation: "skeleton-pulse 1.2s ease-in-out infinite",
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                </div>
              ))}
              <style>{`
                @keyframes skeleton-pulse {
                  0%, 100% { opacity: 0.3; }
                  50% { opacity: 0.7; }
                }
              `}</style>
            </div>
          )}

          {/* Error display */}
          {loadError && (
            <div
              style={{
                padding: "8px 12px",
                color: "#ff6b6b",
                fontSize: 11,
                wordBreak: "break-all",
              }}
            >
              Error: {loadError}
            </div>
          )}

          {/* Empty state */}
          {tree && flatList.length === 0 && !isLoading && (
            <div
              style={{
                padding: "12px",
                textAlign: "center",
                color: theme.textMuted,
                fontSize: 12,
              }}
            >
              Empty directory
            </div>
          )}

          {/* Tree */}
          {!(isLoading && !tree) && (
            <div
              style={{
                flex: 1,
                overflow: focusedPanel === "explorer" ? "auto" : "hidden",
                padding: "4px 0",
              }}
            >
              <FileTree
                items={flatList}
                focusedIndex={focusedIndex}
                expandedPaths={expandedPaths}
                onItemClick={(index) => {
                  setFocusedIndex(index);
                  const item = flatList[index];
                  if (item) {
                    handleFileOpen(item.node);
                  }
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
