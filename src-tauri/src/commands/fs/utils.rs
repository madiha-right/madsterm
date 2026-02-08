use crate::error::AppError;
use std::process::Command;

#[tauri::command]
pub fn get_cwd() -> Result<String, AppError> {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .or_else(|_| {
            std::env::current_dir()
                .map(|p| p.to_string_lossy().to_string())
                .map_err(|e| e.to_string())
        })
        .map_err(|e| AppError::Io(e.to_string()))
}

#[tauri::command]
pub fn get_home_dir() -> Result<String, AppError> {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|e| AppError::Io(e.to_string()))
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
pub fn open_file(path: String) -> Result<(), AppError> {
    #[cfg(target_os = "macos")]
    {
        Command::new("open").arg(&path).spawn()?;
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open").arg(&path).spawn()?;
    }
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "", &path])
            .spawn()?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

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
}
