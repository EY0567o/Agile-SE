import { useRef } from "react";
import highlightJava from "../utils/highlightJava";

export default function CodeEditor({ code, onChange, readOnly = false, onRun, running, extraButton }) {
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);

  const syncScroll = () => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const lines = (code || "").split("\n");

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
      <div style={{ display: "flex", height: "100%" }}>
        {/* Zeilennummern */}
        <div style={{
          padding: "16px 0",
          minWidth: 48,
          textAlign: "right",
          color: "var(--text-muted)",
          fontSize: 13,
          fontFamily: "var(--font-mono)",
          lineHeight: "1.7",
          userSelect: "none",
          borderRight: "1px solid var(--border)",
          background: "var(--editor-line-bg)",
          paddingRight: 12,
        }}>
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code-Bereich */}
        <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
          <pre
            ref={highlightRef}
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              margin: 0,
              padding: "16px 16px",
              fontSize: 14,
              fontFamily: "var(--font-mono)",
              lineHeight: "1.7",
              color: "var(--editor-text)",
              overflow: "auto",
              whiteSpace: "pre",
              pointerEvents: "none",
            }}
            dangerouslySetInnerHTML={{ __html: highlightJava(code) + "\n" }}
          />
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={syncScroll}
            readOnly={readOnly}
            spellCheck={false}
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              width: "100%",
              height: "100%",
              margin: 0,
              padding: "16px 16px",
              fontSize: 14,
              fontFamily: "var(--font-mono)",
              lineHeight: "1.7",
              color: "transparent",
              caretColor: "var(--accent)",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              overflow: "auto",
              whiteSpace: "pre",
            }}
          />
        </div>
      </div>

      {/* Top-right buttons */}
      {(onRun || extraButton) && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          display: "flex", gap: 6, zIndex: 2,
        }}>
          {extraButton}
          {onRun && (
            <button onClick={onRun} disabled={running} title="Code ausführen" style={{
              width: 32, height: 32, borderRadius: 8,
              background: running ? "var(--bg-card)" : "var(--accent-gradient)",
              border: "1px solid var(--border-accent)",
              color: running ? "var(--text-muted)" : "#fff",
              fontSize: 14, cursor: running ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
              opacity: running ? 0.6 : 0.85,
            }}
              onMouseEnter={(e) => { if (!running) e.target.style.opacity = "1"; }}
              onMouseLeave={(e) => { if (!running) e.target.style.opacity = "0.85"; }}
            >
              {running ? "⏳" : "▶"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
