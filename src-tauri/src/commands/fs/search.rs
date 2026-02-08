use crate::error::AppError;
use regex::Regex;
use serde::Serialize;
use std::path::Path;
use walkdir::WalkDir;

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

const SKIP_DIRS: &[&str] = &[
    ".git",
    "target",
    "node_modules",
    ".next",
    "dist",
    "build",
    "__pycache__",
];

fn build_search_pattern(
    query: &str,
    case_sensitive: bool,
    whole_word: bool,
    use_regex: bool,
) -> Result<Regex, AppError> {
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

    Regex::new(&pattern).map_err(|e| AppError::InvalidInput(format!("Invalid regex: {}", e)))
}

#[tauri::command]
pub fn search_in_files(
    root_path: String,
    query: String,
    case_sensitive: bool,
    whole_word: bool,
    use_regex: bool,
    max_results: Option<usize>,
) -> Result<SearchResults, AppError> {
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

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
