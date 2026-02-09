use serde::Serialize;

#[derive(Debug, Serialize)]
pub enum AppError {
    Io(String),
    Git(String),
    Pty(String),
    InvalidInput(String),
    NotFound(String),
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::Io(msg) => write!(f, "{}", msg),
            AppError::Git(msg) => write!(f, "{}", msg),
            AppError::Pty(msg) => write!(f, "{}", msg),
            AppError::InvalidInput(msg) => write!(f, "{}", msg),
            AppError::NotFound(msg) => write!(f, "{}", msg),
        }
    }
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Io(e.to_string())
    }
}

impl From<git2::Error> for AppError {
    fn from(e: git2::Error) -> Self {
        AppError::Git(e.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_display_io_error() {
        let err = AppError::Io("disk full".to_string());
        assert_eq!(format!("{}", err), "disk full");
    }

    #[test]
    fn test_display_git_error() {
        let err = AppError::Git("not a repo".to_string());
        assert_eq!(format!("{}", err), "not a repo");
    }

    #[test]
    fn test_display_pty_error() {
        let err = AppError::Pty("spawn failed".to_string());
        assert_eq!(format!("{}", err), "spawn failed");
    }

    #[test]
    fn test_display_invalid_input() {
        let err = AppError::InvalidInput("bad data".to_string());
        assert_eq!(format!("{}", err), "bad data");
    }

    #[test]
    fn test_display_not_found() {
        let err = AppError::NotFound("missing".to_string());
        assert_eq!(format!("{}", err), "missing");
    }

    #[test]
    fn test_from_io_error() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "file not found");
        let app_err: AppError = io_err.into();
        match app_err {
            AppError::Io(msg) => assert!(msg.contains("file not found")),
            _ => panic!("Expected Io variant"),
        }
    }

    #[test]
    fn test_debug_format() {
        let err = AppError::Io("test".to_string());
        let debug_str = format!("{:?}", err);
        assert!(debug_str.contains("Io"));
        assert!(debug_str.contains("test"));
    }
}
