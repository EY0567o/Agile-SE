import { useState, useRef, useEffect } from "react";

const ACTIONS = [
  { label: "Fehlermeldung erklären", icon: "!", prompt: "Ich habe eine Fehlermeldung in meinem Code. Kannst du mir erklären, was sie bedeutet und wie ich sie beheben kann?" },
  { label: "Code erklären", icon: "?", prompt: "Erkläre mir meinen aktuellen Code Schritt für Schritt." },
  { label: "Hint geben", icon: "💡", prompt: "Gib mir einen kleinen Hinweis, wie ich die Aufgabe lösen kann – aber nicht die Lösung!" },
  { label: "Was habe ich falsch?", icon: "×", prompt: "Schau dir meinen Code an – was habe ich falsch gemacht? Stelle mir Rückfragen, damit ich selbst drauf komme." },
  { label: "Konzept erklären", icon: "📖", prompt: "Erkläre mir das Java-Konzept, das in meinem Code verwendet wird, anhand eines einfachen Beispiels." },
];

export default function QuickActions({ onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        style={{
          width: 40, height: 40,
          borderRadius: "var(--radius-sm)",
          background: open ? "var(--accent-glow)" : "var(--bg-card)",
          border: `1px solid ${open ? "rgba(126,184,212,0.25)" : "var(--border)"}`,
          color: "var(--accent)",
          fontSize: 16,
          cursor: disabled ? "default" : "pointer",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        title="Schnellaktionen"
      >
        ⚡
      </button>

      {open && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 10px)",
          left: 0,
          width: 280,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: "8px 0",
          boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
          zIndex: 50,
          animation: "slideUp 0.2s ease",
        }}>
          <div style={{
            padding: "8px 16px 10px",
            fontSize: 10,
            color: "var(--text-muted)",
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}>
            Schnellaktionen
          </div>
          {ACTIONS.map((action, i) => (
            <button
              key={action.label}
              onClick={() => {
                onSelect(action.prompt);
                setOpen(false);
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "11px 16px",
                background: hovered === i ? "rgba(126,184,212,0.08)" : "none",
                border: "none",
                color: hovered === i ? "var(--text-primary)" : "var(--text-secondary)",
                fontSize: 13,
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <span style={{
                width: 28, height: 28, borderRadius: 6,
                background: "var(--accent-glow)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, flexShrink: 0,
                color: "var(--accent)",
                fontWeight: 700,
              }}>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
