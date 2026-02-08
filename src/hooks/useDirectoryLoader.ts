import { useCallback, useEffect, useState } from "react";
import { getHomeDir, openFile, readDirectory } from "../commands/fs";
import { useFileExplorerStore } from "../stores/fileExplorerStore";
import { useTabStore } from "../stores/tabStore";
import type { FileNode } from "../types";

export function useDirectoryLoader() {
  const {
    rootPath,
    tree,
    expandedPaths,
    searchQuery,
    refreshFlag,
    setRootPath,
    setTree,
    setExpanded,
    setFocusedIndex,
  } = useFileExplorerStore();
  const activeTabId = useTabStore((s) => s.activeTabId);
  const activeTab = useTabStore((s) => s.tabs.find((t) => t.id === s.activeTabId));

  const [flatList, setFlatList] = useState<{ node: FileNode; depth: number }[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
  }, [rootPath, setExpanded, setRootPath, setTree, tree]);

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
  }, [activeTabId, activeTab?.cwd, rootPath, setExpanded, setTree]);

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
  }, [activeTab?.cwd, rootPath, setExpanded, setFocusedIndex, setRootPath, setTree]);

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
  }, [refreshFlag, rootPath, setExpanded, setTree]);

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
      const shouldRecurse = searchQuery
        ? node.isDir && node.children
        : node.isDir && expandedPaths.has(node.path) && node.children;
      if (shouldRecurse) {
        for (const child of node.children!) {
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

  return { flatList, isLoading, loadError, handleFileOpen, handleExpand };
}
