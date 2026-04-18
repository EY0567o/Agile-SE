// ══════════════════════════════════════════════════════════════════
//  server.js – CodeBuddy Backend (Express-API)
// ══════════════════════════════════════════════════════════════════
//  Dies ist das HERZ der Backend-Logik. Alle API-Anfragen des
//  Frontends landen hier und werden in einem dieser Bereiche bearbeitet:
//
//   1) AUTH         – Registrierung, Login, Logout, Konto löschen
//   2) PROGRESS     – Lernfortschritt laden und speichern
//   3) CHAT         – KI-Anfragen an Gemini oder Claude
//   4) LEARNING     – KI-generierte Lernstands-Zusammenfassung
//   5) RUN          – Java-Code kompilieren und ausführen (javac/java)
//
//  Wichtige Design-Entscheidungen:
//   - Sessions liegen im RAM (Map), nicht in der DB. Beim Neustart
//     sind alle User ausgeloggt – für eine Lern-App völlig OK.
//   - Passwörter werden mit bcrypt gehasht (niemals Klartext).
//   - LLM-Anbindung ist austauschbar: Gemini hat Vorrang, Claude ist
//     Fallback. Ohne API-Key läuft eine regelbasierte Fallback-Logik.
// ══════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import cors from "cors";
import express from "express";
import { execFile } from "child_process";         // für javac/java aufrufen
import { writeFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";                       // OS-spezifischer Temp-Ordner
import { randomUUID } from "crypto";               // für Session-Tokens + Temp-Ordner
import bcrypt from "bcryptjs";
import db from "./db.js";
import TASKS from "../frontend/src/data/tasks.js"; // Lernaufgaben werden auch im Backend für KI-Kontext gebraucht

// ─── Grund-Setup ─────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;

// CORS: Wir erlauben nur Anfragen vom Vite-Dev-Server (Port 5173),
// damit uns fremde Seiten nicht einfach Anfragen schicken können.
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json()); // Middleware, damit req.body als JSON geparst wird

// ─── LLM-Provider Konfiguration ──────────────────────────────────
// Die API-Keys kommen aus .env (via `node --env-file=.env`).
// Ist kein Key gesetzt, bleibt der jeweilige Client null.
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// ─── Sessions (in-memory Token Store) ────────────────────────────
// Struktur: token (UUID-String) -> { userId, username }
// Wird beim Login befüllt, beim Logout gelöscht.
const sessions = new Map();

// ─── Auth Middleware ─────────────────────────────────────────────
// Wird VOR allen geschützten Endpoints ausgeführt. Prüft:
//   1. Gibt es einen Authorization-Header im Format "Bearer <token>"?
//   2. Existiert dieser Token in unserer sessions-Map?
// Bei Erfolg: req.user = { userId, username } setzen → weiter mit next()
// Bei Fehler: 401 zurückgeben → Frontend loggt den User aus
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Nicht angemeldet" });
  }
  const token = header.slice(7); // "Bearer " abschneiden
  const session = sessions.get(token);
  if (!session) {
    return res.status(401).json({ error: "Sitzung abgelaufen" });
  }
  req.user = session;
  next();
}

// ─── Aufgaben-Titel (für KI-Kontext) ─────────────────────────────
// Kurze Liste der Task-Titles, damit die KI im System-Prompt leicht
// darauf verweisen kann ("Du hast bereits 'For-Schleife' gelöst...").
const TASK_TITLES = TASKS.map((task) => task.title);

// ═══════════════════════════════════════════════════════════════════
//  1) AUTH ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

// POST /api/register – Neuen Nutzer anlegen
// Mindestens 3 Zeichen Username, 4 Zeichen Passwort. Passwort wird
// gehasht, nur der Hash landet in der DB.
app.post("/api/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || username.length < 3) {
    return res.status(400).json({ error: "Benutzername muss mind. 3 Zeichen haben" });
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ error: "Passwort muss mind. 4 Zeichen haben" });
  }

  const hash = bcrypt.hashSync(password, 10); // 10 = Kosten-Faktor
  try {
    db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, hash);
    res.json({ success: true });
  } catch (err) {
    // UNIQUE-Constraint greift → Username existiert schon
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "Benutzername bereits vergeben" });
    }
    res.status(500).json({ error: "Registrierung fehlgeschlagen" });
  }
});

