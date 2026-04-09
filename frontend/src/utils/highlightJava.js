const JAVA_KEYWORDS = [
  "public", "private", "protected", "static", "void", "int", "String",
  "double", "float", "boolean", "char", "long", "short", "byte", "class",
  "new", "return", "if", "else", "for", "while", "do", "switch", "case",
  "break", "continue", "import", "package", "extends", "implements",
  "interface", "abstract", "final", "try", "catch", "throw", "throws",
  "this", "super", "null", "true", "false", "System",
];

const KEYWORD_SET = new Set(JAVA_KEYWORDS);

/**
 * Token-basiertes Java-Syntax-Highlighting.
 * Erzeugt HTML-String für die Overlay-Darstellung im Editor.
 *
 * Im Gegensatz zum alten Regex-Ansatz wird hier zuerst tokenisiert,
 * sodass Keywords innerhalb von Strings/Kommentaren nicht ersetzt werden.
 */
export default function highlightJava(code) {
  if (!code) return "";

  const tokens = tokenize(code);
  return tokens.map(renderToken).join("");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function tokenize(code) {
  const tokens = [];
  let i = 0;

  while (i < code.length) {
    // Single-line comment
    if (code[i] === "/" && code[i + 1] === "/") {
      const end = code.indexOf("\n", i);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end);
      tokens.push({ type: "comment", value: slice });
      i += slice.length;
      continue;
    }

    // Multi-line comment
    if (code[i] === "/" && code[i + 1] === "*") {
      const end = code.indexOf("*/", i + 2);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end + 2);
      tokens.push({ type: "comment", value: slice });
      i += slice.length;
      continue;
    }

    // String literal
    if (code[i] === '"') {
      let j = i + 1;
      while (j < code.length && code[j] !== '"') {
        if (code[j] === "\\") j++; // skip escaped char
        j++;
      }
      const slice = code.slice(i, j + 1);
      tokens.push({ type: "string", value: slice });
      i = j + 1;
      continue;
    }

    // Char literal
    if (code[i] === "'") {
      let j = i + 1;
      while (j < code.length && code[j] !== "'") {
        if (code[j] === "\\") j++;
        j++;
      }
      const slice = code.slice(i, j + 1);
      tokens.push({ type: "string", value: slice });
      i = j + 1;
      continue;
    }

    // Number
    if (/\d/.test(code[i]) && (i === 0 || !/\w/.test(code[i - 1]))) {
      let j = i;
      while (j < code.length && /[\d.]/.test(code[j])) j++;
      tokens.push({ type: "number", value: code.slice(i, j) });
      i = j;
      continue;
    }

    // Word (keyword or identifier)
    if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[\w$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      tokens.push({
        type: KEYWORD_SET.has(word) ? "keyword" : "plain",
        value: word,
      });
      i = j;
      continue;
    }

    // Other characters (operators, whitespace, braces, etc.)
    tokens.push({ type: "plain", value: code[i] });
    i++;
  }

  return tokens;
}

function renderToken(token) {
  const escaped = escapeHtml(token.value);
  switch (token.type) {
    case "keyword":
      return `<span style="color:#7eb8d4;font-weight:600">${escaped}</span>`;
    case "string":
      return `<span style="color:#e07b53">${escaped}</span>`;
    case "comment":
      return `<span style="color:#6b7280;font-style:italic">${escaped}</span>`;
    case "number":
      return `<span style="color:#d4976c">${escaped}</span>`;
    default:
      return escaped;
  }
}
