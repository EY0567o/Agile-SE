// ══════════════════════════════════════════════════════════════════
//  helpers.js – Reine Hilfsfunktionen (ohne Seiteneffekte)
// ══════════════════════════════════════════════════════════════════
//  Hier liegen Funktionen, die nichts mit Express, DB oder OpenAI zu
//  tun haben. Genau deshalb lassen sie sich super mit Unit-Tests
//  prüfen (siehe helpers.test.js).
// ══════════════════════════════════════════════════════════════════

// Extrahiert den Java-Klassennamen aus dem Quellcode.
// Reihenfolge:
//   1. public class Name  → Name
//   2. class Name         → Name
//   3. Fallback           → "Main"
export function extractClassName(code) {
  const publicMatch = code.match(/public\s+class\s+(\w+)/);
  const anyMatch = code.match(/class\s+(\w+)/);
  return publicMatch?.[1] ?? anyMatch?.[1] ?? "Main";
}

// Deterministische Lernstands-Zusammenfassung (ohne KI).
// Wird verwendet, wenn kein API-Key gesetzt ist oder die KI Unsinn liefert.
export function buildFallbackLearningSummary({ solvedTasks, nextTask }) {
  const practiced = solvedTasks.length > 0
    ? `Du hast bereits Aufgaben zu ${solvedTasks.map((task) => task.title).join(", ")} bearbeitet. Damit hast du wichtige Java-Grundlagen schon geuebt und kannst vermutlich erste Konzepte selbst wiedererkennen.`
    : "Du hast noch keine Aufgabe als geloest markiert. Sobald du die ersten Aufgaben bearbeitest, kann die App deinen Lernstand gezielter einschaetzen.";

  const current = nextTask
    ? `Im Moment passt als naechstes Thema ${nextTask.title}. Dabei geht es um: ${nextTask.description}`
    : "Du hast alle Aufgaben im Lernpfad abgeschlossen. Jetzt kannst du dein Wissen im Trainingsraum an eigenen Beispielen festigen.";

  const nextStep = nextTask
    ? "Ein guter naechster Schritt ist, die Aufgabe erst selbst zu probieren und dir dann nur gezielte Hinweise zu holen."
    : "Ein sinnvoller naechster Schritt ist, komplexere eigene Java-Beispiele zu schreiben und den Chat fuer Rueckfragen zu nutzen.";

  return [
    "Was du schon geuebt hast:", practiced, "",
    "Woran du gerade arbeitest:", current, "",
    "Naechster sinnvoller Schritt:", nextStep,
  ].join("\n");
}

// Auth-Middleware-Factory.
// Nimmt die Sessions-Map als Parameter rein, damit die Funktion isoliert
// testbar bleibt (kein versteckter Zugriff auf globale State).
//
// Verhalten:
//   - Kein "Bearer <token>"-Header           → 401 "Nicht angemeldet"
//   - Token nicht in der Sessions-Map        → 401 "Sitzung abgelaufen"
//   - Gueltig                                → req.user setzen + next()
export function createAuthMiddleware(sessions) {
  return function auth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Nicht angemeldet" });
    }
    const token = header.slice(7);
    const session = sessions.get(token);
    if (!session) {
      return res.status(401).json({ error: "Sitzung abgelaufen" });
    }
    req.user = session;
    next();
  };
}

// Qualitaets-Check fuer KI-Antworten beim Lernstands-Endpoint.
// Greift, wenn die KI halluziniert oder das Format nicht einhaelt.
export function isUsefulLearningSummary(summary) {
  if (!summary || typeof summary !== "string") return false;
  const trimmed = summary.trim();
  if (trimmed.length < 120) return false;

  const normalized = trimmed.toLowerCase();
  const headings = [
    "was du schon ge",
    "woran du gerade arbeitest",
    "naechster sinnvoller schritt",
  ];
  return headings.every((heading) => normalized.includes(heading));
}
