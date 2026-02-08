use git2::{DiffOptions, Repository, StatusOptions};
use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct FileChange {
    pub path: String,
    pub status: String,
    pub additions: usize,
    pub deletions: usize,
    pub is_staged: bool,
}

#[derive(Serialize, Clone)]
pub struct DiffHunk {
    pub header: String,
    pub old_start: u32,
    pub new_start: u32,
    pub old_lines: u32,
    pub new_lines: u32,
    pub lines: Vec<DiffLineInfo>,
}

#[derive(Serialize, Clone)]
pub struct DiffLineInfo {
    pub content: String,
    pub origin: String,
    pub old_lineno: Option<u32>,
    pub new_lineno: Option<u32>,
}

#[derive(Serialize, Clone)]
pub struct FileDiff {
    pub path: String,
    pub hunks: Vec<DiffHunk>,
    pub is_binary: bool,
}

#[tauri::command]
pub fn git_branch(cwd: String) -> Result<String, String> {
    let repo = Repository::discover(&cwd).map_err(|e| e.to_string())?;
    let head = repo.head().map_err(|e| e.to_string())?;
    if head.is_branch() {
        Ok(head.shorthand().unwrap_or("HEAD").to_string())
    } else {
        // Detached HEAD - show short hash
        let oid = head.target().ok_or("No HEAD target")?;
        let short = &oid.to_string()[..7];
        Ok(format!("({})", short))
    }
}

#[tauri::command]
pub fn git_status(cwd: String) -> Result<Vec<FileChange>, String> {
    let repo = Repository::discover(&cwd).map_err(|e| e.to_string())?;
    let mut opts = StatusOptions::new();
    opts.include_untracked(true).recurse_untracked_dirs(true);

    let statuses = repo.statuses(Some(&mut opts)).map_err(|e| e.to_string())?;

    // Compute per-file addition/deletion stats from diffs
    let mut staged_stats: std::collections::HashMap<String, (usize, usize)> =
        std::collections::HashMap::new();
    let mut unstaged_stats: std::collections::HashMap<String, (usize, usize)> =
        std::collections::HashMap::new();

    // Staged diff stats
    let head = repo.head().ok().and_then(|h| h.peel_to_tree().ok());
    if let Ok(diff) = repo.diff_tree_to_index(head.as_ref(), None, None) {
        let stats_result = collect_file_stats(&diff);
        for (path, adds, dels) in stats_result {
            staged_stats.insert(path, (adds, dels));
        }
    }

    // Unstaged diff stats
    if let Ok(diff) = repo.diff_index_to_workdir(None, None) {
        let stats_result = collect_file_stats(&diff);
        for (path, adds, dels) in stats_result {
            unstaged_stats.insert(path, (adds, dels));
        }
    }

    let mut changes = Vec::new();

    for entry in statuses.iter() {
        let path = entry.path().unwrap_or("").to_string();
        let st = entry.status();

        if st.is_index_new()
            || st.is_index_modified()
            || st.is_index_deleted()
            || st.is_index_renamed()
        {
            let status = if st.is_index_new() {
                "added"
            } else if st.is_index_deleted() {
                "deleted"
            } else if st.is_index_renamed() {
                "renamed"
            } else {
                "modified"
            };
            let (additions, deletions) = staged_stats.get(&path).copied().unwrap_or((0, 0));
            changes.push(FileChange {
                path: path.clone(),
                status: status.to_string(),
                additions,
                deletions,
                is_staged: true,
            });
        }

        if st.is_wt_new() || st.is_wt_modified() || st.is_wt_deleted() || st.is_wt_renamed() {
            let status = if st.is_wt_new() {
                "added"
            } else if st.is_wt_deleted() {
                "deleted"
            } else if st.is_wt_renamed() {
                "renamed"
            } else {
                "modified"
            };
            let (additions, deletions) = unstaged_stats.get(&path).copied().unwrap_or((0, 0));
            changes.push(FileChange {
                path: path.clone(),
                status: status.to_string(),
                additions,
                deletions,
                is_staged: false,
            });
        }
    }

    Ok(changes)
}

