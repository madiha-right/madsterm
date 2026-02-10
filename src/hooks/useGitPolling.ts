import { useCallback, useEffect, useRef, useState } from "react";
import { getHomeDir } from "../commands/fs";
import { fetchGitBranch, fetchGitDiff, fetchGitStatus } from "../commands/git";
import { useDiffStore } from "../stores/diffStore";
import { useTabStore } from "../stores/tabStore";

const IGNORED_FILES = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "Cargo.lock"];

export function useGitPolling() {
  const { setChanges, toggleFileExpanded, setFileDiff, setIsLoading } = useDiffStore();
  const activeTab = useTabStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const [homeDir, setHomeDir] = useState<string | null>(null);
  const isGitRepoRef = useRef(true);
  const [branchName, setBranchName] = useState<string>("main");

  useEffect(() => {
    getHomeDir()
      .then(setHomeDir)
      .catch(() => {});
  }, []);

  const getEffectiveCwd = useCallback(() => {
    return activeTab?.cwd || homeDir || null;
  }, [activeTab?.cwd, homeDir]);

  const loadFileDiff = useCallback(
    async (filePath: string) => {
      const cwd = getEffectiveCwd();
      if (!cwd) return;
      try {
        const diffs = await fetchGitDiff(cwd, filePath);
        if (diffs.length > 0) {
          setFileDiff(filePath, diffs[0]);
        } else {
          setFileDiff(filePath, {
            path: filePath,
            hunks: [],
            is_binary: false,
          });
        }
      } catch {
        setFileDiff(filePath, { path: filePath, hunks: [], is_binary: false });
      }
    },
    [getEffectiveCwd, setFileDiff],
  );

  const loadStatus = useCallback(async () => {
    const cwd = getEffectiveCwd();
    if (!cwd) {
      setChanges([]);
      return;
    }
    setIsLoading(true);
    try {
      const prevPaths = new Set(useDiffStore.getState().changes.map((c) => c.path));
      const result = (await fetchGitStatus(cwd)).filter(
        (c) => !IGNORED_FILES.some((f) => c.path.endsWith(f)),
      );
      setChanges(result);
      isGitRepoRef.current = true;

      // Load diffs for newly auto-expanded files
      const { fileDiffs, expandedFiles } = useDiffStore.getState();
      for (const c of result) {
        if (!prevPaths.has(c.path) && expandedFiles.has(c.path) && !fileDiffs.has(c.path)) {
          loadFileDiff(c.path);
        }
      }

      try {
        const branch = await fetchGitBranch(cwd);
        setBranchName(branch);
      } catch {
        // Branch name unavailable, keep default
      }
    } catch {
      setChanges([]);
      isGitRepoRef.current = false;
    }
    setIsLoading(false);
  }, [getEffectiveCwd, setChanges, setIsLoading, loadFileDiff]);

  // Load on mount and poll every 5s
  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  // Immediate refresh on tab switch
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleToggleFile = useCallback(
    (path: string) => {
      const state = useDiffStore.getState();
      const isExpanding = !state.expandedFiles.has(path);
      toggleFileExpanded(path);
      if (isExpanding && !state.fileDiffs.has(path)) {
        loadFileDiff(path);
      }
    },
    [toggleFileExpanded, loadFileDiff],
  );

  return { branchName, loadStatus, handleToggleFile };
}
