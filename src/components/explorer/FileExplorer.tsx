import { useEffect, useRef, useCallback, useState } from "react";
import { FolderOpen, Search, RotateCw, ChevronsDownUp } from "lucide-react";
import { useFileExplorerStore } from "../../stores/fileExplorerStore";
import { usePanelStore } from "../../stores/panelStore";
import { readDirectory, getHomeDir, openFile } from "../../hooks/useFileExplorer";
import { useTabStore } from "../../stores/tabStore";
import { useThemeStore } from "../../stores/themeStore";
import { FileTree } from "./FileTree";
import { FileNode } from "../../types";

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
    collapseAll,
    refreshTree,
  } = useFileExplorerStore();
  const { focusedPanel, setFocusedPanel } = usePanelStore();
  const activeTabId = useTabStore((s) => s.activeTabId);
  const activeTab = useTabStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const [flatList, setFlatList] = useState<{ node: FileNode; depth: number }[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [headerHovered, setHeaderHovered] = useState(false);
  const [homeDir, setHomeDir] = useState<string | null>(null);
  const gPressedRef = useRef(false);

  // Load initial directory and fetch home dir
  useEffect(() => {
    const init = async () => {
      try {
        const home = await getHomeDir();
        setHomeDir(home);
      } catch {}
      if (tree) return;
      setIsLoading(true);
      try {
        const home = rootPath || await getHomeDir();
        const result = await readDirectory(home, 2);
        setRootPath(home);
        setTree(result);
        setExpanded(result.path, true);
      } catch (e: any) {
        const msg = typeof e === 'string' ? e : e?.message || JSON.stringify(e);
        console.error("Failed to load directory:", msg);
        setLoadError(msg);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  // Show skeleton when switching to a tab that hasn't reported its CWD yet
  useEffect(() => {
    if (!activeTabId) return;
    if (!activeTab?.cwd && rootPath) {
      setTree(null);
      setIsLoading(true);
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
        const msg = typeof e === 'string' ? e : e?.message || JSON.stringify(e);
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
        const msg = typeof e === 'string' ? e : e?.message || JSON.stringify(e);
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
        const matchesSearch = !searchQuery ||
          node.name.toLowerCase().includes(searchQuery.toLowerCase());
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
        // Load children if not loaded
        if (!node.children || node.children.length === 0) {
          try {
            const loaded = await readDirectory(node.path, 1);
            // Update the tree
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
    [expandedPaths, tree, setTree, setExpanded]
  );

  const handleFileOpen = useCallback(
    async (node: FileNode) => {
      if (node.isDir) {
        handleExpand(node);
      } else {
        // Open file with default system application
        try {
          await openFile(node.path);
        } catch (e) {
          console.error("Failed to open file:", e);
        }
      }
    },
    [handleExpand]
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
        // Let the search input handle the rest
        return;
      }

      // g -> wait for next key
      if (e.key === "g") {
        if (gPressedRef.current) {
          // gg -> jump to top
          setFocusedIndex(0);
          gPressedRef.current = false;
          e.preventDefault();
          return;
        }
        gPressedRef.current = true;
        setTimeout(() => { gPressedRef.current = false; }, 500);
        e.preventDefault();
        return;
      }
      gPressedRef.current = false;

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
          // Focus the always-visible search input
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
    ]
  );

  // Auto-focus when panel becomes focused
  useEffect(() => {
    if (focusedPanel === "explorer" && containerRef.current) {
      containerRef.current.focus();
    }
  }, [focusedPanel]);

  // Extract folder name and display path from rootPath
  const folderName = rootPath ? rootPath.split("/").filter(Boolean).pop() || "Explorer" : "Explorer";
  const displayPath = rootPath
    ? (homeDir && rootPath.startsWith(homeDir) ? "~" + rootPath.slice(homeDir.length) : rootPath)
    : null;

  return (
    <div
      ref={containerRef}
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
      {/* Header */}
      <div
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 12px",
          borderBottom: `1px solid ${theme.border}`,
          minHeight: 38,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <FolderOpen size={14} color={theme.accent} style={{ flexShrink: 0 }} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: theme.textBright,
                letterSpacing: "0.3px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {folderName}
            </span>
          </div>
          {displayPath && (
            <span
              title={rootPath || undefined}
              style={{
                fontSize: 10,
                color: theme.textMuted,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                paddingLeft: 21,
              }}
            >
              {displayPath}
            </span>
          )}
        </div>

        {/* Header action buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            opacity: headerHovered ? 1 : 0.4,
            transition: "opacity 0.15s ease",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              collapseAll();
            }}
            title="Collapse all"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "3px 4px",
              borderRadius: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.textMuted,
              transition: "color 0.15s ease, background-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.textBright;
              e.currentTarget.style.backgroundColor = theme.bgHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.textMuted;
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <ChevronsDownUp size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              refreshTree();
            }}
            title="Refresh"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "3px 4px",
              borderRadius: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.textMuted,
              transition: "color 0.15s ease, background-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.textBright;
              e.currentTarget.style.backgroundColor = theme.bgHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.textMuted;
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <RotateCw size={13} />
          </button>
        </div>
      </div>

      {/* Always-visible search bar */}
      <div style={{ padding: "6px 8px", borderBottom: `1px solid ${theme.border}` }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 8px",
            borderRadius: 0,
            backgroundColor: isSearching ? theme.bg : "transparent",
            border: isSearching ? `1px solid ${theme.border}` : `1px solid transparent`,
            transition: "background-color 0.15s ease, border-color 0.15s ease",
          }}
        >
          <Search size={12} color={theme.textMuted} style={{ flexShrink: 0 }} />
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isSearching) setIsSearching(true);
            }}
            onFocus={() => {
              setIsSearching(true);
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
        {/* File count */}
        <div
          style={{
            fontSize: 10,
            color: theme.textMuted,
            paddingTop: 3,
            paddingLeft: 2,
            letterSpacing: "0.2px",
          }}
        >
          {flatList.length} item{flatList.length !== 1 ? "s" : ""}
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && !tree && (
        <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: i % 3 === 0 ? 0 : 16 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 0,
                  backgroundColor: theme.bgActive,
                  animation: "skeleton-pulse 1.2s ease-in-out infinite",
                  animationDelay: `${i * 0.08}s`,
                }}
              />
              <div
                style={{
                  height: 12,
                  borderRadius: 0,
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
        <div style={{ padding: "8px 12px", color: "#ff6b6b", fontSize: 11, wordBreak: "break-all" }}>
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
