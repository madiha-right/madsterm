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
