mod commands;
pub mod error;
mod pty_manager;

pub use error::AppError;

use parking_lot::Mutex;
use std::sync::Arc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let pty_state = Arc::new(Mutex::new(pty_manager::PtyManager::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(pty_state)
        .invoke_handler(tauri::generate_handler![
            commands::pty_commands::pty_create,
            commands::pty_commands::pty_write,
            commands::pty_commands::pty_resize,
            commands::pty_commands::pty_close,
            commands::git_commands::git_branch,
            commands::git_commands::git_status,
            commands::git_commands::git_diff,
            commands::fs::read_directory,
            commands::fs::open_file,
            commands::fs::get_cwd,
            commands::fs::get_home_dir,
            commands::fs::get_shell_name,
            commands::fs::search_in_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
