// ═══════════════════════════════════════════════════════════════
//  LearnScreen.jsx – "Lernpfad" mit 10 Aufgaben (Hauptlernmodus)
// ═══════════════════════════════════════════════════════════════
//  Zwei Sub-Ansichten in einer Komponente:
//   1) Pfad-Ansicht (selectedTask === null)
//      → Zeigt PathView (Zickzack-Liste aller Aufgaben + Progress)
//   2) Aufgaben-Ansicht (selectedTask = Index)
//      → Editor + Aufgabenbeschreibung links, Chat rechts
//
//  Persistenz:
//   - Pro User wird in der DB gespeichert: aktueller Code je Aufgabe
//     + ob bereits "solved". Beim Mount via /api/progress geladen.
//   - Auto-Save passiert: beim "Run", beim Verlassen der Aufgabe,
//     beim "Richtig gelöst"-Klick.
//
//  Freischalt-Logik:
//   - unlockedUpTo = Anzahl gelöster Aufgaben = Index der nächsten
//     freischaltbaren Aufgabe. Aufgabe 0..(unlockedUpTo-1) = gelöst,
//     Aufgabe unlockedUpTo = aktuelle, > unlockedUpTo = gesperrt.
//
//  Wichtig für ChatPanel:
//   - Wir geben taskId/Title/Description/Hint mit, damit der Bot
//     den Aufgabenkontext kennt (siehe System-Prompt in server.js).
//   - key={selectedTask} forciert einen Remount des ChatPanel beim
//     Aufgabenwechsel → frischer Verlauf, neue Begrüßung.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import CodeEditor from "../components/CodeEditor";
import ChatPanel from "../components/ChatPanel";
import ThemeToggle from "../components/ThemeToggle";
import PathView from "../components/PathView";
import TASKS from "../data/tasks";
import useApi from "../hooks/useApi";

