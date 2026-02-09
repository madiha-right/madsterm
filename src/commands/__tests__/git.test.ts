import { beforeEach, describe, expect, it } from "vitest";
import { mockInvoke } from "../../test/setup";
import { fetchGitBranch, fetchGitDiff, fetchGitStatus } from "../git";

describe("git commands", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("should call invoke with git_branch and cwd", async () => {
    mockInvoke.mockResolvedValue("main");
    const result = await fetchGitBranch("/home/project");
    expect(mockInvoke).toHaveBeenCalledWith("git_branch", {
      cwd: "/home/project",
    });
    expect(result).toBe("main");
  });

  it("should call invoke with git_status and cwd", async () => {
    const mockChanges = [
      {
        path: "file.ts",
        status: "modified",
        additions: 1,
        deletions: 0,
        is_staged: false,
      },
    ];
    mockInvoke.mockResolvedValue(mockChanges);
    const result = await fetchGitStatus("/home/project");
    expect(mockInvoke).toHaveBeenCalledWith("git_status", {
      cwd: "/home/project",
    });
    expect(result).toEqual(mockChanges);
  });

  it("should call invoke with git_diff and filePath null when no filePath", async () => {
    mockInvoke.mockResolvedValue([]);
    await fetchGitDiff("/home/project");
    expect(mockInvoke).toHaveBeenCalledWith("git_diff", {
      cwd: "/home/project",
      filePath: null,
    });
  });

  it("should call invoke with git_diff and filePath when provided", async () => {
    mockInvoke.mockResolvedValue([]);
    await fetchGitDiff("/home/project", "file.txt");
    expect(mockInvoke).toHaveBeenCalledWith("git_diff", {
      cwd: "/home/project",
      filePath: "file.txt",
    });
  });
});
