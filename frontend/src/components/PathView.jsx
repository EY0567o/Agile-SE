// ═══════════════════════════════════════════════════════════════
//  PathView.jsx – Lernpfad als vertikale Zickzack-Liste
// ═══════════════════════════════════════════════════════════════
//  Stellt alle 10 Aufgaben aus tasks.js untereinander dar – inspiriert
//  von Duolingo's Lernpfad. Visuelle Logik:
//   - Erledigte Aufgaben: grüner Haken, weichgezeichnet
//   - Aktuelle Aufgabe (next): dezent hervorgehoben (Accent-Border)
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
  // Welcher Knoten wird gerade gehovered? (für leichten Lift-Effekt)
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
              {/* Schlichte Verbindungslinie zwischen Knoten */}
              {i > 0 && (
                <div style={{
                  width: 2,
                  height: 32,
                  background: "var(--border)",
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
                  padding: "14px 18px",
                  width: 460,
                  borderRadius: "var(--radius-lg)",
                  // Border: bei "next" mit Accent-Farbe, sonst neutral
                  border: `1px solid ${isNext ? "var(--border-accent)" : "var(--border)"}`,
                  background: "var(--bg-card)",
                  cursor: locked ? "default" : "pointer",
                  opacity: locked ? 0.45 : 1,
                  transition: "transform 0.2s ease, border-color 0.2s ease",
                  // Dezenter Lift beim Hover, sonst nur Zickzack-Versatz
                  transform: `translateX(${offsetX}px) ${isHovered ? "translateY(-1px)" : ""}`,
                  textAlign: "left",
                }}
              >
                {/* Linker Status-Indikator (Kreis mit Nummer / ✓ / 🔒) */}
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 700, flexShrink: 0,
                  background: "var(--bg-primary)",
                  // Textfarbe kommuniziert den Status (dezenter als Hintergrund-Swap)
                  color: done ? "var(--success)" : isNext ? "var(--accent)" : "var(--text-muted)",
                  border: `1px solid ${
                    done ? "rgba(74,222,128,0.3)"
                    : isNext ? "var(--border-accent)"
                    : "var(--border)"
                  }`,
                }}>
                  {done ? "✓" : locked ? "🔒" : t.id}
                </div>

                {/* Titel + Beschreibung (bis 2 Zeilen, dann …) */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 700,
                    color: locked ? "var(--text-muted)" : "var(--text-primary)",
                    marginBottom: 3,
                    letterSpacing: "var(--tracking-tight)",
                  }}>
                    {t.title}
                  </div>
                  <div style={{
                    fontSize: "var(--fs-caption)",
                    color: "var(--text-muted)",
                    lineHeight: 1.45,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    {t.description}
                  </div>
                </div>

                {/* Dezenter "Starten"-Hinweis nur bei der aktuellen Aufgabe */}
                {isNext && (
                  <div style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    color: "var(--accent)",
                    flexShrink: 0,
                  }}>
                    Starten
                  </div>
                )}
              </button>
            </div>
          );
        })}

        {/* Abschluss-Linie und "To be continued" – Hint auf kommende Module */}
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
