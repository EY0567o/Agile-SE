// ═══════════════════════════════════════════════════════════════
//  PathView.jsx – Lernpfad als vertikale Zickzack-Liste
// ═══════════════════════════════════════════════════════════════
//  Stellt alle 10 Aufgaben aus tasks.js untereinander dar – inspiriert
//  von Duolingo's Lernpfad. Visuelle Logik:
//   - Erledigte Aufgaben: grüner Haken, weichgezeichnet
//   - Aktuelle Aufgabe (next): hervorgehoben mit "Starten →"
//   - Gesperrte Aufgaben: grau, mit 🔒, nicht klickbar
//   - Zickzack: jede 2. Aufgabe ist horizontal versetzt (-60 / +60)
//
//  Props:
//   - unlockedUpTo : Index der nächsten freigeschalteten Aufgabe
//                    (kommt von /api/progress, persistiert pro User)
//   - onSelect(idx): Callback beim Klick auf eine entsperrte Aufgabe
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import TASKS from "../data/tasks";

export default function PathView({ unlockedUpTo, onSelect }) {
  // Welcher Knoten wird gerade gehovered? (für Skalierungs-Effekt)
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{
      flex: 1,
      overflow: "auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "48px 24px 64px",
    }}>
      {/* Überschrift + Untertitel */}
      <h2 style={{
        color: "var(--text-primary)", fontSize: 24, fontWeight: 800,
        marginBottom: 8, letterSpacing: "var(--tracking-title)",
      }}>
        Java Grundlagen
      </h2>
      <p style={{
        color: "var(--text-secondary)", fontSize: "var(--fs-body-lg)", marginBottom: 40,
        lineHeight: "var(--lh-copy)", textAlign: "center", maxWidth: 360,
      }}>
        Arbeite dich durch alle 10 Aufgaben
      </p>

      {/* Pfad-Container: alle Knoten + Verbindungslinien */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        {TASKS.map((t, i) => {
          // Status pro Knoten berechnen
          const locked = i > unlockedUpTo;       // gesperrt = noch nicht freigeschaltet
          const done = i < unlockedUpTo;         // erledigt = liegt vor dem aktuellen
          const isNext = i === unlockedUpTo;     // aktuelle/nächste Aufgabe
          const isHovered = hovered === i && !locked;

          // Zickzack: gerade Indices nach links versetzt, ungerade nach rechts
          const offsetX = i % 2 === 0 ? -60 : 60;

          return (
            <div key={t.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* Verbindungslinie zwischen Knoten (außer vor dem ersten) */}
              {i > 0 && (
                <div style={{
                  width: 2,
                  height: 32,
                  // Erledigte Verbindung in Grün, sonst Border-Farbe
                  background: done ? "var(--success)" : "var(--border)",
                  opacity: done ? 0.5 : 1,
                  transition: "background 0.3s",
                }} />
              )}

              {/* Aufgaben-Knoten (Button) */}
              <button
                onClick={() => !locked && onSelect(i)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                disabled={locked}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 24px",
                  minWidth: 380,
                  borderRadius: "var(--radius-lg)",
                  // Border-Farbe je nach Status
                  border: `1px solid ${
                    done ? "rgba(74,222,128,0.2)"
                    : isNext ? "var(--border-accent)"
                    : "var(--border)"
                  }`,
                  // Hintergrund je nach Status
                  background: done ? "rgba(74,222,128,0.05)"
                    : isNext ? "var(--bg-card-hover)"
                    : "var(--bg-card)",
                  cursor: locked ? "default" : "pointer",
                  opacity: locked ? 0.35 : 1,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  // Zickzack-Versatz + Hover-Skalierung kombiniert
                  transform: `translateX(${offsetX}px) ${isHovered ? "scale(1.04)" : "scale(1)"}`,
                  // Glow-Schatten bei Hover oder bei "next"
                  boxShadow: isHovered
                    ? "0 8px 32px var(--accent-glow)"
                    : isNext
                    ? "0 4px 16px var(--accent-glow)"
                    : "none",
                  textAlign: "left",
                  position: "relative",
                }}
              >
                {/* Linker Status-Indikator (Kreis mit Nummer / ✓ / 🔒) */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: done ? 18 : 16, fontWeight: 700, flexShrink: 0,
                  background: done
                    ? "rgba(74,222,128,0.15)"
                    : isNext
                    ? "var(--accent-glow)"
                    : "var(--bg-card)",
                  color: done ? "var(--success)" : isNext ? "var(--accent)" : "var(--text-muted)",
                  border: `1px solid ${
                    done ? "rgba(74,222,128,0.25)"
                    : isNext ? "var(--border-accent)"
                    : "var(--border)"
                  }`,
                }}>
                  {done ? "✓" : locked ? "🔒" : t.id}
                </div>

                {/* Titel + Kurzbeschreibung */}
                <div>
                  <div style={{
                    fontSize: 16, fontWeight: 700,
                    color: locked ? "var(--text-muted)" : "var(--text-primary)",
                    marginBottom: 4,
                    letterSpacing: "var(--tracking-tight)",
                  }}>
                    {t.title}
                  </div>
                  <div style={{
                    fontSize: "var(--fs-caption)",
                    color: "var(--text-muted)",
                    lineHeight: 1.5,
                    maxWidth: 200,
                    // Lange Beschreibungen auf eine Zeile clampen
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {t.description}
                  </div>
                </div>

                {/* Pulsierender "Starten →" Hinweis (nur bei aktueller Aufgabe) */}
                {isNext && (
                  <div style={{
                    position: "absolute",
                    right: 16,
                    fontSize: "var(--fs-label)",
                    fontWeight: 700,
                    color: "var(--accent)",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    animation: "pulse 2s infinite",
                  }}>
                    Starten →
                  </div>
                )}
              </button>
            </div>
          );
        })}

        {/* "To be continued" – Hint, dass weitere Module kommen */}
        <div style={{
          width: 2, height: 32,
          background: "var(--border)",
        }} />
        <div style={{
          padding: "12px 24px",
          borderRadius: "var(--radius-lg)",
          border: "1px dashed var(--border)",
          color: "var(--text-muted)",
          fontSize: "var(--fs-caption)",
          fontStyle: "italic",
          opacity: 0.4,
        }}>
          To be continued…
        </div>
      </div>
    </div>
  );
}
