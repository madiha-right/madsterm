export interface AppTheme {
  bg: string;
  bgSurface: string;
  bgPanel: string;
  bgHover: string;
  bgActive: string;
  border: string;
  text: string;
  textMuted: string;
  textBright: string;
  accent: string;
  accentHover: string;

  diffAddedBg: string;
  diffAddedText: string;
  diffAddedLineBg: string;
  diffRemovedBg: string;
  diffRemovedText: string;
  diffRemovedLineBg: string;
  diffHunkHeader: string;
  diffHunkHeaderText: string;

  tabActiveBg: string;
  tabInactiveBg: string;
  tabBorder: string;

  statusBarBg: string;
  statusBarText: string;
  statusBarAccent: string;

  explorerBg: string;
  explorerHover: string;
  explorerSelected: string;
  explorerIcon: string;

  xtermTheme: {
    background: string;
    foreground: string;
    cursor: string;
    cursorAccent: string;
    selectionBackground: string;
    selectionForeground: string;
    selectionInactiveBackground: string;
    black: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    magenta: string;
    cyan: string;
    white: string;
    brightBlack: string;
    brightRed: string;
    brightGreen: string;
    brightYellow: string;
    brightBlue: string;
    brightMagenta: string;
    brightCyan: string;
    brightWhite: string;
  };
}

export type ThemeId =
  | "paradigm"
  | "madsterm-dark"
  | "one-dark"
  | "dracula"
  | "nord"
  | "solarized-dark"
  | "catppuccin-mocha"
  | "tokyo-night"
  | "gruvbox-dark"
  | "github-dark"
  | "rose-pine";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  previewColors: [string, string, string, string, string];
}

const paradigm: AppTheme = {
  bg: "#000000",
  bgSurface: "#050505",
  bgPanel: "#080808",
  bgHover: "#0f0f0f",
  bgActive: "#161616",
  border: "#151515",
  text: "#e0e0e0",
  textMuted: "#4a4a4a",
  textBright: "#ffffff",
  accent: "#ffffff",
  accentHover: "#aaaaaa",

  diffAddedBg: "#061a06",
  diffAddedText: "#4caf50",
  diffAddedLineBg: "#0c2a0c",
  diffRemovedBg: "#1a0606",
  diffRemovedText: "#ef5350",
  diffRemovedLineBg: "#2a0c0c",
  diffHunkHeader: "#0a0a0a",
  diffHunkHeaderText: "#666666",

  tabActiveBg: "#0f0f0f",
  tabInactiveBg: "transparent",
  tabBorder: "#151515",

  statusBarBg: "#000000",
  statusBarText: "#4a4a4a",
  statusBarAccent: "#ffffff",

  explorerBg: "#050505",
  explorerHover: "#0f0f0f",
  explorerSelected: "#161616",
  explorerIcon: "#4a4a4a",

  xtermTheme: {
    background: "#000000",
    foreground: "#e0e0e0",
    cursor: "#ffffff",
    cursorAccent: "#000000",
    selectionBackground: "#2a2a2a",
    selectionForeground: "#ffffff",
    selectionInactiveBackground: "#2a2a2a55",
    black: "#1a1a1a",
    red: "#e06c75",
    green: "#98c379",
    yellow: "#d19a66",
    blue: "#61afef",
    magenta: "#c678dd",
    cyan: "#56b6c2",
    white: "#e0e0e0",
    brightBlack: "#4a4a4a",
    brightRed: "#e06c75",
    brightGreen: "#98c379",
    brightYellow: "#d19a66",
    brightBlue: "#61afef",
    brightMagenta: "#c678dd",
    brightCyan: "#56b6c2",
    brightWhite: "#ffffff",
  },
};

