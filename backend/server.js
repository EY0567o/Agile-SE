import Anthropic from "@anthropic-ai/sdk";
import cors from "cors";
import express from "express";
import { execFile } from "child_process";
import { writeFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import db from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

// ─── Sessions (in-memory Token Store) ────────────────────────
const sessions = new Map(); // token -> { userId, username }

// ─── Auth Middleware ─────────────────────────────────────────
function auth(req, res, next) {
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
}

// ─── Aufgaben-Titel (für KI-Kontext) ────────────────────────
const TASK_TITLES = [
  "Hello World", "Variablen deklarieren", "Zwei Zahlen addieren",
  "If-Abfrage", "For-Schleife", "While-Schleife", "Array erstellen",
  "Methode schreiben", "String-Verarbeitung", "Einfache Klasse",
];

// ─── Auth Endpoints ─────────────────────────────────────────

// Registrieren
app.post("/api/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || username.length < 3) {
    return res.status(400).json({ error: "Benutzername muss mind. 3 Zeichen haben" });
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ error: "Passwort muss mind. 4 Zeichen haben" });
  }

  const hash = bcrypt.hashSync(password, 10);
  try {
    db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, hash);
    res.json({ success: true });
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "Benutzername bereits vergeben" });
    }
    res.status(500).json({ error: "Registrierung fehlgeschlagen" });
  }
});

// Anmelden
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Falsche Anmeldedaten" });
  }

  const token = randomUUID();
  sessions.set(token, { userId: user.id, username: user.username });
  res.json({ token, username: user.username });
});

// Abmelden
app.post("/api/logout", auth, (req, res) => {
  const header = req.headers.authorization;
  sessions.delete(header.slice(7));
  res.json({ success: true });
});

// Konto löschen
app.delete("/api/account", auth, (req, res) => {
  const header = req.headers.authorization;
  db.prepare("DELETE FROM progress WHERE user_id = ?").run(req.user.userId);
  db.prepare("DELETE FROM users WHERE id = ?").run(req.user.userId);
  sessions.delete(header.slice(7));
  res.json({ success: true });
});

// ─── Progress Endpoints ─────────────────────────────────────

// Fortschritt laden
app.get("/api/progress", auth, (req, res) => {
  const rows = db.prepare("SELECT task_id, code, solved FROM progress WHERE user_id = ? ORDER BY task_id")
    .all(req.user.userId);
  res.json({ progress: rows.map(r => ({ taskId: r.task_id, code: r.code, solved: !!r.solved })) });
});

// Fortschritt speichern
app.post("/api/progress/:taskId", auth, (req, res) => {
  const taskId = parseInt(req.params.taskId, 10);
  if (isNaN(taskId) || taskId < 1 || taskId > TASK_TITLES.length) {
    return res.status(400).json({ error: "Ungültige Aufgaben-ID" });
  }
  const { code, solved } = req.body;

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

// ─── System Prompt ───────────────────────────────────────────
const BASE_SYSTEM_PROMPT = `Du bist CodeBuddy, ein freundlicher Java-Lernassistent auf Deutsch.
Du erklärst Java-Code einfach und verständlich für Anfänger.
Antworte immer auf Deutsch.
Nutze sokratische Fragen – gib keine fertigen Lösungen, sondern leite den Lernenden zur Antwort.
Frage zuerst, was der User bereits versucht hat (Rubber-Duck-Prinzip).
Gib abgestufte Hilfe: erst einen kleinen Hinweis, dann konkreter, nur wenn nötig.
Halte Antworten kurz und klar (max 150 Wörter).
Beantworte nur Java-bezogene Fragen. Bei anderen Themen weise freundlich darauf hin, dass du nur bei Java helfen kannst.`;

// ─── Chat (mit Lernkontext) ─────────────────────────────────
app.post("/api/chat", auth, async (req, res) => {
  const { messages, code, taskId } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages-Array erforderlich" });
  }

  if (!anthropic) {
    return res.status(503).json({
      error: "ANTHROPIC_API_KEY fehlt. Bitte im Backend als Umgebungsvariable setzen.",
    });
  }

  // Lernfortschritt für KI-Kontext laden
  let systemPrompt = BASE_SYSTEM_PROMPT;
  const solved = db.prepare("SELECT task_id FROM progress WHERE user_id = ? AND solved = 1 ORDER BY task_id")
    .all(req.user.userId);

  if (solved.length > 0 || taskId) {
    const solvedNames = solved.map(r => TASK_TITLES[r.task_id - 1]).filter(Boolean);
    systemPrompt += `\n\nLernfortschritt des Users "${req.user.username}":`;
    systemPrompt += `\n- Gelöste Aufgaben (${solved.length}/10): ${solvedNames.join(", ") || "keine"}`;
    if (taskId) {
      systemPrompt += `\n- Arbeitet gerade an: Aufgabe ${taskId} – ${TASK_TITLES[taskId - 1] || "Unbekannt"}`;
    }
    systemPrompt += `\nPasse deine Erklärungen an das Niveau des Lernenden an.`;
  }

  // Aktuellen Code an die LETZTE User-Nachricht hängen,
  // damit die KI den Code im Kontext der aktuellen Frage sieht.
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      lastUserIdx = i;
      break;
    }
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

  // Fallback: Keine User-Nachricht vorhanden, aber Code → als neue Nachricht anhängen
  if (lastUserIdx === -1 && code) {
    apiMessages.push({
      role: "user",
      content: `Mein aktueller Java-Code:\n\`\`\`java\n${code}\n\`\`\``,
    });
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
    });

    const reply = response.content.map((c) => c.text || "").join("");
    res.json({ reply });
  } catch (err) {
    console.error("Anthropic API error:", err.message);
    res.status(502).json({ error: "KI-Antwort konnte nicht generiert werden." });
  }
});

// ─── Java ausführen ──────────────────────────────────────────
app.post("/api/run", auth, async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "code ist erforderlich" });
  }

  // Java verlangt: Dateiname == Name der public class (falls vorhanden),
  // ansonsten == Name der ersten Klasse
  const publicMatch = code.match(/public\s+class\s+(\w+)/);
  const anyMatch = code.match(/class\s+(\w+)/);
  const className = publicMatch?.[1] ?? anyMatch?.[1] ?? "Main";
  const workDir = join(tmpdir(), `codebuddy-${randomUUID()}`);

  try {
    await mkdir(workDir, { recursive: true });
    await writeFile(join(workDir, `${className}.java`), code);

    const compileResult = await new Promise((resolve) => {
      execFile("javac", [`${className}.java`], { cwd: workDir, timeout: 10000 }, (err, stdout, stderr) => {
        if (err) resolve({ success: false, output: stderr || err.message });
        else resolve({ success: true, output: stdout });
      });
    });

    if (!compileResult.success) {
      return res.json({ success: false, output: compileResult.output, phase: "compile" });
    }

    const runResult = await new Promise((resolve) => {
      execFile("java", [className], { cwd: workDir, timeout: 10000 }, (err, stdout, stderr) => {
        if (err) resolve({ success: false, output: stderr || err.message });
        else resolve({ success: true, output: stdout });
      });
    });

    res.json({ success: runResult.success, output: runResult.output, phase: "run" });
  } catch (err) {
    console.error("Run error:", err.message);
    res.status(500).json({ error: "Fehler beim Ausführen." });
  } finally {
    rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
});

// Health-Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`CodeBuddy Backend läuft auf http://localhost:${PORT}`);
});
