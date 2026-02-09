import { beforeEach, describe, expect, it } from "vitest";
import { mockInvoke } from "../../test/setup";
import { getCwd, getHomeDir, getShellName, openFile, readDirectory, searchInFiles } from "../fs";

describe("fs commands", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("should call invoke with read_directory and depth null when no depth", async () => {
    mockInvoke.mockResolvedValue({ name: "root", path: "/root", isDir: true });
    await readDirectory("/root");
    expect(mockInvoke).toHaveBeenCalledWith("read_directory", {
      path: "/root",
      depth: null,
    });
  });

  it("should call invoke with read_directory and depth 2 when depth provided", async () => {
    mockInvoke.mockResolvedValue({ name: "root", path: "/root", isDir: true });
    await readDirectory("/root", 2);
    expect(mockInvoke).toHaveBeenCalledWith("read_directory", {
      path: "/root",
      depth: 2,
    });
  });

  it("should call invoke with get_home_dir", async () => {
    mockInvoke.mockResolvedValue("/home/user");
    const result = await getHomeDir();
    expect(mockInvoke).toHaveBeenCalledWith("get_home_dir");
    expect(result).toBe("/home/user");
  });

  it("should call invoke with get_cwd", async () => {
    mockInvoke.mockResolvedValue("/current/dir");
    const result = await getCwd();
    expect(mockInvoke).toHaveBeenCalledWith("get_cwd");
    expect(result).toBe("/current/dir");
  });

  it("should call invoke with open_file and path", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await openFile("/path/to/file.ts");
    expect(mockInvoke).toHaveBeenCalledWith("open_file", {
      path: "/path/to/file.ts",
    });
  });

  it("should call invoke with get_shell_name", async () => {
    mockInvoke.mockResolvedValue("zsh");
    const result = await getShellName();
    expect(mockInvoke).toHaveBeenCalledWith("get_shell_name");
    expect(result).toBe("zsh");
  });

  it("should call invoke with all parameters for searchInFiles", async () => {
    const mockResults = {
      files: [],
      totalMatches: 0,
      totalFiles: 0,
      truncated: false,
    };
    mockInvoke.mockResolvedValue(mockResults);
    await searchInFiles("/root", "query", true, false, true, 100);
    expect(mockInvoke).toHaveBeenCalledWith("search_in_files", {
      rootPath: "/root",
      query: "query",
      caseSensitive: true,
      wholeWord: false,
      useRegex: true,
      maxResults: 100,
    });
  });

  it("should pass null for maxResults when not provided in searchInFiles", async () => {
    const mockResults = {
      files: [],
      totalMatches: 0,
      totalFiles: 0,
      truncated: false,
    };
    mockInvoke.mockResolvedValue(mockResults);
    await searchInFiles("/root", "query", false, false, false);
    expect(mockInvoke).toHaveBeenCalledWith("search_in_files", {
      rootPath: "/root",
      query: "query",
      caseSensitive: false,
      wholeWord: false,
      useRegex: false,
      maxResults: null,
    });
  });
});
