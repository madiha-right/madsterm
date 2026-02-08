use crate::pty_manager::PtyManager;
use parking_lot::Mutex;
use std::sync::Arc;
use tauri::{AppHandle, State};

type PtyState = Arc<Mutex<PtyManager>>;

/// Validate that a session ID looks like a UUID v4
fn validate_session_id(session_id: &str) -> Result<(), String> {
    if uuid::Uuid::parse_str(session_id).is_err() {
        return Err("Invalid session ID format".to_string());
    }
    Ok(())
}

/// Validate terminal dimensions are within reasonable bounds
fn validate_dimensions(cols: u16, rows: u16) -> Result<(), String> {
    if cols == 0 || cols > 500 {
        return Err(format!("Invalid cols value: {} (must be 1-500)", cols));
    }
    if rows == 0 || rows > 500 {
        return Err(format!("Invalid rows value: {} (must be 1-500)", rows));
    }
    Ok(())
}

/// Validate that a cwd path is an existing directory with no path traversal
fn validate_cwd(cwd: &str) -> Result<(), String> {
    let path = std::path::Path::new(cwd);
    // Must be absolute path
    if !path.is_absolute() {
        return Err("CWD must be an absolute path".to_string());
    }
    // Canonicalize to resolve any .. or symlinks, then check it exists
    let canonical = path
        .canonicalize()
        .map_err(|_| format!("CWD path does not exist: {}", cwd))?;
    if !canonical.is_dir() {
        return Err(format!("CWD is not a directory: {}", cwd));
    }
    Ok(())
}

#[tauri::command]
pub fn pty_create(
    state: State<'_, PtyState>,
    app: AppHandle,
    cols: u16,
    rows: u16,
    cwd: Option<String>,
) -> Result<String, String> {
    validate_dimensions(cols, rows)?;
    if let Some(ref dir) = cwd {
        if !dir.is_empty() {
            validate_cwd(dir)?;
        }
    }
    let mut mgr = state.lock();
    mgr.create_session(cols, rows, cwd, app)
}

#[tauri::command]
pub fn pty_write(
    state: State<'_, PtyState>,
    session_id: String,
    data: String,
) -> Result<(), String> {
    validate_session_id(&session_id)?;
    let mut mgr = state.lock();
    mgr.write(&session_id, &data)
}

#[tauri::command]
pub fn pty_resize(
    state: State<'_, PtyState>,
    session_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    validate_session_id(&session_id)?;
    validate_dimensions(cols, rows)?;
    let mut mgr = state.lock();
    mgr.resize(&session_id, cols, rows)
}

#[tauri::command]
pub fn pty_close(state: State<'_, PtyState>, session_id: String) -> Result<(), String> {
    validate_session_id(&session_id)?;
    let mut mgr = state.lock();
    mgr.close(&session_id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_session_id_valid() {
        let id = uuid::Uuid::new_v4().to_string();
        assert!(validate_session_id(&id).is_ok());
    }

    #[test]
    fn test_validate_session_id_invalid() {
        assert!(validate_session_id("not-a-uuid").is_err());
        assert!(validate_session_id("").is_err());
        assert!(validate_session_id("12345").is_err());
    }

    #[test]
    fn test_validate_dimensions_valid() {
        assert!(validate_dimensions(80, 24).is_ok());
        assert!(validate_dimensions(1, 1).is_ok());
        assert!(validate_dimensions(500, 500).is_ok());
    }

    #[test]
    fn test_validate_dimensions_invalid() {
        assert!(validate_dimensions(0, 24).is_err());
        assert!(validate_dimensions(80, 0).is_err());
        assert!(validate_dimensions(501, 24).is_err());
        assert!(validate_dimensions(80, 501).is_err());
    }

    #[test]
    fn test_validate_cwd_valid() {
        // Home directory should exist
        let home = std::env::var("HOME").unwrap_or("/tmp".to_string());
        assert!(validate_cwd(&home).is_ok());
    }

    #[test]
    fn test_validate_cwd_nonexistent() {
        assert!(validate_cwd("/nonexistent/path/that/doesnt/exist").is_err());
    }

    #[test]
    fn test_validate_cwd_relative() {
        assert!(validate_cwd("relative/path").is_err());
    }
}
