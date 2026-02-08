use regex::Regex;
use serde::Serialize;
use std::path::Path;
use std::process::Command;
use walkdir::WalkDir;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileNode>>,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SearchMatch {
    pub line_number: usize,
    pub line_content: String,
    pub match_start: usize,
    pub match_end: usize,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FileSearchResult {
    pub path: String,
    pub absolute_path: String,
    pub matches: Vec<SearchMatch>,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SearchResults {
    pub files: Vec<FileSearchResult>,
    pub total_matches: usize,
    pub total_files: usize,
    pub truncated: bool,
}

const BINARY_EXTENSIONS: &[&str] = &[
    "png", "jpg", "jpeg", "gif", "bmp", "ico", "svg", "webp", "mp3", "mp4", "wav", "ogg", "avi",
    "mov", "mkv", "zip", "tar", "gz", "bz2", "xz", "7z", "rar", "pdf", "doc", "docx", "xls",
    "xlsx", "ppt", "pptx", "exe", "dll", "so", "dylib", "o", "a", "bin", "dat", "db", "sqlite",
    "wasm", "ttf", "otf", "woff", "woff2", "eot", "class", "jar", "pyc", "pyo",
];

const SKIP_DIRS: &[&str] = &[".git", "target", "node_modules", ".next", "dist", "build", "__pycache__"];

fn build_search_pattern(
    query: &str,
    case_sensitive: bool,
    whole_word: bool,
    use_regex: bool,
) -> Result<Regex, String> {
    let pattern = if use_regex {
        query.to_string()
    } else {
        regex::escape(query)
    };

    let pattern = if whole_word {
        format!(r"\b{}\b", pattern)
    } else {
        pattern
    };

    let pattern = if case_sensitive {
        pattern
    } else {
        format!("(?i){}", pattern)
    };

    Regex::new(&pattern).map_err(|e| format!("Invalid regex: {}", e))
}

#[tauri::command]
pub fn search_in_files(
    root_path: String,
    query: String,
    case_sensitive: bool,
    whole_word: bool,
    use_regex: bool,
    max_results: Option<usize>,
) -> Result<SearchResults, String> {
    if query.is_empty() {
        return Ok(SearchResults {
            files: Vec::new(),
            total_matches: 0,
            total_files: 0,
            truncated: false,
        });
    }

    let max = max_results.unwrap_or(10_000);
    let re = build_search_pattern(&query, case_sensitive, whole_word, use_regex)?;
    let root = Path::new(&root_path);

    let mut files: Vec<FileSearchResult> = Vec::new();
    let mut total_matches: usize = 0;
    let mut truncated = false;

    for entry in WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            // Skip hidden dirs and known non-content dirs
            if e.file_type().is_dir() {
                return !SKIP_DIRS.contains(&name.as_ref());
            }
            true
        })
    {
        if truncated {
            break;
        }

        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };

        if !entry.file_type().is_file() {
            continue;
        }

        let path = entry.path();

        // Skip binary files by extension
        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            if BINARY_EXTENSIONS.contains(&ext.to_lowercase().as_str()) {
                continue;
            }
        }

        // Skip files > 1MB
        if let Ok(meta) = path.metadata() {
            if meta.len() > 1_048_576 {
                continue;
            }
        }

        // Read file content
        let content = match std::fs::read(path) {
            Ok(bytes) => {
                // Skip files with null bytes (likely binary)
                if bytes.contains(&0) {
                    continue;
                }
                match String::from_utf8(bytes) {
                    Ok(s) => s,
                    Err(_) => continue,
                }
            }
            Err(_) => continue,
        };

        let mut file_matches: Vec<SearchMatch> = Vec::new();

        for (line_idx, line) in content.lines().enumerate() {
            for mat in re.find_iter(line) {
                // Convert byte offsets to char offsets for JS compatibility
                let match_start = line[..mat.start()].chars().count();
                let match_end = match_start + line[mat.start()..mat.end()].chars().count();

                file_matches.push(SearchMatch {
                    line_number: line_idx + 1,
                    line_content: line.to_string(),
                    match_start,
                    match_end,
                });

                total_matches += 1;
                if total_matches >= max {
                    truncated = true;
                    break;
                }
            }
            if truncated {
                break;
            }
        }

        if !file_matches.is_empty() {
            let rel_path = path
                .strip_prefix(root)
                .unwrap_or(path)
                .to_string_lossy()
                .to_string();
            files.push(FileSearchResult {
                path: rel_path,
                absolute_path: path.to_string_lossy().to_string(),
                matches: file_matches,
            });
        }
    }

    let total_files = files.len();
    Ok(SearchResults {
        files,
        total_matches,
        total_files,
        truncated,
    })
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
pub fn get_shell_name() -> String {
    #[cfg(unix)]
    {
        if let Ok(shell) = std::env::var("SHELL") {
            return shell.rsplit('/').next().unwrap_or("sh").to_string();
        }
        "sh".to_string()
    }
    #[cfg(windows)]
    {
        if let Ok(comspec) = std::env::var("COMSPEC") {
            let name = comspec.rsplit('\\').next().unwrap_or("cmd.exe");
            return name.trim_end_matches(".exe").to_string();
        }
        "powershell".to_string()
    }
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

pub fn build_tree(path: &Path, current_depth: usize, max_depth: usize) -> Result<FileNode, String> {
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

    #[test]
    fn test_get_shell_name() {
        let name = get_shell_name();
        assert!(!name.is_empty());
    }

    #[test]
    fn test_get_home_dir() {
        let result = get_home_dir();
        assert!(result.is_ok());
    }

    #[test]
    fn test_search_basic() {
        let tmp = std::env::temp_dir().join("madsterm_test_search_basic");
        let _ = fs::remove_dir_all(&tmp);
        let _ = fs::create_dir_all(&tmp);
        let _ = fs::write(tmp.join("hello.txt"), "Hello world\nfoo bar\nHello again");

        let result = search_in_files(
            tmp.to_string_lossy().to_string(),
            "Hello".to_string(),
            true,
            false,
            false,
            None,
        )
        .unwrap();

        assert_eq!(result.total_files, 1);
        assert_eq!(result.total_matches, 2);
        assert_eq!(result.files[0].matches[0].line_number, 1);
        assert_eq!(result.files[0].matches[0].match_start, 0);
        assert_eq!(result.files[0].matches[0].match_end, 5);
        assert_eq!(result.files[0].matches[1].line_number, 3);
        assert!(!result.truncated);

        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn test_search_case_insensitive() {
        let tmp = std::env::temp_dir().join("madsterm_test_search_case");
        let _ = fs::remove_dir_all(&tmp);
        let _ = fs::create_dir_all(&tmp);
        let _ = fs::write(tmp.join("test.txt"), "Hello HELLO hello");

        // Case-sensitive: only "Hello"
        let result = search_in_files(
            tmp.to_string_lossy().to_string(),
            "Hello".to_string(),
            true,
            false,
            false,
            None,
        )
        .unwrap();
        assert_eq!(result.total_matches, 1);

        // Case-insensitive: all three
        let result = search_in_files(
            tmp.to_string_lossy().to_string(),
            "Hello".to_string(),
            false,
            false,
            false,
            None,
        )
        .unwrap();
        assert_eq!(result.total_matches, 3);

        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn test_search_whole_word() {
        let tmp = std::env::temp_dir().join("madsterm_test_search_word");
        let _ = fs::remove_dir_all(&tmp);
        let _ = fs::create_dir_all(&tmp);
        let _ = fs::write(tmp.join("test.txt"), "cat catalog scattered");

        // Without whole word
        let result = search_in_files(
            tmp.to_string_lossy().to_string(),
            "cat".to_string(),
            false,
            false,
            false,
            None,
        )
        .unwrap();
        assert_eq!(result.total_matches, 3);

        // With whole word
        let result = search_in_files(
            tmp.to_string_lossy().to_string(),
            "cat".to_string(),
            false,
            true,
            false,
            None,
        )
        .unwrap();
        assert_eq!(result.total_matches, 1);

        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn test_search_regex() {
        let tmp = std::env::temp_dir().join("madsterm_test_search_regex");
        let _ = fs::remove_dir_all(&tmp);
        let _ = fs::create_dir_all(&tmp);
        let _ = fs::write(tmp.join("test.txt"), "foo123 bar456 baz");

        let result = search_in_files(
            tmp.to_string_lossy().to_string(),
            r"\w+\d+".to_string(),
            true,
            false,
            true,
            None,
        )
        .unwrap();
        assert_eq!(result.total_matches, 2);

        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn test_search_empty_query() {
        let tmp = std::env::temp_dir().join("madsterm_test_search_empty");
        let _ = fs::remove_dir_all(&tmp);
        let _ = fs::create_dir_all(&tmp);
        let _ = fs::write(tmp.join("test.txt"), "content");

        let result = search_in_files(
            tmp.to_string_lossy().to_string(),
            "".to_string(),
            true,
            false,
            false,
            None,
        )
        .unwrap();
        assert_eq!(result.total_matches, 0);
        assert_eq!(result.total_files, 0);

        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn test_search_max_results() {
        let tmp = std::env::temp_dir().join("madsterm_test_search_max");
        let _ = fs::remove_dir_all(&tmp);
        let _ = fs::create_dir_all(&tmp);
        // Create a file with many matches
        let content = "match\n".repeat(100);
        let _ = fs::write(tmp.join("test.txt"), &content);

        let result = search_in_files(
            tmp.to_string_lossy().to_string(),
            "match".to_string(),
            true,
            false,
            false,
            Some(5),
        )
        .unwrap();
        assert_eq!(result.total_matches, 5);
        assert!(result.truncated);

        let _ = fs::remove_dir_all(&tmp);
    }
}
