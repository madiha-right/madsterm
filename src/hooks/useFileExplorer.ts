import { invoke } from "@tauri-apps/api/core";
import { FileNode } from "../types";

export async function readDirectory(path: string, depth?: number): Promise<FileNode> {
  return invoke<FileNode>("read_directory", { path, depth: depth ?? null });
}

export async function getHomeDir(): Promise<string> {
  return invoke<string>("get_home_dir");
}

export async function getCwd(): Promise<string> {
  return invoke<string>("get_cwd");
}

export async function openFile(path: string): Promise<void> {
  return invoke("open_file", { path });
}

export async function getShellName(): Promise<string> {
  return invoke<string>("get_shell_name");
}