export default function LearnScreen({ onBack, theme, onToggleTheme, token }) {
  const apiFetch = useApi(token);

  // Welcher Task ist gerade geöffnet? null = Pfad-Ansicht
  const [selectedTask, setSelectedTask] = useState(null);
  // Anzahl gelöster Aufgaben (gleich Index der nächsten offenen Aufgabe)
  const [unlockedUpTo, setUnlockedUpTo] = useState(0);
  // Code-Stand pro Aufgabe (Array, parallel zu TASKS). Anfangs der Starter-Code.
  const [codes, setCodes] = useState(TASKS.map((t) => t.starter));
  // Triggert die Animation am "Richtig gelöst"-Button
  const [completedAnim, setCompletedAnim] = useState(false);
  // Letztes Run-Ergebnis: { success, output, phase }
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  // loaded=false → "wird geladen..." Splash; verhindert Flackern
  const [loaded, setLoaded] = useState(false);
  // Steuert den ausklappbaren "💡 Konzept"-Block in der Aufgaben-Ansicht.
  // Default closed → die Erklärung drängt sich nicht auf, ist aber 1 Klick weit weg.
  const [conceptOpen, setConceptOpen] = useState(false);

  // ─── Fortschritt vom Backend laden (einmalig beim Mount) ───
  // Antwort-Form: { progress: [ { taskId, code, solved }, ... ] }
  useEffect(() => {
    apiFetch("/api/progress").then(r => r.json()).then(data => {
      if (data.progress) {
        // Starter-Code als Basis, dann mit gespeicherten Codes überschreiben
        const newCodes = [...TASKS.map(t => t.starter)];
        let solved = 0;
        data.progress.forEach(p => {
          const idx = p.taskId - 1; // taskId ist 1-basiert, Array 0-basiert
          if (idx >= 0 && idx < newCodes.length) {
            if (p.code) newCodes[idx] = p.code;
            // unlockedUpTo = höchste gelöste taskId (1-basiert ≙ index+1)
            if (p.solved) solved = Math.max(solved, p.taskId);
          }
        });
        setCodes(newCodes);
        setUnlockedUpTo(solved);
      }
      setLoaded(true);
    }).catch(() => setLoaded(true)); // bei Netzfehler trotzdem weiter mit Defaults
  }, []);

  // saveProgress: Code (und optional solved-Flag) für eine Aufgabe sichern.
  // Fire-and-forget: Fehler werden geschluckt, da nicht kritisch.
  const saveProgress = (taskIdx, code, solved = false) => {
    const taskId = taskIdx + 1; // wieder in 1-basiert für die API
    apiFetch(`/api/progress/${taskId}`, {
      method: "POST",
      body: JSON.stringify({ code, solved }),
    }).catch(() => {});
  };

  // runCode: Code der aktuellen Aufgabe ausführen + Ergebnis anzeigen.
  // Speichert vorher den Code-Stand (damit ein Server-Crash nichts kostet).
  const runCode = async () => {
    setRunning(true);
    setOutput(null);
    saveProgress(selectedTask, codes[selectedTask]);
    try {
      const res = await apiFetch("/api/run", {
        method: "POST",
        body: JSON.stringify({ code: codes[selectedTask] }),
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

  // Berechnete Hilfswerte für UI
  const progress = (unlockedUpTo / TASKS.length) * 100;
  const allDone = unlockedUpTo >= TASKS.length;

  // handleBack: Aus Aufgabe → zurück zum Pfad. Aus Pfad → zurück zum StartScreen.
  const handleBack = () => {
    if (selectedTask !== null) {
      saveProgress(selectedTask, codes[selectedTask]); // Stand sichern
      setSelectedTask(null);
    } else {
      onBack();
    }
  };

  // openTask: Aus dem Pfad eine Aufgabe öffnen
  const openTask = (index) => {
    setSelectedTask(index);
    setOutput(null);     // alte Ausgabe von vorheriger Aufgabe entfernen
    setConceptOpen(false); // Konzept-Block beim Wechsel wieder schließen
  };

  // markSolved: User klickt "Richtig gelöst" → speichern, animieren,
  // freischalten (falls aktuell), zurück zum Pfad.
    const markSolved = () => {
    // Guard: während der Animation läuft, darf markSolved nicht
    // erneut starten – sonst schaltet ein zweiter Klick auf den
    // "✓ Weiter!"-Button eine zusätzliche Aufgabe frei.
    if (completedAnim) return;
    setCompletedAnim(true);
    saveProgress(selectedTask, codes[selectedTask], true);
    setTimeout(() => {
      setCompletedAnim(false);
      if (selectedTask === unlockedUpTo) {
        setUnlockedUpTo((u) => u + 1);
      }
      setSelectedTask(null);
    }, 600);
  };

  // ─── Loading-Splash bevor /api/progress da ist ───
  if (!loaded) {
    return (
      <div style={{
        height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-muted)", fontSize: "var(--fs-body-lg)",
      }}>
        Fortschritt wird geladen...
      </div>
    );
  }

  // ─── ANSICHT 1: Pfad-Ansicht (keine Aufgabe ausgewählt) ───
  if (selectedTask === null) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        {/* Header: Zurück | "Lernpfad" (absolut zentriert) | Progress-Bar + Theme */}
        <div style={{
          display: "flex", alignItems: "center", padding: "0 24px",
          height: 56,
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-header)",
          flexShrink: 0,
          position: "relative",
        }}>
          <button onClick={onBack} style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--bg-card)", border: "1px solid var(--border)",
            color: "var(--text-secondary)", cursor: "pointer",
            fontSize: "var(--fs-body)", padding: "7px 14px", borderRadius: "var(--radius-sm)",
            transition: "all 0.2s", fontWeight: 600,
          }}
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
          {/* Absolut zentrierter Titel – auf Viewport-Mitte, unabhängig von linker/rechter Spalte */}
          <div style={{
            position: "absolute", left: "50%", transform: "translateX(-50%)",
            color: "var(--text-secondary)",
            fontSize: "var(--fs-body-lg)", fontWeight: 700, letterSpacing: 0.1,
            pointerEvents: "none",
          }}>
            Lernpfad
          </div>
          {/* Rechts: Progress-Bar (gelöste/gesamt) + Theme-Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
            <div style={{
              width: 80, height: 4, borderRadius: 2,
              background: "var(--border)", overflow: "hidden",
            }}>
              <div style={{
                width: `${progress}%`, height: "100%", borderRadius: 2,
                background: "linear-gradient(90deg, var(--accent), var(--success))",
                transition: "width 0.5s ease",
              }} />
            </div>
            <span style={{
              color: "var(--text-muted)", fontSize: "var(--fs-caption)", fontWeight: 700,
              minWidth: 35, textAlign: "right",
            }}>{unlockedUpTo}/10</span>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>

        {/* Content: entweder Glückwunsch (alle gelöst) oder PathView */}
        {allDone ? (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", padding: 40,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 56, marginBottom: 24 }}>🎉</div>
            <h2 style={{ color: "var(--text-primary)", fontSize: 30, margin: "0 0 10px", fontWeight: 800, letterSpacing: "var(--tracking-title)" }}>
              Alle 10 Aufgaben geschafft!
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-lg)", lineHeight: "var(--lh-copy)" }}>
              Weitere Aufgaben folgen bald – to be continued…
            </p>
          </div>
        ) : (
          <PathView unlockedUpTo={unlockedUpTo} onSelect={openTask} />
        )}
      </div>
    );
  }

  // ─── ANSICHT 2: Aufgaben-Ansicht (eine Aufgabe ist offen) ───
  const task = TASKS[selectedTask];
  const isCompleted = selectedTask < unlockedUpTo; // wurde diese schon mal gelöst?

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header: "Lernpfad" (= zurück) | Aufgaben-Titel (absolut zentriert) | Theme */}
      <div style={{
        display: "flex", alignItems: "center", padding: "0 24px",
        height: 56,
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-header)",
        flexShrink: 0,
        position: "relative",
      }}>
        <button onClick={handleBack} style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          color: "var(--text-secondary)", cursor: "pointer",
          fontSize: "var(--fs-body)", padding: "7px 14px", borderRadius: "var(--radius-sm)",
          transition: "all 0.2s", fontWeight: 600,
        }}
          onMouseEnter={(e) => { e.target.style.color = "var(--accent)"; e.target.style.borderColor = "var(--border-accent)"; }}
          onMouseLeave={(e) => { e.target.style.color = "var(--text-secondary)"; e.target.style.borderColor = "var(--border)"; }}
        >
          <img
            src="/logo_Zurück.png"
            alt="Zurück Logo"
            style={{ width: 28, height: 28, objectFit: "contain" }}
          />
          Lernpfad
        </button>
        {/* Absolut zentrierter Titel: zeigt im Page-Header nur "Aufgabe X".
            Der konkrete Aufgaben-Name (z.B. "Hello World") steht im Balken
            darunter prominent neben der Beschreibung. */}
        <div style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          color: "var(--text-secondary)",
          fontSize: "var(--fs-body-lg)", fontWeight: 700, letterSpacing: 0.1,
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}>
          Aufgabe {task.id}
        </div>
        <div style={{ marginLeft: "auto" }}>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>

      {/* Content: Aufgabentext + Editor links, Chat rechts */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Aufgaben-Balken direkt unter dem Header:
              - Links: Aufgaben-Titel (groß) + Beschreibung (klein, eine Zeile darunter)
              - Rechts: "✓ Gelöst" / "Offen"-Marker + Konzept-Button mit 💡
              Der Konzept-Button schaltet den ausklappbaren Erklär-Block darunter um. */}
          <div style={{
            padding: "14px 22px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-card)",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}>
            {/* Links: Titel + Beschreibung untereinander */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                color: "var(--text-primary)",
                fontSize: "var(--fs-title-sm)",
                fontWeight: 700,
                margin: "0 0 4px",
                letterSpacing: "var(--tracking-tight)",
              }}>
                {task.title}
              </h3>
              {task.description && (
                <p style={{
                  color: "var(--text-secondary)",
                  fontSize: "var(--fs-caption)",
                  margin: 0,
                  lineHeight: "var(--lh-copy)",
                }}>
                  {task.description}
                </p>
              )}
            </div>

            {/* Rechts: Gelöst-Status + Konzept-Button */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                color: isCompleted ? "var(--success)" : "var(--text-muted)",
                fontSize: "var(--fs-caption)",
                fontWeight: 700,
                letterSpacing: 0.3,
                padding: "5px 10px",
                borderRadius: "var(--radius-sm)",
                border: `1px solid ${isCompleted ? "rgba(74,222,128,0.3)" : "var(--border)"}`,
                background: isCompleted ? "rgba(74,222,128,0.08)" : "transparent",
              }}>
                {isCompleted ? "✓ Gelöst" : "Offen"}
              </span>

              {task.explanation && (
                <button
                  onClick={() => setConceptOpen(!conceptOpen)}
                  title={conceptOpen ? "Konzept ausblenden" : "Konzept anzeigen"}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: conceptOpen ? "var(--accent-glow)" : "transparent",
                    border: `1px solid ${conceptOpen ? "var(--border-accent)" : "var(--border)"}`,
                    color: conceptOpen ? "var(--accent)" : "var(--text-secondary)",
                    fontSize: "var(--fs-caption)",
                    padding: "5px 11px",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "color 0.15s, border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!conceptOpen) {
                      e.currentTarget.style.color = "var(--accent)";
                      e.currentTarget.style.borderColor = "var(--border-accent)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!conceptOpen) {
                      e.currentTarget.style.color = "var(--text-secondary)";
                      e.currentTarget.style.borderColor = "var(--border)";
                    }
                  }}
                >
                  <span>💡</span>
                  <span>Konzept</span>
                </button>
              )}
            </div>
          </div>

          {/* Ausklappbarer Konzept-Block: erscheint nur nach Klick auf 💡 Konzept.
              Enthält die didaktische Erklärung (task.explanation), gut lesbar
              gesetzt. Aufgabentext steht oben im Balken bereits sichtbar. */}
          {conceptOpen && task.explanation && (
            <div style={{
              padding: "14px 22px 16px",
              background: "var(--bg-primary)",
              borderBottom: "1px solid var(--border)",
              animation: "fadeIn 0.2s ease",
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: 6,
              }}>
                💡 Konzept
              </div>
              <p style={{
                color: "var(--text-primary)",
                fontSize: "var(--fs-body)",
                margin: 0,
                lineHeight: "var(--lh-copy)",
              }}>
                {task.explanation}
              </p>
            </div>
          )}

          {/* Editor + Output-Panel */}
          <div style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
            <div style={{ flex: 1, minHeight: 0 }}>
              <CodeEditor
                code={codes[selectedTask]}
                // Code-Änderung: nur diesen Slot im codes-Array updaten
                onChange={(val) => {
                  const next = [...codes];
                  next[selectedTask] = val;
                  setCodes(next);
                }}
                onRun={runCode}
                running={running}
                // extraButton wird im CodeEditor neben dem Run-Button gerendert
                extraButton={
                  <button onClick={markSolved} title="Als gelöst markieren" style={{
                    height: 34, padding: "0 14px", borderRadius: 10,
                    // Während Anim grüner Verlauf, sonst Standard-Accent
                    background: completedAnim
                      ? "linear-gradient(135deg, var(--success), #22c55e)"
                      : "var(--accent-gradient)",
                    border: "none",
                    color: "#fff",
                    fontSize: "var(--fs-label)", fontWeight: 700, cursor: "pointer",
                    transition: "all 0.3s",
                    transform: completedAnim ? "scale(1.05)" : "none",
                    opacity: 0.9,
                    letterSpacing: 0.35,
                  }}>
                    {completedAnim ? "✓ Weiter!" : "Richtig gelöst ✓"}
                  </button>
                }
              />
            </div>

            {/* Output-Panel (gleiche Struktur wie in CodeScreen) */}
            {output !== null && (
              <div style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-card)",
                border: `1px solid ${output.success ? "var(--border)" : "rgba(239,68,68,0.3)"}`,
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-caption)",
                color: output.success ? "var(--text-primary)" : "#ef4444",
                whiteSpace: "pre-wrap",
                maxHeight: 140,
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

        </div>

        {/* Vertikaler Trenner */}
        <div style={{ width: 1, background: "var(--border)" }} />

        {/* Chat-Spalte (mit vollem Aufgaben-Kontext für die KI) */}
        <div style={{ width: 360, flexShrink: 0 }}>
          <ChatPanel
            code={codes[selectedTask]}
            greeting={`Hi! Ich helfe dir bei Aufgabe "${task.title}". Probier es erst selbst – wenn du nicht weiterkommst, frag mich!`}
            // key=index → Komponente wird beim Aufgabenwechsel komplett
            // neu gemountet → frischer Verlauf, neue Begrüßung
            key={selectedTask}
            token={token}
            taskId={task.id}
            taskTitle={task.title}
            taskDescription={task.description}
            taskHint={task.hint}
            errorOutput={output && !output.success ? output.output : null}
          />
        </div>
      </div>
    </div>
  );
}