fn collect_file_stats(diff: &git2::Diff) -> Vec<(String, usize, usize)> {
    let mut results = Vec::new();
    for delta_idx in 0..diff.deltas().len() {
        let delta = diff.get_delta(delta_idx).unwrap();
        let path = delta
            .new_file()
            .path()
            .or_else(|| delta.old_file().path())
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();

        let mut adds = 0usize;
        let mut dels = 0usize;

        if let Ok(Some(patch)) = git2::Patch::from_diff(diff, delta_idx) {
            for hunk_idx in 0..patch.num_hunks() {
                if let Ok(num_lines) = patch.num_lines_in_hunk(hunk_idx) {
                    for line_idx in 0..num_lines {
                        if let Ok(line) = patch.line_in_hunk(hunk_idx, line_idx) {
                            match line.origin() {
                                '+' => adds += 1,
                                '-' => dels += 1,
                                _ => {}
                            }
                        }
                    }
                }
            }
        }

        results.push((path, adds, dels));
    }
    results
}

#[tauri::command]
pub fn git_diff(cwd: String, file_path: Option<String>) -> Result<Vec<FileDiff>, String> {
    let repo = Repository::discover(&cwd).map_err(|e| e.to_string())?;
    let mut diff_opts = DiffOptions::new();
    diff_opts.context_lines(3);

    if let Some(ref fp) = file_path {
        diff_opts.pathspec(fp);
    }

    let mut all_diffs: Vec<FileDiff> = Vec::new();

    // Unstaged changes: index vs workdir
    let diff_unstaged = repo
        .diff_index_to_workdir(None, Some(&mut diff_opts))
        .map_err(|e| e.to_string())?;

    collect_diffs(&diff_unstaged, &mut all_diffs)?;

    // Staged changes: HEAD tree vs index
    let head = repo.head().ok().and_then(|h| h.peel_to_tree().ok());
    let mut staged_opts = DiffOptions::new();
    staged_opts.context_lines(3);
    if let Some(ref fp) = file_path {
        staged_opts.pathspec(fp);
    }

    let diff_staged = repo
        .diff_tree_to_index(head.as_ref(), None, Some(&mut staged_opts))
        .map_err(|e| e.to_string())?;

    collect_diffs(&diff_staged, &mut all_diffs)?;

    Ok(all_diffs)
}

fn collect_diffs(diff: &git2::Diff, out: &mut Vec<FileDiff>) -> Result<(), String> {
    for delta_idx in 0..diff.deltas().len() {
        let delta = diff.get_delta(delta_idx).unwrap();
        let path = delta
            .new_file()
            .path()
            .or_else(|| delta.old_file().path())
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();

        let is_binary = delta.new_file().is_binary() || delta.old_file().is_binary();

        let mut hunks: Vec<DiffHunk> = Vec::new();

        if !is_binary {
            let patch = git2::Patch::from_diff(diff, delta_idx).map_err(|e| e.to_string())?;
            if let Some(patch) = patch {
                for hunk_idx in 0..patch.num_hunks() {
                    let (hunk, _) = patch.hunk(hunk_idx).map_err(|e| e.to_string())?;
                    let header = String::from_utf8_lossy(hunk.header()).to_string();
                    let mut lines = Vec::new();

                    let num_lines = patch
                        .num_lines_in_hunk(hunk_idx)
                        .map_err(|e| e.to_string())?;
                    for line_idx in 0..num_lines {
                        let line = patch
                            .line_in_hunk(hunk_idx, line_idx)
                            .map_err(|e| e.to_string())?;
                        let content = String::from_utf8_lossy(line.content()).to_string();
                        let origin = match line.origin() {
                            '+' => "+".to_string(),
                            '-' => "-".to_string(),
                            _ => " ".to_string(),
                        };
                        lines.push(DiffLineInfo {
                            content,
                            origin,
                            old_lineno: line.old_lineno(),
                            new_lineno: line.new_lineno(),
                        });
                    }

                    hunks.push(DiffHunk {
                        header,
                        old_start: hunk.old_start(),
                        new_start: hunk.new_start(),
                        old_lines: hunk.old_lines(),
                        new_lines: hunk.new_lines(),
                        lines,
                    });
                }
            }
        }

        out.push(FileDiff {
            path,
            hunks,
            is_binary,
        });
    }
    Ok(())
}