const madstermDark: AppTheme = {
  bg: "#090b0f",
  bgSurface: "#111318",
  bgPanel: "#151821",
  bgHover: "#1c2030",
  bgActive: "#24293a",
  border: "#1a1e2e",
  text: "#d4d8e3",
  textMuted: "#5f6882",
  textBright: "#f0f2f8",
  accent: "#FF6A00",
  accentHover: "#FF8C38",

  diffAddedBg: "#12261e",
  diffAddedText: "#3fb950",
  diffAddedLineBg: "#1a3a2a",
  diffRemovedBg: "#2d1215",
  diffRemovedText: "#f85149",
  diffRemovedLineBg: "#3a1a1a",
  diffHunkHeader: "#1c2d4d",
  diffHunkHeaderText: "#7aa2f7",

  tabActiveBg: "#1a1e2e",
  tabInactiveBg: "transparent",
  tabBorder: "#252a3a",

  statusBarBg: "#06080c",
  statusBarText: "#5f6882",
  statusBarAccent: "#FF6A00",

  explorerBg: "#111318",
  explorerHover: "#1c2030",
  explorerSelected: "#24293a",
  explorerIcon: "#5f6882",

  xtermTheme: {
    background: "#090b0f",
    foreground: "#d4d8e3",
    cursor: "#FF6A00",
    cursorAccent: "#090b0f",
    selectionBackground: "#2a3550",
    selectionForeground: "#ffffff",
    selectionInactiveBackground: "#2a355055",
    black: "#1e2127",
    red: "#e06c75",
    green: "#98c379",
    yellow: "#d19a66",
    blue: "#61afef",
    magenta: "#c678dd",
    cyan: "#56b6c2",
    white: "#abb2bf",
    brightBlack: "#5c6370",
    brightRed: "#e06c75",
    brightGreen: "#98c379",
    brightYellow: "#d19a66",
    brightBlue: "#61afef",
    brightMagenta: "#c678dd",
    brightCyan: "#56b6c2",
    brightWhite: "#ffffff",
  },
};

const oneDark: AppTheme = {
  bg: "#282c34",
  bgSurface: "#21252b",
  bgPanel: "#2c313a",
  bgHover: "#323842",
  bgActive: "#3a3f4b",
  border: "#3e4452",
  text: "#abb2bf",
  textMuted: "#636d83",
  textBright: "#e6e8ee",
  accent: "#61afef",
  accentHover: "#7bc0f8",

  diffAddedBg: "#1e3a2a",
  diffAddedText: "#98c379",
  diffAddedLineBg: "#2a4a35",
  diffRemovedBg: "#3a1e1e",
  diffRemovedText: "#e06c75",
  diffRemovedLineBg: "#4a2a2a",
  diffHunkHeader: "#2c3a50",
  diffHunkHeaderText: "#61afef",

  tabActiveBg: "#2c313a",
  tabInactiveBg: "transparent",
  tabBorder: "#3e4452",

  statusBarBg: "#21252b",
  statusBarText: "#636d83",
  statusBarAccent: "#61afef",

  explorerBg: "#21252b",
  explorerHover: "#2c313a",
  explorerSelected: "#3a3f4b",
  explorerIcon: "#636d83",

  xtermTheme: {
    background: "#282c34",
    foreground: "#abb2bf",
    cursor: "#528bff",
    cursorAccent: "#282c34",
    selectionBackground: "#3e4452",
    selectionForeground: "#ffffff",
    selectionInactiveBackground: "#3e445255",
    black: "#1e2127",
    red: "#e06c75",
    green: "#98c379",
    yellow: "#d19a66",
    blue: "#61afef",
    magenta: "#c678dd",
    cyan: "#56b6c2",
    white: "#abb2bf",
    brightBlack: "#5c6370",
    brightRed: "#e06c75",
    brightGreen: "#98c379",
    brightYellow: "#e5c07b",
    brightBlue: "#61afef",
    brightMagenta: "#c678dd",
    brightCyan: "#56b6c2",
    brightWhite: "#ffffff",
  },
};

const dracula: AppTheme = {
  bg: "#282a36",
  bgSurface: "#21222c",
  bgPanel: "#2d2f3d",
  bgHover: "#343746",
  bgActive: "#3c3f52",
  border: "#44475a",
  text: "#f8f8f2",
  textMuted: "#6272a4",
  textBright: "#ffffff",
  accent: "#bd93f9",
  accentHover: "#caa6fc",

  diffAddedBg: "#1a3a2a",
  diffAddedText: "#50fa7b",
  diffAddedLineBg: "#254a35",
  diffRemovedBg: "#3a1a2a",
  diffRemovedText: "#ff5555",
  diffRemovedLineBg: "#4a2535",
  diffHunkHeader: "#2d3550",
  diffHunkHeaderText: "#bd93f9",

  tabActiveBg: "#343746",
  tabInactiveBg: "transparent",
  tabBorder: "#44475a",

  statusBarBg: "#191a21",
  statusBarText: "#6272a4",
  statusBarAccent: "#bd93f9",

  explorerBg: "#21222c",
  explorerHover: "#2d2f3d",
  explorerSelected: "#3c3f52",
  explorerIcon: "#6272a4",

  xtermTheme: {
    background: "#282a36",
    foreground: "#f8f8f2",
    cursor: "#f8f8f2",
    cursorAccent: "#282a36",
    selectionBackground: "#44475a",
    selectionForeground: "#ffffff",
    selectionInactiveBackground: "#44475a55",
    black: "#21222c",
    red: "#ff5555",
    green: "#50fa7b",
    yellow: "#f1fa8c",
    blue: "#bd93f9",
    magenta: "#ff79c6",
    cyan: "#8be9fd",
    white: "#f8f8f2",
    brightBlack: "#6272a4",
    brightRed: "#ff6e6e",
    brightGreen: "#69ff94",
    brightYellow: "#ffffa5",
    brightBlue: "#d6acff",
    brightMagenta: "#ff92df",
    brightCyan: "#a4ffff",
    brightWhite: "#ffffff",
  },
};

