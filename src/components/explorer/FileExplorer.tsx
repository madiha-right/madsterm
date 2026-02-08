import { useEffect, useRef, useCallback, useState } from "react";
import { FolderTree, Search, X } from "lucide-react";
import { useFileExplorerStore } from "../../stores/fileExplorerStore";
import { usePanelStore } from "../../stores/panelStore";
import { readDirectory, getHomeDir, openFile } from "../../hooks/useFileExplorer";
import { useTabStore } from "../../stores/tabStore";
import { useThemeStore } from "../../stores/themeStore";
import { FileTree } from "./FileTree";
import { FileNode } from "../../types";

// Reusable toolbar icon button with tooltip that doesn't get clipped
const ToolbarButton: React.FC<{
  icon: React.ReactNode;
  tooltip: string;
  onClick: (e: React.MouseEvent) => void;
  isActive?: boolean;
}> = ({ icon, tooltip, onClick, isActive }) => {
  const theme = useThemeStore((s) => s.theme);
  const [hovered, setHovered] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  // Position tooltip so it never gets clipped by the window
  useEffect(() => {
    if (!hovered || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const tipWidth = tooltip.length * 7 + 16; // rough estimate
    const style: React.CSSProperties = {
      position: "fixed",
      top: rect.bottom + 6,
      zIndex: 9999,
      padding: "4px 8px",
      backgroundColor: theme.bgPanel,
      border: `1px solid ${theme.border}`,
      color: theme.text,
      fontSize: 11,
      whiteSpace: "nowrap",
      pointerEvents: "none",
    };
    // Center under button, but clamp to window
    let left = rect.left + rect.width / 2 - tipWidth / 2;
    if (left < 4) left = 4;
    if (left + tipWidth > window.innerWidth - 4) left = window.innerWidth - 4 - tipWidth;
    style.left = left;
    setTooltipStyle(style);
  }, [hovered, theme, tooltip]);

  return (
    <div ref={btnRef} style={{ position: "relative" }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered || isActive ? theme.bgHover : "transparent",
          border: "none",
          cursor: "pointer",
          padding: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: hovered || isActive ? theme.textBright : theme.textMuted,
          transition: "color 0.12s ease, background-color 0.12s ease",
        }}
      >
        {icon}
      </button>
      {hovered && <div style={tooltipStyle}>{tooltip}</div>}
    </div>
  );
};

