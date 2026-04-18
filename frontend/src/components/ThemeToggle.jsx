// ═══════════════════════════════════════════════════════════════
//  ThemeToggle.jsx – Dark/Light Umschalter
// ═══════════════════════════════════════════════════════════════
//  Kleiner Button mit Sonnen-/Mond-Icon. Die eigentliche Theme-
//  Logik liegt in App.jsx (via useState), diese Komponente ist nur
//  der optische Trigger.
//
//  Props:
//   - theme    : "dark" | "light" (aktueller Zustand)
//   - onToggle : Callback beim Klick
// ═══════════════════════════════════════════════════════════════

export default function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      // Tooltip zeigt an, WOHIN man umschaltet (nicht wo man gerade ist)
      title={theme === "dark" ? "Light Mode" : "Dark Mode"}
      style={{
        width: 40, height: 40,
        borderRadius: "var(--radius-md)",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        color: "var(--text-secondary)",
        fontSize: 17,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
        flexShrink: 0,
      }}
    >
      {/* Im Dark-Mode zeigen wir die Sonne (= "Klick für Hell"),
          im Light-Mode den Mond (= "Klick für Dunkel") */}
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
