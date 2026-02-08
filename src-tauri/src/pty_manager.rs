use crate::error::AppError;
use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use std::collections::HashMap;
use std::io::{Read, Write};
use tauri::{AppHandle, Emitter};
use uuid::Uuid;

fn run_pty_reader(mut reader: Box<dyn Read + Send>, handle: AppHandle, session_id: String) {
    let mut buf = [0u8; 16384];
    // Buffer for incomplete UTF-8 sequences at chunk boundaries
    let mut utf8_remainder: Vec<u8> = Vec::new();
    let output_event = format!("pty-output-{}", session_id);
    let exit_event = format!("pty-exit-{}", session_id);

    loop {
        match reader.read(&mut buf) {
            Ok(0) => {
                // Flush any remaining bytes as lossy before exit
                if !utf8_remainder.is_empty() {
                    let data = String::from_utf8_lossy(&utf8_remainder).to_string();
                    let _ = handle.emit(&output_event, &data);
                }
                let _ = handle.emit(&exit_event, ());
                break;
            }
            Ok(n) => {
                // Prepend any leftover bytes from previous read
                let chunk = if utf8_remainder.is_empty() {
                    &buf[..n]
                } else {
                    utf8_remainder.extend_from_slice(&buf[..n]);
                    utf8_remainder.as_slice()
                };

                // Find the last valid UTF-8 boundary
                match std::str::from_utf8(chunk) {
                    Ok(s) => {
                        let _ = handle.emit(&output_event, s);
                        utf8_remainder.clear();
                    }
                    Err(e) => {
                        let valid_up_to = e.valid_up_to();
                        // Emit the valid portion
                        if valid_up_to > 0 {
                            // Safety: we know bytes up to valid_up_to are valid UTF-8
                            let valid =
                                unsafe { std::str::from_utf8_unchecked(&chunk[..valid_up_to]) };
                            let _ = handle.emit(&output_event, valid);
                        }
                        // Keep the incomplete tail for next read
                        let remainder = &chunk[valid_up_to..];
                        if remainder.len() > 4 {
                            // More than max UTF-8 sequence length — this isn't
                            // just an incomplete sequence, emit lossy and clear
                            let data = String::from_utf8_lossy(remainder).to_string();
                            let _ = handle.emit(&output_event, &data);
                            utf8_remainder.clear();
                        } else {
                            utf8_remainder = remainder.to_vec();
                        }
                    }
                }
            }
            Err(_) => {
                let _ = handle.emit(&exit_event, ());
                break;
            }
        }
    }
}

pub struct PtySession {
    pub master: Box<dyn MasterPty + Send>,
    pub writer: Box<dyn Write + Send>,
    pub child: Box<dyn Child + Send + Sync>,
    pub cols: u16,
    pub rows: u16,
}

pub struct PtyManager {
    sessions: HashMap<String, PtySession>,
}

impl PtyManager {
    pub fn new() -> Self {
        PtyManager {
            sessions: HashMap::new(),
        }
    }

    pub fn create_session(
        &mut self,
        cols: u16,
        rows: u16,
        cwd: Option<String>,
        app_handle: AppHandle,
    ) -> Result<String, AppError> {
        let pty_system = native_pty_system();
        let pair = pty_system
            .openpty(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| AppError::Pty(e.to_string()))?;

        let mut cmd = CommandBuilder::new_default_prog();
        cmd.env("TERM", "xterm-256color");
        cmd.env("COLORTERM", "truecolor");
        // Ensure locale is set for proper Unicode support in vim/TUI apps
        if std::env::var("LANG").is_err() {
            cmd.env("LANG", "en_US.UTF-8");
        }
        if let Some(dir) = &cwd {
            cmd.cwd(dir);
        }
        if cwd.is_none() {
            // Default to user's home directory if no cwd specified
            if let Ok(home) = std::env::var("HOME") {
                cmd.cwd(home);
            }
        }

        let child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| AppError::Pty(e.to_string()))?;

        let reader = pair
            .master
            .try_clone_reader()
            .map_err(|e| AppError::Pty(e.to_string()))?;
        let writer = pair
            .master
            .take_writer()
            .map_err(|e| AppError::Pty(e.to_string()))?;

        let session_id = Uuid::new_v4().to_string();

        // Spawn background reader thread that emits PTY output to frontend
        let sid = session_id.clone();
        let handle = app_handle.clone();
        std::thread::spawn(move || {
            run_pty_reader(reader, handle, sid);
        });

        let session = PtySession {
            master: pair.master,
            writer,
            child,
            cols,
            rows,
        };

        self.sessions.insert(session_id.clone(), session);
        Ok(session_id)
    }

    pub fn write(&mut self, session_id: &str, data: &str) -> Result<(), AppError> {
        let session = self
            .sessions
            .get_mut(session_id)
            .ok_or_else(|| AppError::NotFound(format!("Session {} not found", session_id)))?;
        session.writer.write_all(data.as_bytes())?;
        session.writer.flush()?;
        Ok(())
    }

    pub fn resize(&mut self, session_id: &str, cols: u16, rows: u16) -> Result<(), AppError> {
        let session = self
            .sessions
            .get_mut(session_id)
            .ok_or_else(|| AppError::NotFound(format!("Session {} not found", session_id)))?;
        session
            .master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| AppError::Pty(e.to_string()))?;
        session.cols = cols;
        session.rows = rows;
        Ok(())
    }

    pub fn close(&mut self, session_id: &str) -> Result<(), AppError> {
        if let Some(mut session) = self.sessions.remove(session_id) {
            let _ = session.child.kill();
        }
        Ok(())
    }
}
