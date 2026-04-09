import { useState } from "react";
import CodeEditor from "../components/CodeEditor";
import ChatPanel from "../components/ChatPanel";
import ThemeToggle from "../components/ThemeToggle";
import useApi from "../hooks/useApi";

const INITIAL_CODE = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello CodeBuddy!");
    }
}`;

export default function CodeScreen({ onBack, theme, onToggleTheme, token }) {
  const apiFetch = useApi(token);
  const [code, setCode] = useState(INITIAL_CODE);
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);

  const runCode = async () => {
    setRunning(true);
    setOutput(null);
    try {
      const res = await apiFetch("/api/run", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Ausführen.");
      setOutput(data);
    } catch (err) {
      setOutput({
        success: false,
        output: err.message || "Verbindung zum Server fehlgeschlagen.",
        phase: "run",
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", padding: "0 24px",
        height: 56,
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-header)",
        flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          color: "var(--text-secondary)", cursor: "pointer",
          fontSize: 13, padding: "6px 14px", borderRadius: "var(--radius-sm)",
          transition: "all 0.2s", fontWeight: 500,
        }}
          onMouseEnter={(e) => { e.target.style.color = "var(--accent)"; e.target.style.borderColor = "var(--border-accent)"; }}
          onMouseLeave={(e) => { e.target.style.color = "var(--text-secondary)"; e.target.style.borderColor = "var(--border)"; }}
        >← Zurück</button>
        <div style={{
          flex: 1, textAlign: "center", color: "var(--text-secondary)",
          fontSize: 14, fontWeight: 600, letterSpacing: 0.3,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          Trainingsraum – Übung macht den Meister
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      {/* Main */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Editor + Output */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, gap: 8 }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <CodeEditor code={code} onChange={setCode} onRun={runCode} running={running} />
          </div>

          {/* Ausgabe */}
          {output !== null && (
            <div style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-card)",
              border: `1px solid ${output.success ? "var(--border)" : "rgba(239,68,68,0.3)"}`,
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: output.success ? "var(--text-primary)" : "#ef4444",
              whiteSpace: "pre-wrap",
              maxHeight: 160,
              overflowY: "auto",
              animation: "fadeIn 0.2s ease",
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
                color: output.success ? "var(--success)" : "#ef4444",
                marginBottom: 6,
              }}>
                {output.success ? "Ausgabe" : output.phase === "compile" ? "Kompilierfehler" : "Laufzeitfehler"}
              </div>
              {output.output || "(keine Ausgabe)"}
            </div>
          )}
        </div>

        <div style={{ width: 1, background: "var(--border)" }} />

        {/* Chat */}
        <div style={{ width: 400, flexShrink: 0 }}>
          <ChatPanel
            code={code}
            greeting="Hey! Füge deinen Java-Code links ein und ich erkläre ihn dir. Was möchtest du wissen?"
            token={token}
          />
        </div>
      </div>
    </div>
  );
}
