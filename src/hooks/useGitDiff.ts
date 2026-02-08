import { invoke } from "@tauri-apps/api/core";
import { FileChange, FileDiff } from "../types";

export async function fetchGitBranch(cwd: string): Promise<string> {
  return invoke<string>("git_branch", { cwd });
}

export async function fetchGitStatus(cwd: string): Promise<FileChange[]> {
  return invoke<FileChange[]>("git_status", { cwd });
}

export async function fetchGitDiff(cwd: string, filePath?: string): Promise<FileDiff[]> {
  return invoke<FileDiff[]>("git_diff", { cwd, filePath: filePath ?? null });
}
