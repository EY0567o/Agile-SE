// ═══════════════════════════════════════════════════════════════
//  ChatBubble.jsx – Einzelne Nachricht im Chatverlauf
// ═══════════════════════════════════════════════════════════════
//  Stellt eine Chat-Nachricht dar. Unterscheidung:
//   - Bot-Nachrichten     : links, Label "CodeBuddy", andere Form
//   - User-Nachrichten    : rechts, keine Überschrift, Accent-Farbe
//
//  Die Form der Sprechblase wird über asymmetrische border-radius
//  erzeugt (oben-spitze-Ecke zeigt Richtung des Absenders).
// ═══════════════════════════════════════════════════════════════

export default function ChatBubble({ role, text }) {
  const isBot = role === "bot";

  return (
    <div style={{
      display: "flex",
      // Ausrichtung: Bot links, User rechts
      justifyContent: isBot ? "flex-start" : "flex-end",
      marginBottom: 14,
      animation: "slideUp 0.3s ease",
    }}>
      <div style={{
        maxWidth: "88%",
        padding: "14px 18px",
        // Asymmetrische Rundung → "Tail" zeigt zum Absender
        borderRadius: isBot ? "6px 18px 18px 18px" : "18px 6px 18px 18px",
        background: isBot ? "var(--bubble-bot-bg)" : "var(--bubble-user-bg)",
        border: `1px solid ${isBot ? "var(--bubble-bot-border)" : "var(--bubble-user-border)"}`,
        color: "var(--bubble-text)",
        fontSize: "var(--fs-body)",
        lineHeight: "var(--lh-copy)",
        whiteSpace: "pre-wrap",  // Zeilenumbrüche aus der Antwort erhalten
        wordBreak: "break-word", // lange Codezeilen umbrechen statt overflow
      }}>
        {/* "CodeBuddy"-Label nur bei Bot-Nachrichten */}
        {isBot && (
          <div style={{
            fontSize: 11,
            color: "var(--accent)",
            marginBottom: 6,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}>
            CodeBuddy
          </div>
        )}
        {text}
      </div>
    </div>
  );
}