const nord: AppTheme = {
  bg: "#2e3440",
  bgSurface: "#2e3440",
  bgPanel: "#3b4252",
  bgHover: "#434c5e",
  bgActive: "#4c566a",
  border: "#3b4252",
  text: "#d8dee9",
  textMuted: "#7b88a1",
  textBright: "#eceff4",
  accent: "#88c0d0",
  accentHover: "#8fbcbb",

  diffAddedBg: "#2a3a2e",
  diffAddedText: "#a3be8c",
  diffAddedLineBg: "#354a3a",
  diffRemovedBg: "#3a2a2e",
  diffRemovedText: "#bf616a",
  diffRemovedLineBg: "#4a3535",
  diffHunkHeader: "#3b4252",
  diffHunkHeaderText: "#81a1c1",

  tabActiveBg: "#3b4252",
  tabInactiveBg: "transparent",
  tabBorder: "#434c5e",

  statusBarBg: "#272c36",
  statusBarText: "#7b88a1",
  statusBarAccent: "#88c0d0",

  explorerBg: "#2e3440",
  explorerHover: "#3b4252",
  explorerSelected: "#434c5e",
  explorerIcon: "#7b88a1",

  xtermTheme: {
    background: "#2e3440",
    foreground: "#d8dee9",
    cursor: "#d8dee9",
    cursorAccent: "#2e3440",
    selectionBackground: "#4c566a",
    selectionForeground: "#eceff4",
    selectionInactiveBackground: "#4c566a55",
    black: "#3b4252",
    red: "#bf616a",
    green: "#a3be8c",
    yellow: "#ebcb8b",
    blue: "#81a1c1",
    magenta: "#b48ead",
    cyan: "#88c0d0",
    white: "#e5e9f0",
    brightBlack: "#4c566a",
    brightRed: "#bf616a",
    brightGreen: "#a3be8c",
    brightYellow: "#ebcb8b",
    brightBlue: "#81a1c1",
    brightMagenta: "#b48ead",
    brightCyan: "#8fbcbb",
    brightWhite: "#eceff4",
  },
};

const solarizedDark: AppTheme = {
  bg: "#002b36",
  bgSurface: "#073642",
  bgPanel: "#073642",
  bgHover: "#0a4050",
  bgActive: "#0d4f5e",
  border: "#094a58",
  text: "#839496",
  textMuted: "#586e75",
  textBright: "#fdf6e3",
  accent: "#2aa198",
  accentHover: "#35bdb4",

  diffAddedBg: "#0a3a2e",
  diffAddedText: "#859900",
  diffAddedLineBg: "#154a3a",
  diffRemovedBg: "#3a1a1e",
  diffRemovedText: "#dc322f",
  diffRemovedLineBg: "#4a2a2e",
  diffHunkHeader: "#073642",
  diffHunkHeaderText: "#268bd2",

  tabActiveBg: "#073642",
  tabInactiveBg: "transparent",
  tabBorder: "#094a58",

  statusBarBg: "#001e28",
  statusBarText: "#586e75",
  statusBarAccent: "#2aa198",

  explorerBg: "#073642",
  explorerHover: "#0a4050",
  explorerSelected: "#0d4f5e",
  explorerIcon: "#586e75",

  xtermTheme: {
    background: "#002b36",
    foreground: "#839496",
    cursor: "#839496",
    cursorAccent: "#002b36",
    selectionBackground: "#094a58",
    selectionForeground: "#fdf6e3",
    selectionInactiveBackground: "#094a5855",
    black: "#073642",
    red: "#dc322f",
    green: "#859900",
    yellow: "#b58900",
    blue: "#268bd2",
    magenta: "#d33682",
    cyan: "#2aa198",
    white: "#eee8d5",
    brightBlack: "#586e75",
    brightRed: "#cb4b16",
    brightGreen: "#859900",
    brightYellow: "#b58900",
    brightBlue: "#268bd2",
    brightMagenta: "#6c71c4",
    brightCyan: "#2aa198",
    brightWhite: "#fdf6e3",
  },
};