// POST /api/login – Anmelden, Token zurückgeben
// Bei Erfolg: neuen UUID-Token erzeugen, in sessions eintragen und
// an das Frontend schicken. Das Frontend speichert ihn in localStorage.
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  // Wichtig: Gleiche Fehlermeldung für "User existiert nicht" und
  // "Passwort falsch" – sonst könnten Angreifer User enumerieren.
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Falsche Anmeldedaten" });
  }

  const token = randomUUID();
  sessions.set(token, { userId: user.id, username: user.username });
  res.json({ token, username: user.username });
});

// POST /api/logout – Token ungültig machen
app.post("/api/logout", auth, (req, res) => {
  const header = req.headers.authorization;
  sessions.delete(header.slice(7));
  res.json({ success: true });
});

// DELETE /api/account – Komplettes Konto + alle Fortschritte löschen
// Reihenfolge: erst progress (wegen Foreign Key), dann user.
app.delete("/api/account", auth, (req, res) => {
  const header = req.headers.authorization;
  db.prepare("DELETE FROM progress WHERE user_id = ?").run(req.user.userId);
  db.prepare("DELETE FROM users WHERE id = ?").run(req.user.userId);
  sessions.delete(header.slice(7));
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════════════════
//  2) PROGRESS ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

// GET /api/progress – Gesamten Lernfortschritt des eingeloggten Users
// Gibt ein Array von { taskId, code, solved } zurück.
app.get("/api/progress", auth, (req, res) => {
  const rows = db.prepare("SELECT task_id, code, solved FROM progress WHERE user_id = ? ORDER BY task_id")
    .all(req.user.userId);
  res.json({ progress: rows.map(r => ({ taskId: r.task_id, code: r.code, solved: !!r.solved })) });
});

// POST /api/progress/:taskId – Code und Solved-Status einer Aufgabe speichern
// UPSERT: Wenn es den Eintrag schon gibt, wird er aktualisiert.
// Der "solved"-Flag kann NICHT von 1 auf 0 zurückgesetzt werden
// (Design-Entscheidung: einmal gelöst, immer gelöst).
app.post("/api/progress/:taskId", auth, (req, res) => {
  const taskId = parseInt(req.params.taskId, 10);
  if (isNaN(taskId) || taskId < 1 || taskId > TASK_TITLES.length) {
    return res.status(400).json({ error: "Ungültige Aufgaben-ID" });
  }
  const { code, solved } = req.body;

  // ON CONFLICT (user_id, task_id) → bestehenden Eintrag updaten
  db.prepare(`
    INSERT INTO progress (user_id, task_id, code, solved)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, task_id) DO UPDATE SET
      code = excluded.code,
      solved = CASE WHEN excluded.solved THEN 1 ELSE solved END,
      updated_at = datetime('now')
  `).run(req.user.userId, taskId, code || "", solved ? 1 : 0);

  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════════════════
//  3) LLM-ABSTRAKTION (Gemini / Anthropic)
// ═══════════════════════════════════════════════════════════════════
//  Ziel: Der Rest des Codes soll nicht wissen, welche KI gerade dran
//  ist. Wir bieten eine einheitliche Funktion generateAssistantText()
//  an, die intern Gemini (Vorrang) oder Claude nutzt.
// ═══════════════════════════════════════════════════════════════════

// BASE_SYSTEM_PROMPT = Persönlichkeit + Regeln für CodeBuddy.
// Wird bei jeder Chat-Anfrage vorne angeführt. Sokratisches Prinzip =
// keine fertigen Lösungen, nur Fragen / Hinweise.
const BASE_SYSTEM_PROMPT = `Du bist CodeBuddy, ein freundlicher Java-Lernassistent auf Deutsch.
Du erklärst Java-Code einfach und verständlich für Anfänger.
Antworte immer auf Deutsch.
Nutze sokratische Fragen – gib keine fertigen Lösungen, sondern leite den Lernenden zur Antwort.
Frage zuerst, was der User bereits versucht hat (Rubber-Duck-Prinzip).
Gib abgestufte Hilfe: erst einen kleinen Hinweis, dann konkreter, nur wenn nötig.
Halte Antworten kurz und klar (max 150 Wörter).
Beantworte nur Java-bezogene Fragen. Bei anderen Themen weise freundlich darauf hin, dass du nur bei Java helfen kannst.`;

// Prüft, ob überhaupt ein LLM verfügbar ist (für 503-Antwort).
function hasAiProvider() {
  return Boolean(geminiApiKey || anthropic);
}

// Gemini erwartet ein anderes Message-Format als Claude:
//   Claude:  { role: "assistant"|"user", content: "..." }
//   Gemini:  { role: "model"|"user", parts: [{ text: "..." }] }
// Diese Funktion übersetzt vom internen Format in Gemini-Format.
function mapMessagesToGemini(messages) {
  return messages
    .filter((message) => typeof message.content === "string" && message.content.trim())
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
}

// Direkter fetch-Call zur Gemini-REST-API (kein SDK nötig).
// Wirft bei HTTP-Fehlern oder leerer Antwort.
async function generateWithGemini({ systemPrompt, messages, maxOutputTokens }) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": geminiApiKey,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: mapMessagesToGemini(messages),
      generationConfig: { maxOutputTokens },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini-Antwort konnte nicht generiert werden.");
  }

  // Gemini liefert "content.parts" – wir bauen den Text zusammen
  const parts = data.candidates?.[0]?.content?.parts || [];
  const text = parts.map((part) => part.text || "").join("").trim();
  if (!text) {
    throw new Error("Gemini hat keine Textantwort geliefert.");
  }
  return text;
}

// Call via offizielles Anthropic-SDK.
async function generateWithAnthropic({ systemPrompt, messages, maxOutputTokens }) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxOutputTokens,
    system: systemPrompt,
    messages,
  });
  return response.content.map((item) => item.text || "").join("").trim();
}

