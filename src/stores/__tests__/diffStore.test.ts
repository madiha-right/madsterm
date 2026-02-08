import { beforeEach, describe, expect, it } from "vitest";
import { useDiffStore } from "../diffStore";

describe("diffStore", () => {
  beforeEach(() => {
    useDiffStore.setState({
      changes: [],
      selectedFilePath: null,
      selectedFileDiff: null,
      expandedFiles: new Set(),
      focusedIndex: 0,
      isLoading: false,
    });
  });

  it("should set changes", () => {
    const changes = [
      {
        path: "src/main.ts",
        status: "modified" as const,
        additions: 5,
        deletions: 2,
        is_staged: false,
      },
    ];
    useDiffStore.getState().setChanges(changes);
    expect(useDiffStore.getState().changes).toEqual(changes);
  });

  it("should select and deselect file", () => {
    useDiffStore.getState().setSelectedFile("src/main.ts");
    expect(useDiffStore.getState().selectedFilePath).toBe("src/main.ts");

    useDiffStore.getState().setSelectedFile(null);
    expect(useDiffStore.getState().selectedFilePath).toBeNull();
  });

  it("should toggle file expanded", () => {
    useDiffStore.getState().toggleFileExpanded("src/main.ts");
    expect(useDiffStore.getState().expandedFiles.has("src/main.ts")).toBe(true);

    useDiffStore.getState().toggleFileExpanded("src/main.ts");
    expect(useDiffStore.getState().expandedFiles.has("src/main.ts")).toBe(false);
  });

  it("should update focused index", () => {
    useDiffStore.getState().setFocusedIndex(3);
    expect(useDiffStore.getState().focusedIndex).toBe(3);
  });

  it("should track loading state", () => {
    useDiffStore.getState().setIsLoading(true);
    expect(useDiffStore.getState().isLoading).toBe(true);

    useDiffStore.getState().setIsLoading(false);
    expect(useDiffStore.getState().isLoading).toBe(false);
  });
});