export const FileExplorer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const theme = useThemeStore((s) => s.theme);
  const {
    rootPath,
    tree,
    expandedPaths,
    focusedIndex,
    searchQuery,
    isSearching,
    refreshFlag,
    setRootPath,
    setTree,
    setExpanded,
    setFocusedIndex,
    setSearchQuery,
    setIsSearching,
  } = useFileExplorerStore();
  const { focusedPanel, setFocusedPanel, toggleLeftPanel } = usePanelStore();
  const activeTabId = useTabStore((s) => s.activeTabId);
  const activeTab = useTabStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const [flatList, setFlatList] = useState<{ node: FileNode; depth: number }[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const gPressedRef = useRef(false);

  // Load initial directory
  useEffect(() => {
    const init = async () => {
      if (tree) return;
      setIsLoading(true);
      try {
        const home = rootPath || (await getHomeDir());
        const result = await readDirectory(home, 2);
        setRootPath(home);
        setTree(result);
        setExpanded(result.path, true);
      } catch (e: any) {
        const msg = typeof e === "string" ? e : e?.message || JSON.stringify(e);
        console.error("Failed to load directory:", msg);
        setLoadError(msg);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  // When switching to a tab that hasn't reported its CWD yet
  useEffect(() => {
    if (!activeTabId) return;
    if (!activeTab?.cwd && rootPath) {
      const reload = async () => {
        setIsLoading(true);
        try {
          const result = await readDirectory(rootPath, 2);
          setTree(result);
          setExpanded(result.path, true);
        } catch {
          // Keep existing tree if reload fails
        }
        setIsLoading(false);
      };
      reload();
    }
  }, [activeTabId]);

  // Sync with active tab CWD
  useEffect(() => {
    if (!activeTab?.cwd) return;
    const cwd = activeTab.cwd;
    if (cwd === rootPath) return;
    setTree(null);
    setIsLoading(true);
    setLoadError(null);
    const load = async () => {
      try {
        const result = await readDirectory(cwd, 2);
        setRootPath(cwd);
        setTree(result);
        setExpanded(result.path, true);
        setFocusedIndex(0);
      } catch (e: any) {
        const msg = typeof e === "string" ? e : e?.message || JSON.stringify(e);
        console.error("Failed to load directory:", msg);
      }
      setIsLoading(false);
    };
    load();
  }, [activeTab?.cwd]);

  // Refresh tree when refreshFlag changes
  useEffect(() => {
    if (refreshFlag === 0) return;
    if (!rootPath) return;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const result = await readDirectory(rootPath, 2);
        setTree(result);
        setExpanded(result.path, true);
      } catch (e: any) {
        const msg = typeof e === "string" ? e : e?.message || JSON.stringify(e);
        console.error("Failed to refresh directory:", msg);
      }
      setIsLoading(false);
    };
    load();
  }, [refreshFlag]);

  // Flatten the tree for keyboard navigation
  useEffect(() => {
    if (!tree) return;
    const flat: { node: FileNode; depth: number }[] = [];
    const flatten = (node: FileNode, depth: number) => {
      if (depth > 0) {
        const matchesSearch =
          !searchQuery || node.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (matchesSearch) {
          flat.push({ node, depth: depth - 1 });
        }
      }
      if (node.isDir && expandedPaths.has(node.path) && node.children) {
        for (const child of node.children) {
          flatten(child, depth + 1);
        }
      }
    };
    flatten(tree, 0);
    setFlatList(flat);
  }, [tree, expandedPaths, searchQuery]);

  const handleExpand = useCallback(
    async (node: FileNode) => {
      if (!node.isDir) return;
      if (!expandedPaths.has(node.path)) {
        if (!node.children || node.children.length === 0) {
          try {
            const loaded = await readDirectory(node.path, 1);
            const updateChildren = (root: FileNode): FileNode => {
              if (root.path === node.path) {
                return { ...root, children: loaded.children, isLoaded: true };
              }
              if (root.children) {
                return { ...root, children: root.children.map(updateChildren) };
              }
              return root;
            };
            if (tree) setTree(updateChildren(tree));
          } catch (e) {
            console.error("Failed to load directory:", e);
          }
        }
        setExpanded(node.path, true);
      } else {
        setExpanded(node.path, false);
      }
    },
    [expandedPaths, tree, setTree, setExpanded],
  );

  const handleFileOpen = useCallback(
    async (node: FileNode) => {
      if (node.isDir) {
        handleExpand(node);
      } else {
        try {
          await openFile(node.path);
        } catch (e) {
          console.error("Failed to open file:", e);
        }
      }
    },
    [handleExpand],
  );

  // Vim keybindings
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isSearching) {
        if (e.key === "Escape") {
          setIsSearching(false);
          setSearchQuery("");
          containerRef.current?.focus();
          return;
        }
        if (e.key === "Enter") {
          setIsSearching(false);
          containerRef.current?.focus();
          return;
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

      // Ctrl+D / Ctrl+U — half-page jump
      if (e.ctrlKey && (e.key === "d" || e.key === "u")) {
        e.preventDefault();
        const jump = 10;
        if (e.key === "d") {
          setFocusedIndex(Math.min(focusedIndex + jump, flatList.length - 1));
        } else {
          setFocusedIndex(Math.max(focusedIndex - jump, 0));
        }
        return;
      }

      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex(Math.min(focusedIndex + 1, flatList.length - 1));
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex(Math.max(focusedIndex - 1, 0));
          break;
        case "l":
        case "ArrowRight":
        case "Enter":
        case " ": {
          e.preventDefault();
          const item = flatList[focusedIndex];
          if (item) {
            handleFileOpen(item.node);
          }
          break;
        }
        case "h":
        case "ArrowLeft": {
          e.preventDefault();
          const item = flatList[focusedIndex];
          if (item?.node.isDir && expandedPaths.has(item.node.path)) {
            setExpanded(item.node.path, false);
          }
          break;
        }
        case "/":
          e.preventDefault();
          setIsSearching(true);
          setTimeout(() => searchInputRef.current?.focus(), 0);
          break;
        case "G":
          e.preventDefault();
          setFocusedIndex(flatList.length - 1);
          break;
        case "Escape":
          e.preventDefault();
          setFocusedPanel("terminal");
          break;
      }
    },
    [
      focusedIndex,
      flatList,
      isSearching,
      expandedPaths,
      handleFileOpen,
      setFocusedIndex,
      setExpanded,
      setIsSearching,
      setSearchQuery,
      setFocusedPanel,
    ],
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
      {/* Toolbar — 2 icons on left, close on right (matches Warp) */}
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
          tooltip="Project explorer  \u2318B"
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
          tooltip="Global search  /"
          isActive={isSearching}
          onClick={(e) => {
            e.stopPropagation();
            setIsSearching(true);
            setTimeout(() => searchInputRef.current?.focus(), 0);
          }}
        />
        <div style={{ flex: 1 }} />
        <ToolbarButton
          icon={<X size={14} />}
          tooltip="Close  \u2318B"
          onClick={(e) => {
            e.stopPropagation();
            toggleLeftPanel();
          }}
        />
      </div>

      {/* Search bar — only visible when searching */}
      {isSearching && (
        <div style={{ padding: "6px 8px", borderBottom: `1px solid ${theme.border}` }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 8px",
              backgroundColor: theme.bg,
              border: `1px solid ${theme.border}`,
            }}
          >
            <Search size={12} color={theme.textMuted} style={{ flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              aria-label="Search files"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearchQuery("");
                  setIsSearching(false);
                  containerRef.current?.focus();
                  e.stopPropagation();
                }
                if (e.key === "Enter") {
                  setIsSearching(false);
                  containerRef.current?.focus();
                  e.stopPropagation();
                }
              }}
              placeholder="Search files..."
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: theme.text,
                fontSize: 12,
                fontFamily: "inherit",
                outline: "none",
                padding: 0,
                lineHeight: "18px",
              }}
            />
          </div>
          {searchQuery && (
            <div
              style={{
                fontSize: 10,
                color: theme.textMuted,
                paddingTop: 3,
                paddingLeft: 2,
              }}
            >
              {flatList.length} match{flatList.length !== 1 ? "es" : ""}
            </div>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && !tree && (
        <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
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
          style={{ padding: "8px 12px", color: "#ff6b6b", fontSize: 11, wordBreak: "break-all" }}
        >
          Error: {loadError}
        </div>
      )}

      {/* Empty state */}
      {tree && flatList.length === 0 && !isLoading && (
        <div style={{ padding: "12px", textAlign: "center", color: theme.textMuted, fontSize: 12 }}>
          {searchQuery ? "No matching files" : "Empty directory"}
        </div>
      )}

      {/* Tree */}
      {!(isLoading && !tree) && (
        <div style={{ flex: 1, overflow: "auto", padding: "4px 0" }}>
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
    </div>
  );
};
