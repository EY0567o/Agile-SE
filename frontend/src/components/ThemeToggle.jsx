export default function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={theme === "dark" ? "Light Mode" : "Dark Mode"}
      style={{
        width: 36, height: 36,
        borderRadius: "var(--radius-sm)",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        color: "var(--text-secondary)",
        fontSize: 16,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
        flexShrink: 0,
      }}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
