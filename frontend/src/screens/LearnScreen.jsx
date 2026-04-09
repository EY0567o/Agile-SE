import { useState, useEffect } from "react";
import CodeEditor from "../components/CodeEditor";
import ChatPanel from "../components/ChatPanel";
import ThemeToggle from "../components/ThemeToggle";
import PathView from "../components/PathView";
import TASKS from "../data/tasks";
import useApi from "../hooks/useApi";

export default function LearnScreen({ onBack, theme, onToggleTheme, token }) {
  const apiFetch = useApi(token);
  const [selectedTask, setSelectedTask] = useState(null);
  const [unlockedUpTo, setUnlockedUpTo] = useState(0);
  const [codes, setCodes] = useState(TASKS.map((t) => t.starter));
  const [completedAnim, setCompletedAnim] = useState(false);
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Fortschritt vom Server laden
  useEffect(() => {
    apiFetch("/api/progress").then(r => r.json()).then(data => {
      if (data.progress) {
        const newCodes = [...TASKS.map(t => t.starter)];
        let solved = 0;
        data.progress.forEach(p => {
          const idx = p.taskId - 1;
          if (idx >= 0 && idx < newCodes.length) {
            if (p.code) newCodes[idx] = p.code;
            if (p.solved) solved = Math.max(solved, p.taskId);
          }
        });
        setCodes(newCodes);
        setUnlockedUpTo(solved);
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  // Fortschritt speichern
  const saveProgress = (taskIdx, code, solved = false) => {
    const taskId = taskIdx + 1;
    apiFetch(`/api/progress/${taskId}`, {
      method: "POST",
      body: JSON.stringify({ code, solved }),
    }).catch(() => {});
  };

  const runCode = async () => {
    setRunning(true);
    setOutput(null);
    // Code beim Ausführen auto-speichern
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

  const progress = (unlockedUpTo / TASKS.length) * 100;
  const allDone = unlockedUpTo >= TASKS.length;

  const handleBack = () => {
    if (selectedTask !== null) {
      // Code speichern beim Verlassen
      saveProgress(selectedTask, codes[selectedTask]);
      setSelectedTask(null);
    } else {
      onBack();
    }
  };

  const openTask = (index) => {
    setSelectedTask(index);
    setOutput(null);
  };

  const markSolved = () => {
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

  if (!loaded) {
    return (
      <div style={{
        height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-muted)", fontSize: 14,
      }}>
        Fortschritt wird geladen...
      </div>
    );
  }

  // Pfad-Ansicht
  if (selectedTask === null) {
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
          }}>
            Lernpfad
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
              color: "var(--text-muted)", fontSize: 13, fontWeight: 600,
              minWidth: 35, textAlign: "right",
            }}>{unlockedUpTo}/10</span>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>

        {/* Pfad oder Fertig-Screen */}
        {allDone ? (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", padding: 40,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 56, marginBottom: 24 }}>🎉</div>
            <h2 style={{ color: "var(--text-primary)", fontSize: 28, margin: "0 0 10px", fontWeight: 700 }}>
              Alle 10 Aufgaben geschafft!
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6 }}>
              Weitere Aufgaben folgen bald – to be continued…
            </p>
          </div>
        ) : (
          <PathView unlockedUpTo={unlockedUpTo} onSelect={openTask} />
        )}
      </div>
    );
  }

  // Aufgaben-Ansicht
  const task = TASKS[selectedTask];
  const isCompleted = selectedTask < unlockedUpTo;

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
        <button onClick={handleBack} style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          color: "var(--text-secondary)", cursor: "pointer",
          fontSize: 13, padding: "6px 14px", borderRadius: "var(--radius-sm)",
          transition: "all 0.2s", fontWeight: 500,
        }}
          onMouseEnter={(e) => { e.target.style.color = "var(--accent)"; e.target.style.borderColor = "var(--border-accent)"; }}
          onMouseLeave={(e) => { e.target.style.color = "var(--text-secondary)"; e.target.style.borderColor = "var(--border)"; }}
        >← Lernpfad</button>
        <div style={{
          flex: 1, textAlign: "center", color: "var(--text-secondary)",
          fontSize: 14, fontWeight: 600, letterSpacing: 0.3,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <span style={{
            background: "var(--accent-glow)", color: "var(--accent)",
            padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700,
          }}>
            {task.id}/10
          </span>
          {task.title}
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Main area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Aufgabenbeschreibung */}
          <div style={{
            padding: "18px 22px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-card)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{
                background: "var(--accent-glow)", color: "var(--accent)",
                padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                letterSpacing: 0.5,
              }}>Aufgabe {task.id}</span>
              {isCompleted && (
                <span style={{
                  color: "var(--success)", fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  ✓ Gelöst
                </span>
              )}
            </div>
            <h3 style={{
              color: "var(--text-primary)", fontSize: 17, margin: "0 0 6px",
              fontWeight: 700, letterSpacing: -0.3,
            }}>
              {task.title}
            </h3>
            <p style={{
              color: "var(--text-secondary)", fontSize: 13, margin: 0, lineHeight: 1.6,
            }}>
              {task.description}
            </p>

          </div>

          {/* Editor */}
          <div style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
            <div style={{ flex: 1, minHeight: 0 }}>
              <CodeEditor
                code={codes[selectedTask]}
                onChange={(val) => {
                  const next = [...codes];
                  next[selectedTask] = val;
                  setCodes(next);
                }}
                onRun={runCode}
                running={running}
                extraButton={
                  <button onClick={markSolved} title="Als gelöst markieren" style={{
                    height: 32, padding: "0 14px", borderRadius: 8,
                    background: completedAnim
                      ? "linear-gradient(135deg, var(--success), #22c55e)"
                      : "var(--accent-gradient)",
                    border: "none",
                    color: "#fff",
                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                    transition: "all 0.3s",
                    transform: completedAnim ? "scale(1.05)" : "none",
                    opacity: 0.85,
                    letterSpacing: 0.3,
                  }}>
                    {completedAnim ? "✓ Weiter!" : "Richtig gelöst ✓"}
                  </button>
                }
              />
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

        <div style={{ width: 1, background: "var(--border)" }} />

        {/* Chat Panel */}
        <div style={{ width: 360, flexShrink: 0 }}>
          <ChatPanel
            code={codes[selectedTask]}
            greeting={`Hi! Ich helfe dir bei Aufgabe "${task.title}". Probier es erst selbst – wenn du nicht weiterkommst, frag mich!`}
            key={selectedTask}
            token={token}
            taskId={task.id}
          />
        </div>
      </div>
    </div>
  );
}
