use crate::error::AppError;
use serde::Serialize;
use std::path::Path;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileNode>>,
}

#[tauri::command]
pub fn read_directory(path: String, depth: Option<usize>) -> Result<FileNode, AppError> {
    let root = Path::new(&path);
    if !root.exists() {
        return Err(AppError::NotFound(format!("Path does not exist: {}", path)));
    }
    if !root.is_dir() {
        return Err(AppError::InvalidInput(format!(
            "Path is not a directory: {}",
            path
        )));
    }

    let max_depth = depth.unwrap_or(2);
    build_tree(root, 0, max_depth)
}

pub fn build_tree(path: &Path, current_depth: usize, max_depth: usize) -> Result<FileNode, AppError> {
    let name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string_lossy().to_string());

    let is_dir = path.is_dir();

    let children = if is_dir && current_depth < max_depth {
        let read = match std::fs::read_dir(path) {
            Ok(r) => r,
            Err(_) => {
                // Permission denied or other OS error - treat as empty dir
                return Ok(FileNode {
                    name,
                    path: path.to_string_lossy().to_string(),
                    is_dir,
                    children: Some(Vec::new()),
                });
            }
        };

        let mut dirs = Vec::new();
        let mut files = Vec::new();

        for entry in read {
            let entry = match entry {
                Ok(e) => e,
                Err(_) => continue, // Skip unreadable entries
            };
            let entry_path = entry.path();
            let entry_name = entry.file_name().to_string_lossy().to_string();

            // Skip Rust build output
            if entry_name == "target" {
                continue;
            }

            match build_tree(&entry_path, current_depth + 1, max_depth) {
                Ok(node) => {
                    if node.is_dir {
                        dirs.push(node);
                    } else {
                        files.push(node);
                    }
                }
                Err(_) => continue, // Skip dirs/files we can't read
            }
        }

        // Sort: directories first (alphabetical), then files (alphabetical)
        dirs.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
        files.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

        dirs.append(&mut files);
        Some(dirs)
    } else if is_dir {
        // Directory but beyond max depth - indicate it has children but don't load them
        Some(Vec::new())
    } else {
        None
    };

    Ok(FileNode {
        name,
        path: path.to_string_lossy().to_string(),
        is_dir,
        children,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_read_directory_nonexistent() {
        let result = read_directory("/nonexistent/path".to_string(), None);
        assert!(result.is_err());
    }

    #[test]
    fn test_read_directory_exists() {
        let tmp = std::env::temp_dir();
        let result = read_directory(tmp.to_string_lossy().to_string(), Some(1));
        assert!(result.is_ok());
        let node = result.unwrap();
        assert!(node.is_dir);
    }

    #[test]
    fn test_build_tree_includes_hidden_files() {
        let tmp = std::env::temp_dir().join("madsterm_test_hidden");
        let _ = fs::create_dir_all(&tmp);
        let _ = fs::write(tmp.join(".hidden"), "hidden");
        let _ = fs::write(tmp.join("visible.txt"), "visible");

        let result = build_tree(&tmp, 0, 1).unwrap();
        let children = result.children.unwrap();
        assert!(children.iter().any(|c| c.name == ".hidden"));
        assert!(children.iter().any(|c| c.name == "visible.txt"));

        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn test_build_tree_sorts_dirs_before_files() {
        let tmp = std::env::temp_dir().join("madsterm_test_sort");
        let _ = fs::create_dir_all(tmp.join("zdir"));
        let _ = fs::create_dir_all(tmp.join("adir"));
        let _ = fs::write(tmp.join("bfile.txt"), "b");
        let _ = fs::write(tmp.join("afile.txt"), "a");

        let result = build_tree(&tmp, 0, 1).unwrap();
        let children = result.children.unwrap();

        // Dirs should come first, sorted alphabetically
        let names: Vec<&str> = children.iter().map(|c| c.name.as_str()).collect();
        assert_eq!(names, vec!["adir", "zdir", "afile.txt", "bfile.txt"]);

        let _ = fs::remove_dir_all(&tmp);
    }
}
