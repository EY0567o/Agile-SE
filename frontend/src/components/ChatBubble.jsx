export default function ChatBubble({ role, text }) {
  const isBot = role === "bot";

  return (
    <div style={{
      display: "flex",
      justifyContent: isBot ? "flex-start" : "flex-end",
      marginBottom: 14,
      animation: "slideUp 0.3s ease",
    }}>
      <div style={{
        maxWidth: "88%",
        padding: "14px 18px",
        borderRadius: isBot ? "6px 18px 18px 18px" : "18px 6px 18px 18px",
        background: isBot
          ? "var(--bubble-bot-bg)"
          : "var(--bubble-user-bg)",
        border: `1px solid ${isBot ? "var(--bubble-bot-border)" : "var(--bubble-user-border)"}`,
        color: "var(--bubble-text)",
        fontSize: 14,
        lineHeight: 1.65,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {isBot && (
          <div style={{
            fontSize: 10,
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
