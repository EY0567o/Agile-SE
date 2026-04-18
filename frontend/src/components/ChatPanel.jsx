import { useState, useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";
import QuickActions from "./QuickActions";
import useApi from "../hooks/useApi";

export default function ChatPanel({ code, greeting, token, taskId }) {
  const apiFetch = useApi(token);
  const [messages, setMessages] = useState([
    { role: "bot", text: greeting, persist: false },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEnd = useRef(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (overrideText) => {
    const userText = overrideText || input.trim();
    if (!userText && !code) return;
    const finalText = userText || "Erkläre meinen Code.";

    const newUserMsg = { role: "user", text: finalText };
    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    setLoading(true);

    const history = [...messages, newUserMsg]
      .filter((m) => m.persist !== false)
      .map((m) => ({
        role: m.role === "bot" ? "assistant" : m.role,
        content: m.text,
      }));

    try {
      const res = await apiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: history, code, taskId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unbekannter Fehler");
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch (err) {
      // Fehlermeldungen werden nur lokal angezeigt, nicht in die API-History übernommen
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: err.message || "Verbindungsfehler – bitte versuche es erneut.", persist: false },
      ]);
    }
    setLoading(false);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "var(--bg-chat)",
    }}>
      {/* Messages */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 16px 8px" }}>
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} text={m.text} />
        ))}
        {loading && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            color: "var(--accent)", fontSize: 13, padding: "8px 0",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--accent)",
              animation: "pulse 1s infinite",
            }} />
            CodeBuddy denkt nach...
          </div>
        )}
        <div ref={chatEnd} />
      </div>

      {/* Input */}
      <div style={{
        display: "flex", gap: 8, padding: "14px 16px",
        borderTop: "1px solid var(--border)",
        alignItems: "center",
      }}>
        <QuickActions onSelect={(prompt) => sendMessage(prompt)} disabled={loading} />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
          placeholder="Frag mich etwas..."
          style={{
            flex: 1, padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.03)",
            color: "var(--text-primary)", fontSize: 14, outline: "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading}
          style={{
            padding: "10px 20px",
            borderRadius: "var(--radius-sm)",
            background: loading ? "#1e293b" : "var(--accent)",
            border: "none",
            color: loading ? "var(--text-muted)" : "#0b0f1a",
            fontSize: 13,
            fontWeight: 700,
            cursor: loading ? "default" : "pointer",
            transition: "all 0.2s",
            letterSpacing: 0.3,
          }}
        >Senden</button>
      </div>
    </div>
  );
}
