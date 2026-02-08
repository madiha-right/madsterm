import { useCallback, useEffect, useMemo, useRef } from "react";
import { searchInFiles } from "../commands/fs";
import { useContentSearchStore } from "../stores/contentSearchStore";
import { useFileExplorerStore } from "../stores/fileExplorerStore";
import type { FileSearchResult, SearchMatch } from "../types";

export type FlatItem =
  | { type: "file"; file: FileSearchResult; fileIndex: number }
  | {
      type: "match";
      match: SearchMatch;
      file: FileSearchResult;
      matchIndex: number;
    };

export function useContentSearch() {
  const rootPath = useFileExplorerStore((s) => s.rootPath);
  const {
    contentSearchQuery,
    contentSearchResults,
    contentSearchLoading,
    caseSensitive,
    wholeWord,
    useRegex,
    expandedResultFiles,
    searchFocusedIndex,
    setContentSearchQuery,
    setContentSearchResults,
    setContentSearchLoading,
    toggleCaseSensitive,
    toggleWholeWord,
    toggleUseRegex,
    toggleResultFileExpanded,
    setSearchFocusedIndex,
  } = useContentSearchStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(
    (query: string) => {
      if (!rootPath || !query.trim()) {
        setContentSearchResults(null);
        setContentSearchLoading(false);
        return;
      }

      setContentSearchLoading(true);
      searchInFiles(rootPath, query, caseSensitive, wholeWord, useRegex)
        .then((results) => {
          setContentSearchResults(results);
        })
        .catch((err) => {
          console.error("Search failed:", err);
          setContentSearchResults(null);
        })
        .finally(() => {
          setContentSearchLoading(false);
        });
    },
    [
      rootPath,
      caseSensitive,
      wholeWord,
      useRegex,
      setContentSearchResults,
      setContentSearchLoading,
    ],
  );

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!contentSearchQuery.trim()) {
      setContentSearchResults(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      performSearch(contentSearchQuery);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [contentSearchQuery, performSearch, setContentSearchResults]);

  // Re-search when toggles change (if there's a query)
  useEffect(() => {
    if (contentSearchQuery.trim()) {
      performSearch(contentSearchQuery);
    }
  }, [contentSearchQuery, performSearch]);

  // Build flat list for navigation
  const flatList = useMemo<FlatItem[]>(() => {
    if (!contentSearchResults) return [];
    const items: FlatItem[] = [];
    contentSearchResults.files.forEach((file, fileIndex) => {
      items.push({ type: "file", file, fileIndex });
      if (expandedResultFiles.has(file.path)) {
        file.matches.forEach((match, matchIndex) => {
          items.push({ type: "match", match, file, matchIndex });
        });
      }
    });
    return items;
  }, [contentSearchResults, expandedResultFiles]);

  return {
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
    performSearch,
  };
}
