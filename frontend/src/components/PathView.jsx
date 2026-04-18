// ═══════════════════════════════════════════════════════════════
//  PathView.jsx – Lernpfad als vertikale Zickzack-Liste
// ═══════════════════════════════════════════════════════════════
//  Stellt alle 10 Aufgaben aus tasks.js untereinander dar – inspiriert
//  von Duolingo's Lernpfad. Visuelle Logik:
//   - Erledigte Aufgaben: grüner Haken, weichgezeichnet
//   - Aktuelle Aufgabe (next): hervorgehoben mit "Starten"-Pill
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
                  height: 36,
                  // Erledigte Verbindung als grüner Verlauf, sonst neutrale Border-Farbe
                  background: done
                    ? "linear-gradient(180deg, rgba(74,222,128,0.55), rgba(74,222,128,0.25))"
                    : "var(--border)",
                  borderRadius: 2,
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
                  gap: 18,
                  padding: "16px 20px 16px 18px",
                  width: 460,
                  borderRadius: "var(--radius-lg)",
                  // Border-Farbe je nach Status – "next" mit leicht stärkerem Akzent
                  border: `1px solid ${
                    done ? "rgba(74,222,128,0.28)"
                    : isNext ? "var(--border-accent)"
                    : "var(--border)"
                  }`,
                  // Hintergrund je nach Status
                  background: done
                    ? "linear-gradient(135deg, rgba(74,222,128,0.06), rgba(74,222,128,0.02))"
                    : isNext
                    ? "linear-gradient(135deg, var(--bg-card-hover), var(--bg-card))"
                    : "var(--bg-card)",
                  cursor: locked ? "default" : "pointer",
                  opacity: locked ? 0.45 : 1,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  // Zickzack-Versatz + Hover-Skalierung kombiniert
                  transform: `translateX(${offsetX}px) ${isHovered ? "translateY(-2px) scale(1.02)" : "scale(1)"}`,
                  // Glow-Schatten: Hover > next > kein Schatten
                  boxShadow: isHovered
                    ? "0 12px 36px var(--accent-glow), 0 0 0 1px var(--border-accent)"
                    : isNext
                    ? "0 6px 22px var(--accent-glow)"
                    : done
                    ? "0 2px 8px rgba(74,222,128,0.08)"
                    : "none",
                  textAlign: "left",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Akzent-Balken am linken Rand der "next"-Karte */}
                {isNext && (
                  <div style={{
                    position: "absolute",
                    left: 0, top: 0, bottom: 0,
                    width: 3,
                    background: "var(--accent-gradient)",
                    borderRadius: "3px 0 0 3px",
                  }} />
                )}

                {/* Linker Status-Indikator (Kreis mit Nummer / ✓ / 🔒) */}
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: done ? 20 : 17, fontWeight: 800, flexShrink: 0,
                  // "done" + "next" bekommen einen Verlauf, gesperrte nur Fläche
                  background: done
                    ? "linear-gradient(135deg, rgba(74,222,128,0.22), rgba(74,222,128,0.08))"
                    : isNext
                    ? "linear-gradient(135deg, var(--accent-glow), rgba(126,184,212,0.08))"
                    : "var(--bg-card)",
                  color: done ? "var(--success)" : isNext ? "var(--accent)" : "var(--text-muted)",
                  border: `1px solid ${
                    done ? "rgba(74,222,128,0.35)"
                    : isNext ? "var(--border-accent)"
                    : "var(--border)"
                  }`,
                  // Subtiler "Tiefen"-Schatten für den aktuellen Knoten
                  boxShadow: isNext ? "inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
                }}>
                  {done ? "✓" : locked ? "🔒" : t.id}
                </div>

                {/* Titel + Beschreibung (jetzt mit Platz für 2 Zeilen) */}
                <div style={{ flex: 1, minWidth: 0 }}>
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
                    lineHeight: 1.45,
                    // Bis zu 2 Zeilen, danach "…" – verhindert zu lange Kacheln
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    {t.description}
                  </div>
                </div>

                {/* Rechter Indikator:
                     - aktuelle Aufgabe: "Starten"-Pill mit Pfeil
                     - erledigte Aufgabe: "Nochmal"-Hint (dezent)
                     - gesperrt:          Schloss (ganz dezent) */}
                {isNext && (
                  <div style={{
                    padding: "7px 14px",
                    borderRadius: 999,
                    background: "var(--accent-gradient)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    boxShadow: "0 4px 14px var(--accent-glow)",
                    flexShrink: 0,
                    // Sanftes Pulsieren, damit der Blick hier landet
                    animation: "pulse 2.4s ease-in-out infinite",
                  }}>
                    Starten
                  </div>
                )}
                {done && (
                  <div style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.9,
                    textTransform: "uppercase",
                    color: "var(--success)",
                    opacity: isHovered ? 1 : 0.7,
                    flexShrink: 0,
                    transition: "opacity 0.2s",
                  }}>
                    Nochmal
                  </div>
                )}
              </button>
            </div>
          );
        })}

        {/* Abschluss-Linie und "To be continued" – Hint auf kommende Module */}
        <div style={{
          width: 2, height: 36,
          background: "var(--border)",
          borderRadius: 2,
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
