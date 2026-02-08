use std::collections::HashMap;
use std::io::{Read, Write};
use portable_pty::{native_pty_system, CommandBuilder, PtySize, MasterPty, Child};
use tauri::{AppHandle, Emitter};
use uuid::Uuid;

pub struct PtySession {
    pub id: String,
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
    ) -> Result<String, String> {
        let pty_system = native_pty_system();
        let pair = pty_system
            .openpty(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())?;

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

        let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;

        let reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
        let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

        let session_id = Uuid::new_v4().to_string();

        // Spawn background reader thread that emits PTY output to frontend
        let sid = session_id.clone();
        let handle = app_handle.clone();
        std::thread::spawn(move || {
            let mut reader = reader;
            let mut buf = [0u8; 16384];
            loop {
                match reader.read(&mut buf) {
                    Ok(0) => {
                        let _ = handle.emit(&format!("pty-exit-{}", sid), ());
                        break;
                    }
                    Ok(n) => {
                        // Use lossy conversion - terminal data may contain partial UTF-8
                        let data = String::from_utf8_lossy(&buf[..n]).to_string();
                        let _ = handle.emit(&format!("pty-output-{}", sid), &data);
                    }
                    Err(_) => {
                        let _ = handle.emit(&format!("pty-exit-{}", sid), ());
                        break;
                    }
                }
            }
        });

        let session = PtySession {
            id: session_id.clone(),
            master: pair.master,
            writer,
            child,
            cols,
            rows,
        };

        self.sessions.insert(session_id.clone(), session);
        Ok(session_id)
    }

    pub fn write(&mut self, session_id: &str, data: &str) -> Result<(), String> {
        let session = self
            .sessions
            .get_mut(session_id)
            .ok_or_else(|| format!("Session {} not found", session_id))?;
        session
            .writer
            .write_all(data.as_bytes())
            .map_err(|e| e.to_string())?;
        session.writer.flush().map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn resize(&mut self, session_id: &str, cols: u16, rows: u16) -> Result<(), String> {
        let session = self
            .sessions
            .get_mut(session_id)
            .ok_or_else(|| format!("Session {} not found", session_id))?;
        session
            .master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())?;
        session.cols = cols;
        session.rows = rows;
        Ok(())
    }

    pub fn close(&mut self, session_id: &str) -> Result<(), String> {
        if let Some(mut session) = self.sessions.remove(session_id) {
            let _ = session.child.kill();
        }
        Ok(())
    }
}
