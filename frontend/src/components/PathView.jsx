import { useState } from "react";
import TASKS from "../data/tasks";

export default function PathView({ unlockedUpTo, onSelect }) {
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
      <h2 style={{
        color: "var(--text-primary)", fontSize: 22, fontWeight: 700,
        marginBottom: 8, letterSpacing: -0.3,
      }}>
        Java Grundlagen
      </h2>
      <p style={{
        color: "var(--text-secondary)", fontSize: 14, marginBottom: 40,
      }}>
        Arbeite dich durch alle 10 Aufgaben
      </p>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        {TASKS.map((t, i) => {
          const locked = i > unlockedUpTo;
          const done = i < unlockedUpTo;
          const isNext = i === unlockedUpTo;
          const isHovered = hovered === i && !locked;

          // Zickzack: gerade Indices links, ungerade rechts
          const offsetX = i % 2 === 0 ? -60 : 60;

          return (
            <div key={t.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* Verbindungslinie */}
              {i > 0 && (
                <div style={{
                  width: 2,
                  height: 32,
                  background: done ? "var(--success)" : "var(--border)",
                  opacity: done ? 0.5 : 1,
                  transition: "background 0.3s",
                }} />
              )}

              {/* Node */}
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
                  border: `1px solid ${
                    done ? "rgba(74,222,128,0.2)"
                    : isNext ? "var(--border-accent)"
                    : "var(--border)"
                  }`,
                  background: done ? "rgba(74,222,128,0.05)"
                    : isNext ? "var(--bg-card-hover)"
                    : "var(--bg-card)",
                  cursor: locked ? "default" : "pointer",
                  opacity: locked ? 0.35 : 1,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: `translateX(${offsetX}px) ${isHovered ? "scale(1.04)" : "scale(1)"}`,
                  boxShadow: isHovered
                    ? "0 8px 32px var(--accent-glow)"
                    : isNext
                    ? "0 4px 16px var(--accent-glow)"
                    : "none",
                  textAlign: "left",
                  position: "relative",
                }}
              >
                {/* Nummer / Status */}
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

                <div>
                  <div style={{
                    fontSize: 15, fontWeight: 600,
                    color: locked ? "var(--text-muted)" : "var(--text-primary)",
                    marginBottom: 2,
                  }}>
                    {t.title}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    lineHeight: 1.4,
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {t.description}
                  </div>
                </div>

                {/* "Starten" Hinweis für nächste Aufgabe */}
                {isNext && (
                  <div style={{
                    position: "absolute",
                    right: 16,
                    fontSize: 11,
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

        {/* To be continued */}
        <div style={{
          width: 2, height: 32,
          background: "var(--border)",
        }} />
        <div style={{
          padding: "12px 24px",
          borderRadius: "var(--radius-lg)",
          border: "1px dashed var(--border)",
          color: "var(--text-muted)",
          fontSize: 13,
          fontStyle: "italic",
          opacity: 0.4,
        }}>
          To be continued…
        </div>
      </div>
    </div>
  );
}
