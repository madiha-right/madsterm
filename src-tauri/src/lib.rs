mod commands;
mod pty_manager;

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
            commands::fs_commands::read_directory,
            commands::fs_commands::open_file,
            commands::fs_commands::get_cwd,
            commands::fs_commands::get_home_dir,
            commands::fs_commands::get_shell_name,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
