use serde::Serialize;
use std::path::Path;
use std::process::Command;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileNode>>,
}

#[tauri::command]
pub fn get_cwd() -> Result<String, String> {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .or_else(|_| {
            std::env::current_dir()
                .map(|p| p.to_string_lossy().to_string())
                .map_err(|e| e.to_string())
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_home_dir() -> Result<String, String> {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn open_file(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn read_directory(path: String, depth: Option<usize>) -> Result<FileNode, String> {
    let root = Path::new(&path);
    if !root.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    if !root.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    let max_depth = depth.unwrap_or(2);
    build_tree(root, 0, max_depth)
}

fn build_tree(path: &Path, current_depth: usize, max_depth: usize) -> Result<FileNode, String> {
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

            // Skip hidden files/dirs (starting with .) and node_modules, target
            if entry_name.starts_with('.') || entry_name == "node_modules" || entry_name == "target" {
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
