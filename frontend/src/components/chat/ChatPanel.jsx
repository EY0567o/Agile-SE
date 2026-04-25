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
import useApi from "../../hooks/useApi";

export default function ChatPanel({ code, greeting, token, taskId, taskTitle, taskDescription, taskHint, errorOutput }) {
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
    const sendMessage = async (overrideText, isErrorAction = false) => {
    // Spezialfall: "Fehlermeldung erklären" ohne aktuelle Fehlermeldung
    // → lokal antworten, kein API-Call
    if (isErrorAction && !errorOutput) {
      setMessages((prev) => [
        ...prev,
        { role: "user", text: "Fehlermeldung erklären", persist: false },
        { role: "bot", text: "Keine Fehlermeldung vorhanden. Führe deinen Code erst aus – sobald ein Fehler auftritt, kann ich ihn dir erklären.", persist: false },
      ]);
      return;
    }

    const userText = overrideText || input.trim();
    if (!userText && !code) return;
    let finalText = userText || "Erkläre meinen Code.";

    // Bei "Fehlermeldung erklären" die aktuelle Fehlermeldung anhängen,
    // damit die KI sie im Klartext sieht.
    if (isErrorAction && errorOutput) {
      finalText += `\n\nHier ist die Fehlermeldung:\n\`\`\`\n${errorOutput}\n\`\`\``;
    }

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
        body: JSON.stringify({ messages: history, code, taskId, taskTitle, taskDescription, taskHint }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unbekannter Fehler");
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch (err) {
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
        <QuickActions onSelect={(action) => sendMessage(action.prompt, action.id === "error")} disabled={loading} />
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
