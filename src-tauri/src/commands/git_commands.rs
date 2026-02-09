use crate::error::AppError;
use git2::{DiffDelta, DiffOptions, Repository, StatusOptions};
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
pub fn git_branch(cwd: String) -> Result<String, AppError> {
    let repo = Repository::discover(&cwd)?;
    let head = repo.head()?;
    if head.is_branch() {
        Ok(head.shorthand().unwrap_or("HEAD").to_string())
    } else {
        // Detached HEAD - show short hash
        let oid = head
            .target()
            .ok_or_else(|| AppError::Git("No HEAD target".to_string()))?;
        let short = &oid.to_string()[..7];
        Ok(format!("({})", short))
    }
}

#[tauri::command]
pub fn git_status(cwd: String) -> Result<Vec<FileChange>, AppError> {
    let repo = Repository::discover(&cwd)?;
    let mut opts = StatusOptions::new();
    opts.include_untracked(true).recurse_untracked_dirs(true);

    let statuses = repo.statuses(Some(&mut opts))?;

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
            let status = map_status_string(
                st.is_index_new(),
                st.is_index_deleted(),
                st.is_index_renamed(),
            );
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
            let status = map_status_string(st.is_wt_new(), st.is_wt_deleted(), st.is_wt_renamed());
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

fn get_delta_path(delta: &DiffDelta) -> String {
    delta
        .new_file()
        .path()
        .or_else(|| delta.old_file().path())
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default()
}

fn map_status_string(is_new: bool, is_deleted: bool, is_renamed: bool) -> &'static str {
    if is_new {
        "added"
    } else if is_deleted {
        "deleted"
    } else if is_renamed {
        "renamed"
    } else {
        "modified"
    }
}