const catppuccinMocha: AppTheme = {
  bg: "#1e1e2e",
  bgSurface: "#181825",
  bgPanel: "#242436",
  bgHover: "#2a2a3c",
  bgActive: "#313244",
  border: "#313244",
  text: "#cdd6f4",
  textMuted: "#6c7086",
  textBright: "#f5f5ff",
  accent: "#cba6f7",
  accentHover: "#d8b9f9",

  diffAddedBg: "#1a2e26",
  diffAddedText: "#a6e3a1",
  diffAddedLineBg: "#253e32",
  diffRemovedBg: "#2e1a22",
  diffRemovedText: "#f38ba8",
  diffRemovedLineBg: "#3e252e",
  diffHunkHeader: "#242436",
  diffHunkHeaderText: "#89b4fa",

  tabActiveBg: "#2a2a3c",
  tabInactiveBg: "transparent",
  tabBorder: "#313244",

  statusBarBg: "#11111b",
  statusBarText: "#6c7086",
  statusBarAccent: "#cba6f7",

  explorerBg: "#181825",
  explorerHover: "#242436",
  explorerSelected: "#313244",
  explorerIcon: "#6c7086",

  xtermTheme: {
    background: "#1e1e2e",
    foreground: "#cdd6f4",
    cursor: "#f5e0dc",
    cursorAccent: "#1e1e2e",
    selectionBackground: "#45475a",
    selectionForeground: "#cdd6f4",
    selectionInactiveBackground: "#45475a55",
    black: "#45475a",
    red: "#f38ba8",
    green: "#a6e3a1",
    yellow: "#f9e2af",
    blue: "#89b4fa",
    magenta: "#cba6f7",
    cyan: "#94e2d5",
    white: "#bac2de",
    brightBlack: "#585b70",
    brightRed: "#f38ba8",
    brightGreen: "#a6e3a1",
    brightYellow: "#f9e2af",
    brightBlue: "#89b4fa",
    brightMagenta: "#cba6f7",
    brightCyan: "#94e2d5",
    brightWhite: "#a6adc8",
  },
};

const tokyoNight: AppTheme = {
  bg: "#1a1b26",
  bgSurface: "#16161e",
  bgPanel: "#1f2030",
  bgHover: "#292e42",
  bgActive: "#33384e",
  border: "#292e42",
  text: "#a9b1d6",
  textMuted: "#565f89",
  textBright: "#c0caf5",
  accent: "#7aa2f7",
  accentHover: "#89b4fa",

  diffAddedBg: "#1a2e26",
  diffAddedText: "#9ece6a",
  diffAddedLineBg: "#253e32",
  diffRemovedBg: "#2e1a22",
  diffRemovedText: "#f7768e",
  diffRemovedLineBg: "#3e252e",
  diffHunkHeader: "#1f2030",
  diffHunkHeaderText: "#7aa2f7",

  tabActiveBg: "#292e42",
  tabInactiveBg: "transparent",
  tabBorder: "#292e42",

  statusBarBg: "#13131e",
  statusBarText: "#565f89",
  statusBarAccent: "#7aa2f7",

  explorerBg: "#16161e",
  explorerHover: "#1f2030",
  explorerSelected: "#292e42",
  explorerIcon: "#565f89",

  xtermTheme: {
    background: "#1a1b26",
    foreground: "#a9b1d6",
    cursor: "#c0caf5",
    cursorAccent: "#1a1b26",
    selectionBackground: "#33384e",
    selectionForeground: "#c0caf5",
    selectionInactiveBackground: "#33384e55",
    black: "#15161e",
    red: "#f7768e",
    green: "#9ece6a",
    yellow: "#e0af68",
    blue: "#7aa2f7",
    magenta: "#bb9af7",
    cyan: "#7dcfff",
    white: "#a9b1d6",
    brightBlack: "#414868",
    brightRed: "#f7768e",
    brightGreen: "#9ece6a",
    brightYellow: "#e0af68",
    brightBlue: "#7aa2f7",
    brightMagenta: "#bb9af7",
    brightCyan: "#7dcfff",
    brightWhite: "#c0caf5",
  },
};

