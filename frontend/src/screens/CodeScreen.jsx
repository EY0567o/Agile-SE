// ═══════════════════════════════════════════════════════════════
//  CodeScreen.jsx – "Trainingsraum" (Frei-Übungs-Modus)
// ═══════════════════════════════════════════════════════════════
//  Im Gegensatz zu LearnScreen gibt es hier KEINE feste Aufgabe.
//  Der User kann beliebigen Java-Code schreiben, ausführen lassen
//  und mit dem Bot über seinen Code reden. Gut zum freien
//  Experimentieren ohne Lernpfad-Druck.
//
//  Aufbau (zweispaltig):
//   - LINKS  : CodeEditor (Monaco, Java) + Output-Panel unten
//   - RECHTS : ChatPanel (KI-Chat mit Code-Kontext)
//
//  Ablauf "Run":
//   1. setRunning(true) → Button zeigt ⏳, Editor disabled UI
//   2. POST /api/run mit { code }
//   3. Backend kompiliert + führt aus → { success, output, phase }
//   4. Output unten im Panel anzeigen (grüner oder roter Rahmen)
//
//  Props:
//   - onBack         : zurück zum StartScreen
//   - theme/onToggle : Dark/Light-Steuerung (für ThemeToggle)
//   - token          : Auth-Token für API-Calls
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import CodeEditor from "../components/CodeEditor";
import ChatPanel from "../components/ChatPanel";
import ThemeToggle from "../components/ThemeToggle";
import useApi from "../hooks/useApi";

// Default-Code beim ersten Öffnen – minimales lauffähiges Java-Programm
const INITIAL_CODE = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello CodeBuddy!");
    }
}`;

export default function CodeScreen({ onBack, theme, onToggleTheme, token }) {
  const apiFetch = useApi(token);
  const [code, setCode] = useState(INITIAL_CODE);
  // output-Struktur: { success: bool, output: string, phase: "compile"|"run" }
  // null = noch nichts ausgeführt → Panel wird nicht gerendert
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);

  // runCode: schickt den Code an /api/run und zeigt das Ergebnis an.
  // Das Backend (server.js) macht: javac → java, mit Timeout & tmp-Dir.
  const runCode = async () => {
    setRunning(true);
    setOutput(null);  // Alte Ausgabe wegblenden, damit klar ist, dass neu läuft
    try {
      const res = await apiFetch("/api/run", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Ausführen.");
      setOutput(data);
    } catch (err) {
      // Netzwerk- oder Server-Fehler als "Run-Fehler" anzeigen
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
      {/* ─── Header (Zurück | Titel | Theme) ─── */}
      <div style={{
        display: "flex", alignItems: "center", padding: "0 24px",
        height: 56,
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-header)",
        flexShrink: 0,
      }}>
        {/* Zurück-Button mit eigenem Logo */}
        <button onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          color: "var(--text-secondary)", cursor: "pointer",
          fontSize: "var(--fs-body)", padding: "7px 14px", borderRadius: "var(--radius-sm)",
          transition: "all 0.2s", fontWeight: 600,
        }}
          // Hover-Effekt: Text + Border bekommen Accent-Farbe
          onMouseEnter={(e) => { e.target.style.color = "var(--accent)"; e.target.style.borderColor = "var(--border-accent)"; }}
          onMouseLeave={(e) => { e.target.style.color = "var(--text-secondary)"; e.target.style.borderColor = "var(--border)"; }}
        >
          <img
            src="/logo_Zurück.png"
            alt="Zurück Logo"
            style={{ width: 28, height: 28, objectFit: "contain" }}
          />
          Zurück
        </button>
        <div style={{
          flex: 1, textAlign: "center", color: "var(--text-secondary)",
          fontSize: "var(--fs-body-lg)", fontWeight: 700, letterSpacing: 0.1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          Trainingsraum – Übung macht den Meister
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      {/* ─── Hauptbereich (Editor links, Chat rechts) ─── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* LINKS: Editor + Output-Panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, gap: 8 }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            {/* CodeEditor bekommt onRun → zeigt automatisch den ▶-Button */}
            <CodeEditor code={code} onChange={setCode} onRun={runCode} running={running} />
          </div>

          {/* Output-Panel (nur sichtbar nach erstem Run) */}
          {output !== null && (
            <div style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-card)",
              // Roter Rahmen bei Fehler, sonst neutral
              border: `1px solid ${output.success ? "var(--border)" : "rgba(239,68,68,0.3)"}`,
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-caption)",
              color: output.success ? "var(--text-primary)" : "#ef4444",
              whiteSpace: "pre-wrap",
              maxHeight: 160,
              overflowY: "auto",
              animation: "fadeIn 0.2s ease",
            }}>
              {/* Status-Label oben (Ausgabe / Kompilierfehler / Laufzeitfehler) */}
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

        {/* Vertikaler Trenner zwischen Editor und Chat */}
        <div style={{ width: 1, background: "var(--border)" }} />

        {/* RECHTS: Chat (fixer 400px Spalte) */}
        <div style={{ width: 400, flexShrink: 0 }}>
          <ChatPanel
            code={code}
            // Im Free-Modus gibt es keine Aufgabe → nur generische Begrüßung
            greeting="Hey! Füge deinen Java-Code links ein und ich erkläre ihn dir. Was möchtest du wissen?"
            token={token}
          />
        </div>
      </div>
    </div>
  );
}
