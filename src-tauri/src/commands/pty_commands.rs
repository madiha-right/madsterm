use crate::pty_manager::PtyManager;
use std::sync::Arc;
use parking_lot::Mutex;
use tauri::{AppHandle, State};

type PtyState = Arc<Mutex<PtyManager>>;

#[tauri::command]
pub fn pty_create(
    state: State<'_, PtyState>,
    app: AppHandle,
    cols: u16,
    rows: u16,
    cwd: Option<String>,
) -> Result<String, String> {
    let mut mgr = state.lock();
    mgr.create_session(cols, rows, cwd, app)
}

#[tauri::command]
pub fn pty_write(
    state: State<'_, PtyState>,
    session_id: String,
    data: String,
) -> Result<(), String> {
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
    let mut mgr = state.lock();
    mgr.resize(&session_id, cols, rows)
}

#[tauri::command]
pub fn pty_close(
    state: State<'_, PtyState>,
    session_id: String,
) -> Result<(), String> {
    let mut mgr = state.lock();
    mgr.close(&session_id)
}