const gruvboxDark: AppTheme = {
  bg: "#282828",
  bgSurface: "#1d2021",
  bgPanel: "#32302f",
  bgHover: "#3c3836",
  bgActive: "#504945",
  border: "#3c3836",
  text: "#ebdbb2",
  textMuted: "#928374",
  textBright: "#fbf1c7",
  accent: "#fe8019",
  accentHover: "#fabd2f",

  diffAddedBg: "#2a3228",
  diffAddedText: "#b8bb26",
  diffAddedLineBg: "#3a4a35",
  diffRemovedBg: "#3c2020",
  diffRemovedText: "#fb4934",
  diffRemovedLineBg: "#4a2a2a",
  diffHunkHeader: "#32302f",
  diffHunkHeaderText: "#83a598",

  tabActiveBg: "#3c3836",
  tabInactiveBg: "transparent",
  tabBorder: "#504945",

  statusBarBg: "#1d2021",
  statusBarText: "#928374",
  statusBarAccent: "#fe8019",

  explorerBg: "#1d2021",
  explorerHover: "#32302f",
  explorerSelected: "#3c3836",
  explorerIcon: "#928374",

  xtermTheme: {
    background: "#282828",
    foreground: "#ebdbb2",
    cursor: "#ebdbb2",
    cursorAccent: "#282828",
    selectionBackground: "#504945",
    selectionForeground: "#fbf1c7",
    selectionInactiveBackground: "#50494555",
    black: "#282828",
    red: "#cc241d",
    green: "#98971a",
    yellow: "#d79921",
    blue: "#458588",
    magenta: "#b16286",
    cyan: "#689d6a",
    white: "#a89984",
    brightBlack: "#928374",
    brightRed: "#fb4934",
    brightGreen: "#b8bb26",
    brightYellow: "#fabd2f",
    brightBlue: "#83a598",
    brightMagenta: "#d3869b",
    brightCyan: "#8ec07c",
    brightWhite: "#ebdbb2",
  },
};

const githubDark: AppTheme = {
  bg: "#0d1117",
  bgSurface: "#161b22",
  bgPanel: "#1c2129",
  bgHover: "#21262d",
  bgActive: "#2d333b",
  border: "#30363d",
  text: "#c9d1d9",
  textMuted: "#8b949e",
  textBright: "#f0f6fc",
  accent: "#58a6ff",
  accentHover: "#79c0ff",

  diffAddedBg: "#12261e",
  diffAddedText: "#3fb950",
  diffAddedLineBg: "#1a3a2a",
  diffRemovedBg: "#2d1215",
  diffRemovedText: "#f85149",
  diffRemovedLineBg: "#3a1a1a",
  diffHunkHeader: "#1c2d4d",
  diffHunkHeaderText: "#58a6ff",

  tabActiveBg: "#21262d",
  tabInactiveBg: "transparent",
  tabBorder: "#30363d",

  statusBarBg: "#010409",
  statusBarText: "#8b949e",
  statusBarAccent: "#58a6ff",

  explorerBg: "#161b22",
  explorerHover: "#21262d",
  explorerSelected: "#2d333b",
  explorerIcon: "#8b949e",

  xtermTheme: {
    background: "#0d1117",
    foreground: "#c9d1d9",
    cursor: "#58a6ff",
    cursorAccent: "#0d1117",
    selectionBackground: "#264f78",
    selectionForeground: "#ffffff",
    selectionInactiveBackground: "#264f7855",
    black: "#484f58",
    red: "#ff7b72",
    green: "#3fb950",
    yellow: "#d29922",
    blue: "#58a6ff",
    magenta: "#bc8cff",
    cyan: "#39c5cf",
    white: "#b1bac4",
    brightBlack: "#6e7681",
    brightRed: "#ffa198",
    brightGreen: "#56d364",
    brightYellow: "#e3b341",
    brightBlue: "#79c0ff",
    brightMagenta: "#d2a8ff",
    brightCyan: "#56d4dd",
    brightWhite: "#f0f6fc",
  },
};

