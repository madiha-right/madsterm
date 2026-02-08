# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Madsterm is a Warp-style terminal emulator built with Tauri 2 (Rust backend) + React 19 + xterm.js frontend. It features a tabbed terminal interface, file explorer sidebar, and git diff panel.

## Build & Development Commands

```bash
# Development (starts both Vite dev server + Tauri window)
npm run tauri dev

# Build production app
npm run tauri build

# Frontend only (no Tauri shell, runs at localhost:1420)
npm run dev

# Type-check
npx tsc --noEmit
```

No test framework is configured.

## Architecture

### Two-Process Model
- **Rust backend** (`src-tauri/`): Tauri 2 app managing PTY sessions, filesystem ops, and git integration via `portable-pty`, `walkdir`, and `git2` crates. All backend state is in `PtyManager` behind `Arc<Mutex<>>`.
- **React frontend** (`src/`): Renders xterm.js terminals, file explorer, and diff viewer. Communicates with Rust via Tauri's `invoke()` IPC and `listen()` events.

### PTY Data Flow
1. Frontend calls `invoke("pty_create")` → Rust spawns shell via `portable-pty`, returns session UUID
2. Rust reader thread reads PTY output in 16KB chunks, emits `pty-output-{id}` events to frontend
3. Frontend `terminal.onData()` → calls `invoke("pty_write")` → Rust writes to PTY
4. Resize: `terminal.onResize()` → `invoke("pty_resize")`

### State Management
Zustand stores (no middleware/persistence):
- `tabStore` — tab list, active tab, session IDs
- `panelStore` — left/right panel visibility, focused panel tracking
- `fileExplorerStore` — file tree, expanded paths, search state
- `diffStore` — git changes list, selected file diff, loading state

### Key Frontend Patterns
- Each tab gets a `TerminalInstance` that creates its own xterm.js `Terminal` + PTY session on mount, disposes on unmount
- `isAppShortcut()` in `TerminalInstance.tsx` gates which key combos propagate past xterm vs get consumed by the terminal
- `react-resizable-panels` handles the 3-column layout (file explorer | terminal | diff panel)
- File explorer and diff panel have vim-style j/k/h/l/gg/G keyboard navigation
- Keyboard shortcuts are centralized in `useKeyboardShortcuts.ts` hook

### Tauri Commands (IPC surface)
Defined in `src-tauri/src/commands/`:
- `pty_create`, `pty_write`, `pty_resize`, `pty_close` — PTY lifecycle
- `git_branch`, `git_status`, `git_diff` — git integration (uses `git2` crate, not CLI)
- `read_directory`, `open_file`, `get_cwd`, `get_home_dir` — filesystem

### Styling
Inline styles everywhere (no CSS modules/Tailwind utility classes in components despite Tailwind being configured). Theme colors centralized in `src/theme/colors.ts` as the `THEME` object. The xterm theme is nested inside as `THEME.xtermTheme`.

## Important Notes

- `Cmd+L` was removed as a shortcut for the changes panel (it conflicts with terminal clear-line). Use `Cmd+Shift+=` instead.
- PTY sessions use `String::from_utf8_lossy` for output — partial UTF-8 sequences at chunk boundaries may produce replacement characters.
- The diff panel polls `git_status` every 3 seconds via `setInterval`.
- File explorer skips hidden files (`.`-prefixed), `node_modules`, and `target` directories.
- Tab bar has `paddingLeft: 80` to account for macOS traffic light buttons.