fn collect_file_stats(diff: &git2::Diff) -> Vec<(String, usize, usize)> {
    let mut results = Vec::new();
    for delta_idx in 0..diff.deltas().len() {
        let delta = diff.get_delta(delta_idx).unwrap();
        let path = get_delta_path(&delta);

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
pub fn git_diff(cwd: String, file_path: Option<String>) -> Result<Vec<FileDiff>, AppError> {
    let repo = Repository::discover(&cwd)?;
    let mut diff_opts = DiffOptions::new();
    diff_opts.context_lines(3);

    if let Some(ref fp) = file_path {
        diff_opts.pathspec(fp);
    }

    let mut all_diffs: Vec<FileDiff> = Vec::new();

    // Unstaged changes: index vs workdir
    let diff_unstaged = repo.diff_index_to_workdir(None, Some(&mut diff_opts))?;

    collect_diffs(&diff_unstaged, &mut all_diffs)?;

    // Staged changes: HEAD tree vs index
    let head = repo.head().ok().and_then(|h| h.peel_to_tree().ok());
    let mut staged_opts = DiffOptions::new();
    staged_opts.context_lines(3);
    if let Some(ref fp) = file_path {
        staged_opts.pathspec(fp);
    }

    let diff_staged = repo.diff_tree_to_index(head.as_ref(), None, Some(&mut staged_opts))?;

    collect_diffs(&diff_staged, &mut all_diffs)?;

    Ok(all_diffs)
}

fn collect_diffs(diff: &git2::Diff, out: &mut Vec<FileDiff>) -> Result<(), AppError> {
    for delta_idx in 0..diff.deltas().len() {
        let delta = diff.get_delta(delta_idx).unwrap();
        let path = get_delta_path(&delta);

        let is_binary = delta.new_file().is_binary() || delta.old_file().is_binary();

        let mut hunks: Vec<DiffHunk> = Vec::new();

        if !is_binary {
            let patch = git2::Patch::from_diff(diff, delta_idx)?;
            if let Some(patch) = patch {
                for hunk_idx in 0..patch.num_hunks() {
                    let (hunk, _) = patch.hunk(hunk_idx)?;
                    let header = String::from_utf8_lossy(hunk.header()).to_string();
                    let mut lines = Vec::new();

                    let num_lines = patch.num_lines_in_hunk(hunk_idx)?;
                    for line_idx in 0..num_lines {
                        let line = patch.line_in_hunk(hunk_idx, line_idx)?;
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn setup_git_repo() -> (TempDir, Repository) {
        let dir = TempDir::new().unwrap();
        let repo = Repository::init(dir.path()).unwrap();

        // Configure user for commits
        let mut config = repo.config().unwrap();
        config.set_str("user.name", "Test User").unwrap();
        config.set_str("user.email", "test@example.com").unwrap();

        (dir, repo)
    }

    fn create_initial_commit(repo: &Repository) {
        let mut index = repo.index().unwrap();
        let tree_id = index.write_tree().unwrap();
        let tree = repo.find_tree(tree_id).unwrap();
        let sig = repo.signature().unwrap();
        repo.commit(Some("HEAD"), &sig, &sig, "Initial commit", &tree, &[])
            .unwrap();
    }

    // ---- map_status_string tests ----

    #[test]
    fn test_map_status_new() {
        assert_eq!(map_status_string(true, false, false), "added");
    }

    #[test]
    fn test_map_status_deleted() {
        assert_eq!(map_status_string(false, true, false), "deleted");
    }

    #[test]
    fn test_map_status_renamed() {
        assert_eq!(map_status_string(false, false, true), "renamed");
    }

    #[test]
    fn test_map_status_modified() {
        assert_eq!(map_status_string(false, false, false), "modified");
    }

    // ---- git_branch tests ----

    #[test]
    fn test_git_branch_on_main() {
        let (dir, repo) = setup_git_repo();
        create_initial_commit(&repo);

        let result = git_branch(dir.path().to_string_lossy().to_string()).unwrap();
        assert!(
            result == "main" || result == "master",
            "Expected 'main' or 'master', got '{}'",
            result
        );
    }

    #[test]
    fn test_git_branch_custom_branch() {
        let (dir, repo) = setup_git_repo();
        create_initial_commit(&repo);

        let head = repo.head().unwrap().peel_to_commit().unwrap();
        repo.branch("feature-test", &head, false).unwrap();
        repo.set_head("refs/heads/feature-test").unwrap();

        let result = git_branch(dir.path().to_string_lossy().to_string()).unwrap();
        assert_eq!(result, "feature-test");
    }

    #[test]
    fn test_git_branch_invalid_path() {
        let result = git_branch("/nonexistent/path/that/does/not/exist".to_string());
        assert!(result.is_err());
    }

    #[test]
    fn test_git_branch_detached_head() {
        let (dir, repo) = setup_git_repo();
        create_initial_commit(&repo);

        let head_commit = repo.head().unwrap().peel_to_commit().unwrap();
        repo.set_head_detached(head_commit.id()).unwrap();

        let result = git_branch(dir.path().to_string_lossy().to_string()).unwrap();
        assert!(
            result.starts_with('('),
            "Expected detached HEAD format starting with '(', got '{}'",
            result
        );
    }

    // ---- git_status tests ----

    #[test]
    fn test_git_status_clean_repo() {
        let (dir, repo) = setup_git_repo();
        create_initial_commit(&repo);

        let result = git_status(dir.path().to_string_lossy().to_string()).unwrap();
        assert!(result.is_empty(), "Expected empty status for clean repo");
    }

    #[test]
    fn test_git_status_untracked_file() {
        let (dir, repo) = setup_git_repo();
        create_initial_commit(&repo);

        fs::write(dir.path().join("newfile.txt"), "hello").unwrap();

        let result = git_status(dir.path().to_string_lossy().to_string()).unwrap();
        assert!(!result.is_empty(), "Expected at least one status entry");

        let entry = result.iter().find(|c| c.path == "newfile.txt").unwrap();
        assert_eq!(entry.status, "added");
        assert!(!entry.is_staged);
    }

    #[test]
    fn test_git_status_staged_file() {
        let (dir, repo) = setup_git_repo();
        create_initial_commit(&repo);

        fs::write(dir.path().join("staged.txt"), "content").unwrap();

        let mut index = repo.index().unwrap();
        index.add_path(std::path::Path::new("staged.txt")).unwrap();
        index.write().unwrap();

        let result = git_status(dir.path().to_string_lossy().to_string()).unwrap();
        let entry = result
            .iter()
            .find(|c| c.path == "staged.txt" && c.is_staged)
            .unwrap();
        assert_eq!(entry.status, "added");
        assert!(entry.is_staged);
    }

    #[test]
    fn test_git_status_modified_file() {
        let (dir, repo) = setup_git_repo();

        // Create and commit a file
        fs::write(dir.path().join("modify.txt"), "original").unwrap();
        let mut index = repo.index().unwrap();
        index.add_path(std::path::Path::new("modify.txt")).unwrap();
        index.write().unwrap();
        let tree_id = index.write_tree().unwrap();
        let tree = repo.find_tree(tree_id).unwrap();
        let sig = repo.signature().unwrap();
        repo.commit(Some("HEAD"), &sig, &sig, "Add file", &tree, &[])
            .unwrap();

        // Modify the file
        fs::write(dir.path().join("modify.txt"), "changed").unwrap();

        let result = git_status(dir.path().to_string_lossy().to_string()).unwrap();
        let entry = result.iter().find(|c| c.path == "modify.txt").unwrap();
        assert_eq!(entry.status, "modified");
        assert!(!entry.is_staged);
    }

    #[test]
    fn test_git_status_deleted_file() {
        let (dir, repo) = setup_git_repo();

        // Create and commit a file
        fs::write(dir.path().join("delete.txt"), "will be deleted").unwrap();
        let mut index = repo.index().unwrap();
        index.add_path(std::path::Path::new("delete.txt")).unwrap();
        index.write().unwrap();
        let tree_id = index.write_tree().unwrap();
        let tree = repo.find_tree(tree_id).unwrap();
        let sig = repo.signature().unwrap();
        repo.commit(Some("HEAD"), &sig, &sig, "Add file", &tree, &[])
            .unwrap();

        // Delete the file
        fs::remove_file(dir.path().join("delete.txt")).unwrap();

        let result = git_status(dir.path().to_string_lossy().to_string()).unwrap();
        let entry = result.iter().find(|c| c.path == "delete.txt").unwrap();
        assert_eq!(entry.status, "deleted");
        assert!(!entry.is_staged);
    }

    #[test]
    fn test_git_status_invalid_path() {
        let result = git_status("/nonexistent/path/that/does/not/exist".to_string());
        assert!(result.is_err());
    }

    // ---- git_diff tests ----

    #[test]
    fn test_git_diff_no_changes() {
        let (dir, repo) = setup_git_repo();
        create_initial_commit(&repo);

        let result = git_diff(dir.path().to_string_lossy().to_string(), None).unwrap();
        assert!(result.is_empty(), "Expected no diffs for clean repo");
    }

    #[test]
    fn test_git_diff_unstaged_modification() {
        let (dir, repo) = setup_git_repo();

        // Create and commit a file
        fs::write(dir.path().join("diff.txt"), "line1\nline2\nline3\n").unwrap();
        let mut index = repo.index().unwrap();
        index.add_path(std::path::Path::new("diff.txt")).unwrap();
        index.write().unwrap();
        let tree_id = index.write_tree().unwrap();
        let tree = repo.find_tree(tree_id).unwrap();
        let sig = repo.signature().unwrap();
        repo.commit(Some("HEAD"), &sig, &sig, "Add file", &tree, &[])
            .unwrap();

        // Modify the file
        fs::write(dir.path().join("diff.txt"), "line1\nmodified\nline3\n").unwrap();

        let result = git_diff(dir.path().to_string_lossy().to_string(), None).unwrap();
        assert!(!result.is_empty(), "Expected at least one diff");

        let file_diff = result.iter().find(|d| d.path == "diff.txt").unwrap();
        assert!(!file_diff.is_binary);
        assert!(!file_diff.hunks.is_empty(), "Expected at least one hunk");

        // Check that there are + and - lines
        let hunk = &file_diff.hunks[0];
        let has_addition = hunk.lines.iter().any(|l| l.origin == "+");
        let has_deletion = hunk.lines.iter().any(|l| l.origin == "-");
        assert!(has_addition, "Expected addition lines in diff");
        assert!(has_deletion, "Expected deletion lines in diff");
    }

    #[test]
    fn test_git_diff_with_file_path_filter() {
        let (dir, repo) = setup_git_repo();

        // Create and commit two files
        fs::write(dir.path().join("file_a.txt"), "aaa\n").unwrap();
        fs::write(dir.path().join("file_b.txt"), "bbb\n").unwrap();
        let mut index = repo.index().unwrap();
        index.add_path(std::path::Path::new("file_a.txt")).unwrap();
        index.add_path(std::path::Path::new("file_b.txt")).unwrap();
        index.write().unwrap();
        let tree_id = index.write_tree().unwrap();
        let tree = repo.find_tree(tree_id).unwrap();
        let sig = repo.signature().unwrap();
        repo.commit(Some("HEAD"), &sig, &sig, "Add files", &tree, &[])
            .unwrap();

        // Modify both files
        fs::write(dir.path().join("file_a.txt"), "aaa modified\n").unwrap();
        fs::write(dir.path().join("file_b.txt"), "bbb modified\n").unwrap();

        let result = git_diff(
            dir.path().to_string_lossy().to_string(),
            Some("file_a.txt".to_string()),
        )
        .unwrap();

        // Should only contain file_a.txt
        assert_eq!(result.len(), 1, "Expected exactly one diff entry");
        assert_eq!(result[0].path, "file_a.txt");
    }

    #[test]
    fn test_git_diff_staged_changes() {
        let (dir, repo) = setup_git_repo();

        // Create and commit a file
        fs::write(dir.path().join("staged_diff.txt"), "original\n").unwrap();
        let mut index = repo.index().unwrap();
        index
            .add_path(std::path::Path::new("staged_diff.txt"))
            .unwrap();
        index.write().unwrap();
        let tree_id = index.write_tree().unwrap();
        let tree = repo.find_tree(tree_id).unwrap();
        let sig = repo.signature().unwrap();
        repo.commit(Some("HEAD"), &sig, &sig, "Add file", &tree, &[])
            .unwrap();

        // Modify and stage the file
        fs::write(dir.path().join("staged_diff.txt"), "staged change\n").unwrap();
        let mut index = repo.index().unwrap();
        index
            .add_path(std::path::Path::new("staged_diff.txt"))
            .unwrap();
        index.write().unwrap();

        let result = git_diff(dir.path().to_string_lossy().to_string(), None).unwrap();
        assert!(!result.is_empty(), "Expected diff for staged modification");

        let file_diff = result.iter().find(|d| d.path == "staged_diff.txt").unwrap();
        assert!(
            !file_diff.hunks.is_empty(),
            "Expected hunks for staged change"
        );
    }
}