const rosePine: AppTheme = {
  bg: "#191724",
  bgSurface: "#1f1d2e",
  bgPanel: "#26233a",
  bgHover: "#2a2740",
  bgActive: "#312e47",
  border: "#26233a",
  text: "#e0def4",
  textMuted: "#6e6a86",
  textBright: "#f0efff",
  accent: "#ebbcba",
  accentHover: "#f0d0ce",

  diffAddedBg: "#1a2e26",
  diffAddedText: "#9ccfd8",
  diffAddedLineBg: "#253e32",
  diffRemovedBg: "#2e1a22",
  diffRemovedText: "#eb6f92",
  diffRemovedLineBg: "#3e252e",
  diffHunkHeader: "#26233a",
  diffHunkHeaderText: "#c4a7e7",

  tabActiveBg: "#2a2740",
  tabInactiveBg: "transparent",
  tabBorder: "#312e47",

  statusBarBg: "#14121f",
  statusBarText: "#6e6a86",
  statusBarAccent: "#ebbcba",

  explorerBg: "#1f1d2e",
  explorerHover: "#26233a",
  explorerSelected: "#312e47",
  explorerIcon: "#6e6a86",

  xtermTheme: {
    background: "#191724",
    foreground: "#e0def4",
    cursor: "#524f67",
    cursorAccent: "#e0def4",
    selectionBackground: "#312e47",
    selectionForeground: "#e0def4",
    selectionInactiveBackground: "#312e4755",
    black: "#26233a",
    red: "#eb6f92",
    green: "#31748f",
    yellow: "#f6c177",
    blue: "#9ccfd8",
    magenta: "#c4a7e7",
    cyan: "#ebbcba",
    white: "#e0def4",
    brightBlack: "#6e6a86",
    brightRed: "#eb6f92",
    brightGreen: "#31748f",
    brightYellow: "#f6c177",
    brightBlue: "#9ccfd8",
    brightMagenta: "#c4a7e7",
    brightCyan: "#ebbcba",
    brightWhite: "#e0def4",
  },
};

export const THEMES: Record<ThemeId, AppTheme> = {
  "paradigm": paradigm,
  "madsterm-dark": madstermDark,
  "one-dark": oneDark,
  "dracula": dracula,
  "nord": nord,
  "solarized-dark": solarizedDark,
  "catppuccin-mocha": catppuccinMocha,
  "tokyo-night": tokyoNight,
  "gruvbox-dark": gruvboxDark,
  "github-dark": githubDark,
  "rose-pine": rosePine,
};

export const THEME_LIST: ThemeMeta[] = [
  { id: "paradigm", name: "Paradigm", previewColors: ["#000000", "#ffffff", "#c65f5f", "#5fc65f", "#5f8cc6"] },
  { id: "madsterm-dark", name: "Madsterm Dark", previewColors: ["#090b0f", "#FF6A00", "#e06c75", "#98c379", "#61afef"] },
  { id: "one-dark", name: "One Dark", previewColors: ["#282c34", "#61afef", "#e06c75", "#98c379", "#c678dd"] },
  { id: "dracula", name: "Dracula", previewColors: ["#282a36", "#bd93f9", "#ff5555", "#50fa7b", "#ff79c6"] },
  { id: "nord", name: "Nord", previewColors: ["#2e3440", "#88c0d0", "#bf616a", "#a3be8c", "#b48ead"] },
  { id: "solarized-dark", name: "Solarized Dark", previewColors: ["#002b36", "#2aa198", "#dc322f", "#859900", "#268bd2"] },
  { id: "catppuccin-mocha", name: "Catppuccin Mocha", previewColors: ["#1e1e2e", "#cba6f7", "#f38ba8", "#a6e3a1", "#89b4fa"] },
  { id: "tokyo-night", name: "Tokyo Night", previewColors: ["#1a1b26", "#7aa2f7", "#f7768e", "#9ece6a", "#bb9af7"] },
  { id: "gruvbox-dark", name: "Gruvbox Dark", previewColors: ["#282828", "#fe8019", "#fb4934", "#b8bb26", "#83a598"] },
  { id: "github-dark", name: "GitHub Dark", previewColors: ["#0d1117", "#58a6ff", "#f85149", "#3fb950", "#bc8cff"] },
  { id: "rose-pine", name: "Rose Pine", previewColors: ["#191724", "#ebbcba", "#eb6f92", "#9ccfd8", "#c4a7e7"] },
];
