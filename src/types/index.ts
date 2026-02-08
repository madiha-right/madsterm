export interface Tab {
  id: string;
  title: string;
  sessionId: string;
  cwd: string;
  isActive: boolean;
}

export interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileNode[];
  isExpanded?: boolean;
  isLoaded?: boolean;
}

export interface FileChange {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed" | "copied";
  additions: number;
  deletions: number;
  is_staged: boolean;
}

export interface DiffHunk {
  header: string;
  old_start: number;
  new_start: number;
  old_lines: number;
  new_lines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  content: string;
  origin: "+" | "-" | " ";
  old_lineno: number | null;
  new_lineno: number | null;
}

export interface FileDiff {
  path: string;
  hunks: DiffHunk[];
  is_binary: boolean;
}
