import { useState, useRef, useEffect } from "react";

// Liste der Schnellaktionen. icon = kurzes Symbol für die Liste.
// prompt = der Text, der an die KI geschickt wird.
const ACTIONS = [
  { id: "error",   label: "Fehlermeldung erklären", icon: "!",  prompt: "Erkläre mir die folgende Fehlermeldung in einfacher, menschlicher Sprache. Was sagt sie konkret aus? Gib KEINE Lösung und erkläre auch nicht, wie ich sie beheben kann – übersetze die Meldung nur verständlich." },
  { id: "hint",    label: "Tipp geben",             icon: "💡", prompt: "Gib mir einen kleinen Tipp zur aktuellen Aufgabe – nur einen sanften Denkanstoß. Verrate nichts direkt, keine Lösung und keinen Code." },
  { id: "lecture", label: "Vorlesung",              icon: "📖", prompt: "Wo steht das Thema der aktuellen Aufgabe in den Vorlesungsfolien?" },
  { id: "concept", label: "Konzept erklären", icon: "📚", prompt: "Erkläre mir das Java-Konzept, das hinter der aktuellen Aufgabe steckt – allgemein und ohne direkten Bezug zu meiner Lösung. Kein Code, der die Aufgabe löst." },
];

export default function QuickActions({ onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);

  // Ref auf die Wurzel des Popups – brauchen wir für Click-Outside
  const ref = useRef(null);

  // Click-Outside-Handler: Wenn der User irgendwo AUSSERHALB des Popups klickt, schließen wir es.
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger-Button (Blitz) */}
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        style={{
          width: 40, height: 40,
          borderRadius: "var(--radius-md)",
          background: open ? "var(--accent-glow)" : "var(--bg-card)",
          border: `1px solid ${open ? "rgba(126,184,212,0.25)" : "var(--border)"}`,
          color: "var(--accent)",
          fontSize: 17,
          cursor: disabled ? "default" : "pointer",
          transition: "all 0.2s",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
        title="Schnellaktionen"
      >
        ⚡
      </button>

      {/* Popup-Menü (nur gerendert wenn open) */}
      {open && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 10px)",  // öffnet sich nach OBEN
          left: 0,
          width: 280,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "8px 0",
          boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
          zIndex: 50,
          animation: "slideUp 0.2s ease",
        }}>
          {/* Überschrift */}
          <div style={{
            padding: "8px 16px 10px",
            fontSize: 11,
            color: "var(--text-muted)",
            fontWeight: 700,
            letterSpacing: 0.9,
            textTransform: "uppercase",
          }}>
            Schnellaktionen
          </div>
          {/* Jede ACTION als klickbarer Button */}
          {ACTIONS.map((action, i) => (
            <button
              key={action.label}
              onClick={() => {
                onSelect(action);  // gibt die geklickte Schnellaktion an ChatPanel weiter.
                setOpen(false);  //Menü wird geschlossen dannach
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "11px 16px",
                background: hovered === i ? "var(--bg-card-hover)" : "none",
                border: "none",
                color: hovered === i ? "var(--text-primary)" : "var(--text-secondary)",
                fontSize: "var(--fs-caption)",
                fontWeight: 600,
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <span style={{
                width: 30, height: 30, borderRadius: 8,
                background: "var(--accent-glow)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, flexShrink: 0,
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
