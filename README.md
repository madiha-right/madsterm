# Madsterm

A fast, keyboard-driven terminal emulator with built-in file explorer and git diff viewer.

## Features

- **Tabbed terminals** with drag-and-drop reordering
- **File explorer** sidebar with lazy-loading tree
- **Git diff panel** with inline code review
- **Vim-style navigation** (j/k/h/l/gg/G) in all panels
- **10+ built-in themes** including Paradigm, Dracula, Nord, Tokyo Night
- **Quick file search** with fuzzy matching
- **Keyboard-first workflow** — every action has a shortcut

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) (stable)
- [Tauri 2 CLI](https://tauri.app/) (`npm install -g @tauri-apps/cli`)

## Install & Run

```bash
# Install dependencies
npm install

# Development (Vite + Tauri)
npm run tauri dev

# Production build
npm run tauri build

# Frontend only (localhost:1420)
npm run dev
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+T` | New tab |
| `Cmd+W` | Close tab |
| `Cmd+1-9` | Switch to tab |
| `Cmd+B` | Toggle file explorer |
| `Cmd+Shift+=` | Toggle git changes |
| `Cmd+K` | Clear terminal |
| `Cmd+F` | Find in terminal |
| `Cmd+P` | Quick search files |
| `Ctrl+F` | Toggle fullscreen |

## Tech Stack

- **Backend**: Tauri 2 (Rust) — PTY via `portable-pty`, git via `git2`
- **Frontend**: React 19 + xterm.js + Zustand
- **Build**: Vite + TypeScript

## License

MIT