// Zentrale "generate"-Funktion. Priorität: Gemini > Anthropic.
// Wird von /api/chat und /api/learning-summary gleichermaßen genutzt.
async function generateAssistantText({ systemPrompt, messages, maxOutputTokens }) {
  if (geminiApiKey) {
    return generateWithGemini({ systemPrompt, messages, maxOutputTokens });
  }
  if (anthropic) {
    return generateWithAnthropic({ systemPrompt, messages, maxOutputTokens });
  }
  throw new Error("Kein LLM-API-Key konfiguriert.");
}

// ═══════════════════════════════════════════════════════════════════
//  4) LEARNING SUMMARY ("Was kann ich schon?")
// ═══════════════════════════════════════════════════════════════════

// Lädt aus der DB, welche Aufgaben der User gelöst hat und welche
// als nächste ansteht. Wird vom /api/learning-summary Endpoint genutzt.
function getLearningProgress(userId) {
  const rows = db.prepare("SELECT task_id, code, solved FROM progress WHERE user_id = ? ORDER BY task_id")
    .all(userId);
  const progressByTaskId = new Map(rows.map((row) => [row.task_id, row]));

  // Alle Aufgaben, die tatsächlich gelöst wurden, mit ihrem User-Code
  const solvedTasks = TASKS.filter((task) => progressByTaskId.get(task.id)?.solved)
    .map((task) => ({
      ...task,
      code: progressByTaskId.get(task.id)?.code || "",
    }));

  // Nächste noch offene Aufgabe (oder null, wenn alles fertig)
  const nextTask = TASKS.find((task) => !progressByTaskId.get(task.id)?.solved) || null;

  return { solvedTasks, nextTask };
}

