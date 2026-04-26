import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";

// ─── Theme-Definitionen ─────────────────────────────────────────
function defineThemes(monaco) {
  // Dark-Theme (Standard)
  monaco.editor.defineTheme("codebuddy-dark", {
    base: "vs-dark",
    //Alles was nicht definiert von Basis-Theme übernehmen
    inherit: true,
    rules: [
      { token: "keyword",    foreground: "7eb8d4", fontStyle: "bold" },
      { token: "type",       foreground: "60a5fa" },
      { token: "string",     foreground: "4ade80" },
      { token: "number",     foreground: "fbbf24" },
      { token: "comment",    foreground: "64748b", fontStyle: "italic" },
      { token: "identifier", foreground: "e2e8f0" },
    ],
    colors: {
      "editor.background":                   "#0d1117",
      "editor.foreground":                   "#e2e8f0",
      "editorLineNumber.foreground":         "#475569",
      "editorLineNumber.activeForeground":   "#7eb8d4",
      "editor.lineHighlightBackground":      "#1e293b40",
      "editor.selectionBackground":          "#7eb8d440",
      "editorCursor.foreground":             "#7eb8d4",
      "editorIndentGuide.background1":       "#1e293b",
    },
  });

  // Light-Theme (für User, die helle UIs bevorzugen)
  monaco.editor.defineTheme("codebuddy-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "1e6b8a", fontStyle: "bold" },
      { token: "type",    foreground: "2d8fb3" },
      { token: "string",  foreground: "16a34a" },
      { token: "number",  foreground: "ca8a04" },
      { token: "comment", foreground: "64748b", fontStyle: "italic" },
    ],
    colors: {
      "editor.background":                 "#f1f5f9",
      "editor.foreground":                 "#1e293b",
      "editorLineNumber.foreground":       "#94a3b8",
      "editorLineNumber.activeForeground": "#1e6b8a",
    },
  });
}

// ─── Props ──────────────────────────────────────────────────────
//   code        : der anzuzeigende Code-String (controlled input)
//   onChange    : callback bei jeder Änderung
//   readOnly    : schaltet Editieren ab (wir nutzen das aktuell nicht)
//   onRun       : wenn gesetzt, wird oben rechts ein Run-Button gerendert
//   running     : True während Java ausgeführt wird (Button disabled)
//   extraButton : optional ein zusätzlicher Button (z.B. "Richtig gelöst")
export default function CodeEditor({ code, onChange, readOnly = false, onRun, running, extraButton }) {
  // In HTML wird es einfach genommen
  const [theme, setTheme] = useState(
    typeof document !== "undefined"
      ? document.documentElement.getAttribute("data-theme") || "dark"
      : "dark"
  );

  // MutationObserver lauscht auf data-theme-Änderungen auf <html>.
  // Sobald der User auf den ThemeToggle klickt, ändert App.jsx das
  // Attribut → dieser Observer feuert → setTheme() → Monaco lädt das
  // passende Theme neu.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") || "dark");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // onMount wird von Monaco einmalig aufgerufen, sobald der Editor
  // bereit ist. Wir nutzen das, um unsere Themes zu registrieren.
  const handleMount = (_editor, monaco) => {
    defineThemes(monaco);
    monaco.editor.setTheme(theme === "light" ? "codebuddy-light" : "codebuddy-dark");
  };

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100%",
      borderRadius: "var(--radius-md)",
      overflow: "hidden",
      background: "var(--bg-editor)",
      border: "1px solid var(--border)",
    }}>
      {/* Der eigentliche Monaco-Editor */}
      <Editor
        height="100%"
        width="100%"
        defaultLanguage="java"
        value={code}
        //CodeEditor gibt den neuen Code nach oben weiter:
        onChange={(value) => onChange(value || "")}
        onMount={handleMount}
        theme={theme === "light" ? "codebuddy-light" : "codebuddy-dark"}
        options={{
          readOnly,
          fontSize: 14,
          fontFamily: "JetBrains Mono, Consolas, monospace",
          lineHeight: 1.7,
          minimap: { enabled: false },               // Mini-Map rechts wäre störend bei kurzen Snippets
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          lineNumbers: "on",
          tabSize: 2,
          insertSpaces: true,                         // Spaces statt Tabs
          automaticLayout: true,                      // reagiert auf Container-Resize
          wordWrap: "off",
          smoothScrolling: true,
          cursorBlinking: "smooth",
          renderLineHighlight: "line",
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          // ─── Lern-freundlich: IDE-Features deaktivieren ───
          // Begründung: Anfänger sollen Syntax aktiv erlernen,
          // nicht Auto-Complete nutzen. Didaktisches Ziel > Komfort.
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          parameterHints: { enabled: false },
          folding: false,
          contextmenu: false,
        }}
      />

      {/* Run-Button + optionaler Extra-Button oben rechts */}
      {(onRun || extraButton) && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          display: "flex", gap: 8, zIndex: 2,
        }}>
          {extraButton}
          {onRun && (
            <button onClick={onRun} disabled={running} title="Code ausführen" style={{
              width: 36, height: 36, borderRadius: 10,
              background: running ? "var(--bg-card)" : "var(--accent-gradient)",
              border: "1px solid var(--border-accent)",
              color: running ? "var(--text-muted)" : "#fff",
              fontSize: 15, cursor: running ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
              opacity: running ? 0.6 : 0.9,
            }}
              onMouseEnter={(e) => { if (!running) e.target.style.opacity = "1"; }}
              onMouseLeave={(e) => { if (!running) e.target.style.opacity = "0.9"; }}
            >
              {running ? "⏳" : "▶"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
