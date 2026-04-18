// ═══════════════════════════════════════════════════════════════
//  ChatPanel.jsx – Kompletter Chat-Bereich (rechts neben Editor)
// ═══════════════════════════════════════════════════════════════
//  Features:
//   - Nachrichtenverlauf als Liste von ChatBubbles
//   - QuickActions-Menü (vordefinierte Prompts) links am Input
//   - Auto-Scroll zum Ende bei neuer Nachricht
//   - Schicken per Enter oder Button
//   - Loading-Indikator ("CodeBuddy denkt nach...")
//
//  Wichtige Props:
//   - code             : aktueller Java-Code im Editor (wird mitgeschickt)
//   - greeting         : Begrüßungstext der ersten Bot-Nachricht
//   - taskId/Title/Description/Hint : Aufgaben-Kontext (aus LearnScreen)
//
//  Besonderheit persist:
//   Nachrichten mit persist:false (Begrüßung, Fehlermeldungen) werden
//   NICHT in die API-History übernommen. Sonst würde die KI Fehler
//   wie "Verbindungsfehler" als eigene frühere Antwort interpretieren.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";
import QuickActions from "./QuickActions";
import useApi from "../hooks/useApi";

export default function ChatPanel({ code, greeting, token, taskId, taskTitle, taskDescription, taskHint }) {
  const apiFetch = useApi(token);

  // Messages-State: erste Nachricht ist die Begrüßung (persist:false,
  // damit sie nicht im KI-Kontext landet)
  const [messages, setMessages] = useState([
    { role: "bot", text: greeting, persist: false },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Ref auf ein unsichtbares Div am Ende der Liste → scrollIntoView
  // bei neuen Nachrichten für Auto-Scroll nach unten
  const chatEnd = useRef(null);
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // sendMessage: Einheitliche Funktion für Tippen + QuickAction-Klick
  //   overrideText: Wenn gesetzt (QuickAction), wird dieser Text statt
  //                 des Input-Feldes verwendet
  const sendMessage = async (overrideText) => {
    const userText = overrideText || input.trim();
    // Ohne Text UND ohne Code → nichts zu senden
    if (!userText && !code) return;
    // Wenn nur Code vorhanden, nutzen wir eine Standard-Frage
    const finalText = userText || "Erkläre meinen Code.";

    const newUserMsg = { role: "user", text: finalText };
    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    setLoading(true);

    // History für die KI aufbauen:
    //   - persist:false Nachrichten rausfiltern (Begrüßung, Fehler)
    //   - unser internes "bot" in das API-Format "assistant" mappen
    const history = [...messages, newUserMsg]
      .filter((m) => m.persist !== false)
      .map((m) => ({
        role: m.role === "bot" ? "assistant" : m.role,
        content: m.text,
      }));

    try {
      const res = await apiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: history, code, taskId, taskTitle, taskDescription, taskHint }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unbekannter Fehler");
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch (err) {
      // Fehlermeldungen werden nur lokal angezeigt, nicht in die
      // API-History übernommen → persist:false
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
      {/* Nachrichten-Liste (scrollbar) */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 16px 8px" }}>
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} text={m.text} />
        ))}
        {/* Ladeindikator während des API-Calls */}
        {loading && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            color: "var(--accent)", fontSize: "var(--fs-caption)", padding: "8px 0",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--accent)",
              animation: "pulse 1s infinite",
            }} />
            CodeBuddy denkt nach...
          </div>
        )}
        {/* Anchor für Auto-Scroll */}
        <div ref={chatEnd} />
      </div>

      {/* Input-Zeile: QuickActions + Textfeld + Senden-Button */}
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
            background: "var(--bg-card)",
            color: "var(--text-primary)", fontSize: "var(--fs-body)", outline: "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading}
          style={{
            padding: "10px 18px",
            borderRadius: "var(--radius-sm)",
            background: loading ? "var(--bg-card)" : "var(--accent-gradient)",
            border: loading ? "1px solid var(--border)" : "1px solid var(--border-accent)",
            color: loading ? "var(--text-muted)" : "#fff",
            fontSize: "var(--fs-body)",
            fontWeight: 700,
            cursor: loading ? "default" : "pointer",
            transition: "all 0.2s",
            letterSpacing: 0.2,
          }}
        >Senden</button>
      </div>
    </div>
  );
}