// Deterministische Zusammenfassung OHNE KI. Wird verwendet, wenn:
//   - kein API-Key gesetzt ist, oder
//   - die KI unsinn liefert (siehe isUsefulLearningSummary unten).
// Garantiert, dass der User immer irgendeine sinnvolle Antwort bekommt.
function buildFallbackLearningSummary({ solvedTasks, nextTask }) {
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

// Qualitäts-Check für die KI-Antwort. Die KI muss die drei Überschriften
// enthalten und mindestens 120 Zeichen lang sein – sonst greift der Fallback.
// Das ist eine einfache Halluzinations-Absicherung.
function isUsefulLearningSummary(summary) {
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

// GET /api/learning-summary – liefert dem User eine Reflexion seines Lernstands
// Rückgabe: { summary: "...", source: "ai" | "fallback" }
app.get("/api/learning-summary", auth, async (req, res) => {
  const { solvedTasks, nextTask } = getLearningProgress(req.user.userId);
  const fallbackSummary = buildFallbackLearningSummary({ solvedTasks, nextTask });

  // Kein LLM verfügbar → deterministische Variante ausliefern
  if (!hasAiProvider()) {
    return res.json({ summary: fallbackSummary, source: "fallback" });
  }

  try {
    // Nur die für die KI relevanten Felder rausziehen (kein User-Code)
    const solvedTaskData = solvedTasks.map((task) => ({
      title: task.title,
      description: task.description,
      hint: task.hint,
    }));

    const summary = await generateAssistantText({
      systemPrompt: `Du bist ein didaktischer Lerncoach fuer Java-Anfaenger.
Erstelle auf Deutsch eine kurze, ehrliche Lernstands-Zusammenfassung.
Uebertreibe nicht und formuliere vorsichtig, zum Beispiel mit "du hast geuebt" oder "du kennst vermutlich".
Antworte mit genau drei Abschnitten:
Was du schon geuebt hast
Woran du gerade arbeitest
Naechster sinnvoller Schritt
Jeder Abschnitt soll 1 bis 2 Saetze enthalten. Keine Bulletpoints.`,
      messages: [
        {
          role: "user",
          content: `Nutzer: ${req.user.username}

Geloeste Aufgaben:
${JSON.stringify(solvedTaskData, null, 2)}

Naechste Aufgabe:
${JSON.stringify(nextTask ? {
            title: nextTask.title,
            description: nextTask.description,
            hint: nextTask.hint,
          } : null, null, 2)}`,
        },
      ],
      maxOutputTokens: 350,
    });

    // Nur nutzen, wenn die Antwort unsere Qualitätskriterien erfüllt
    if (isUsefulLearningSummary(summary)) {
      return res.json({ summary, source: "ai" });
    }
    res.json({ summary: fallbackSummary, source: "fallback" });
  } catch (err) {
    // Bei Netzwerk-/API-Fehlern ebenfalls den Fallback ausliefern
    console.error("Learning summary error:", err.message);
    res.json({ summary: fallbackSummary, source: "fallback" });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  5) CHAT-ENDPOINT (mit Lernkontext)
// ═══════════════════════════════════════════════════════════════════

// POST /api/chat – Kern des KI-Tutors
// Body: { messages: [...], code?: string, taskId?, taskTitle?, taskDescription?, taskHint? }
// Ablauf:
//   1. System-Prompt anreichern mit Lernfortschritt + aktueller Aufgabe
//   2. Den aktuellen Java-Code an die LETZTE User-Nachricht anhängen
//      (wichtig: nicht an die erste, damit Follow-up-Fragen den
//       aktuellen Code sehen, nicht den alten)
//   3. An LLM schicken, Antwort zurück
app.post("/api/chat", auth, async (req, res) => {
  const { messages, code, taskId, taskTitle, taskDescription, taskHint } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages-Array erforderlich" });
  }

  if (!hasAiProvider()) {
    return res.status(503).json({
      error: "GEMINI_API_KEY oder ANTHROPIC_API_KEY fehlt. Bitte im Backend als Umgebungsvariable setzen.",
    });
  }

  // ── (1) System-Prompt dynamisch um Lernkontext erweitern ──
  let systemPrompt = BASE_SYSTEM_PROMPT;
  const solved = db.prepare("SELECT task_id FROM progress WHERE user_id = ? AND solved = 1 ORDER BY task_id")
    .all(req.user.userId);

  if (solved.length > 0 || taskId || taskTitle || taskDescription) {
    const solvedNames = solved.map(r => TASK_TITLES[r.task_id - 1]).filter(Boolean);
    const currentTaskTitle = taskTitle || TASK_TITLES[taskId - 1] || "Unbekannt";
    systemPrompt += `\n\nLernfortschritt des Users "${req.user.username}":`;
    systemPrompt += `\n- Gelöste Aufgaben (${solved.length}/10): ${solvedNames.join(", ") || "keine"}`;
    if (taskId || taskTitle || taskDescription) {
      systemPrompt += `\n- Arbeitet gerade an: Aufgabe ${taskId || "Unbekannt"} – ${currentTaskTitle}`;
    }
    if (taskDescription) systemPrompt += `\n- Aufgabenbeschreibung: ${taskDescription}`;
    if (taskHint)        systemPrompt += `\n- Hinweis zur Aufgabe: ${taskHint}`;
    systemPrompt += `\nPasse deine Erklärungen an das Niveau des Lernenden an.`;
  }

  // ── (2) Code an die LETZTE User-Message hängen ──
  // Suche rückwärts den letzten User-Index. Wichtig für Folge-Fragen:
  // So sieht die KI beim Thema-Wechsel stets den aktuell im Editor
  // stehenden Code, nicht eine alte Version aus der ersten Nachricht.
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") { lastUserIdx = i; break; }
  }

  const apiMessages = messages.map((msg, i) => {
    if (i === lastUserIdx && code) {
      return {
        role: "user",
        content: `Mein aktueller Java-Code:\n\`\`\`java\n${code}\n\`\`\`\n\nMeine Frage: ${msg.content}`,
      };
    }
    return { role: msg.role, content: msg.content };
  });

  // Edge-Case: Gar keine User-Nachricht im Verlauf, aber es gibt Code
  // → als initiale Nachricht anhängen
  if (lastUserIdx === -1 && code) {
    apiMessages.push({
      role: "user",
      content: `Mein aktueller Java-Code:\n\`\`\`java\n${code}\n\`\`\``,
    });
  }

  // ── (3) LLM aufrufen ──
  try {
    const reply = await generateAssistantText({
      systemPrompt,
      messages: apiMessages,
      maxOutputTokens: 1024,
    });
    res.json({ reply });
  } catch (err) {
    console.error("LLM API error:", err.message);
    res.status(502).json({ error: "KI-Antwort konnte nicht generiert werden." });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  6) JAVA-CODE AUSFÜHREN
// ═══════════════════════════════════════════════════════════════════

// POST /api/run – Kompiliert und führt den eingereichten Java-Code aus
// Ablauf:
//   1. Klassennamen aus dem Code herausregexen (Java: Dateiname MUSS
//      dem Klassennamen entsprechen)
//   2. Temp-Ordner anlegen, Code als <Klassenname>.java schreiben
//   3. javac aufrufen → bei Fehler: Compile-Error zurück
//   4. java <Klassenname> aufrufen → Output zurück (oder Laufzeit-Fehler)
//   5. Temp-Ordner aufräumen (immer, auch bei Fehlern)
//
// Timeouts: 10 Sekunden pro Phase → Endlosschleifen killen den Prozess
app.post("/api/run", auth, async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "code ist erforderlich" });
  }

  // Klassennamen bestimmen. Reihenfolge:
  //   1. public class Name  → Name
  //   2. class Name         → Name
  //   3. Fallback           → "Main"
  const publicMatch = code.match(/public\s+class\s+(\w+)/);
  const anyMatch = code.match(/class\s+(\w+)/);
  const className = publicMatch?.[1] ?? anyMatch?.[1] ?? "Main";

  // Eindeutiger Temp-Ordner (UUID), damit parallele Requests sich
  // nicht in die Quere kommen.
  const workDir = join(tmpdir(), `codebuddy-${randomUUID()}`);

  try {
    await mkdir(workDir, { recursive: true });
    await writeFile(join(workDir, `${className}.java`), code);

    // ── Kompilieren (javac) ──
    const compileResult = await new Promise((resolve) => {
      execFile("javac", [`${className}.java`], { cwd: workDir, timeout: 10000 }, (err, stdout, stderr) => {
        if (err) resolve({ success: false, output: stderr || err.message });
        else     resolve({ success: true, output: stdout });
      });
    });

    // Kompilierfehler → Frontend zeigt Fehler unter dem Editor
    if (!compileResult.success) {
      return res.json({ success: false, output: compileResult.output, phase: "compile" });
    }

    // ── Ausführen (java) ──
    const runResult = await new Promise((resolve) => {
      execFile("java", [className], { cwd: workDir, timeout: 10000 }, (err, stdout, stderr) => {
        if (err) resolve({ success: false, output: stderr || err.message });
        else     resolve({ success: true, output: stdout });
      });
    });

    res.json({ success: runResult.success, output: runResult.output, phase: "run" });
  } catch (err) {
    console.error("Run error:", err.message);
    res.status(500).json({ error: "Fehler beim Ausführen." });
  } finally {
    // Aufräumen – wir löschen IMMER, auch wenn Kompilieren fehlschlug
    rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
});

// ─── Health-Check (z.B. für Uptime-Monitoring) ──────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── Server starten ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`CodeBuddy Backend läuft auf http://localhost:${PORT}`);
});
