import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import kotlin from "highlight.js/lib/languages/kotlin";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import swift from "highlight.js/lib/languages/swift";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
// @ts-expect-error -- no type declarations for this CJS module
import { solidity } from "highlightjs-solidity";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("c", c);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("css", css);
hljs.registerLanguage("go", go);
hljs.registerLanguage("java", java);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("kotlin", kotlin);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("python", python);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("swift", swift);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("solidity", solidity);

const EXT_MAP: Record<string, string> = {
  ".js": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".jsx": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".py": "python",
  ".rb": "ruby",
  ".rs": "rust",
  ".go": "go",
  ".java": "java",
  ".kt": "kotlin",
  ".kts": "kotlin",
  ".swift": "swift",
  ".c": "c",
  ".h": "c",
  ".cpp": "cpp",
  ".cc": "cpp",
  ".cxx": "cpp",
  ".hpp": "cpp",
  ".json": "json",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".toml": "yaml",
  ".xml": "xml",
  ".html": "xml",
  ".htm": "xml",
  ".svg": "xml",
  ".css": "css",
  ".scss": "css",
  ".less": "css",
  ".sh": "bash",
  ".bash": "bash",
  ".zsh": "bash",
  ".md": "markdown",
  ".mdx": "markdown",
  ".sql": "sql",
  ".sol": "solidity",
};

export function detectLanguage(filePath: string): string | undefined {
  const dotIdx = filePath.lastIndexOf(".");
  if (dotIdx === -1) return undefined;
  const ext = filePath.substring(dotIdx).toLowerCase();
  return EXT_MAP[ext];
}

/** Maps hljs token class names to xterm theme color keys */
export type SyntaxColorMap = Record<string, string>;

export function buildColorMap(xtermTheme: {
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
}): SyntaxColorMap {
  return {
    "hljs-keyword": xtermTheme.magenta,
    "hljs-selector-tag": xtermTheme.magenta,
    "hljs-built_in": xtermTheme.cyan,
    "hljs-type": xtermTheme.yellow,
    "hljs-literal": xtermTheme.brightYellow,
    "hljs-number": xtermTheme.yellow,
    "hljs-operator": xtermTheme.magenta,
    "hljs-punctuation": xtermTheme.white,
    "hljs-property": xtermTheme.cyan,
    "hljs-regexp": xtermTheme.brightRed,
    "hljs-string": xtermTheme.green,
    "hljs-char.escape": xtermTheme.brightYellow,
    "hljs-subst": xtermTheme.red,
    "hljs-symbol": xtermTheme.red,
    "hljs-variable": xtermTheme.red,
    "hljs-template-variable": xtermTheme.red,
    "hljs-link": xtermTheme.cyan,
    "hljs-selector-id": xtermTheme.brightYellow,
    "hljs-selector-class": xtermTheme.brightYellow,
    "hljs-comment": xtermTheme.brightBlack,
    "hljs-quote": xtermTheme.brightBlack,
    "hljs-doctag": xtermTheme.brightCyan,
    "hljs-title": xtermTheme.blue,
    "hljs-section": xtermTheme.blue,
    "hljs-name": xtermTheme.red,
    "hljs-tag": xtermTheme.red,
    "hljs-attr": xtermTheme.yellow,
    "hljs-attribute": xtermTheme.yellow,
    "hljs-meta": xtermTheme.brightMagenta,
    "hljs-meta keyword": xtermTheme.brightMagenta,
    "hljs-meta string": xtermTheme.green,
    "hljs-addition": xtermTheme.green,
    "hljs-deletion": xtermTheme.red,
    "hljs-params": xtermTheme.brightBlue,
  };
}

/**
 * Highlights a line of code and returns HTML with inline styles.
 * Uses inline styles to avoid CSS specificity issues with existing diff styling.
 */
export function highlightLine(code: string, language: string, colorMap: SyntaxColorMap): string {
  try {
    const result = hljs.highlight(code, { language, ignoreIllegals: true });
    return applyInlineColors(result.value, colorMap);
  } catch {
    return escapeHtml(code);
  }
}

/** Converts hljs class-based spans to inline-styled spans */
function applyInlineColors(html: string, colorMap: SyntaxColorMap): string {
  return html.replace(/class="([^"]+)"/g, (original, classes: string) => {
    // hljs can produce multiple classes like "hljs-title function_"
    // Try the full class string first, then individual classes
    for (const cls of classes.split(" ")) {
      const color = colorMap[cls];
      if (color) return `style="color:${color}"`;
    }
    // Try the combined form (e.g., "hljs-title function_" → "hljs-title")
    const primary = classes.split(" ")[0];
    const color = colorMap[primary];
    if (color) return `style="color:${color}"`;
    return original;
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
