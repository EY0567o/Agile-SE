// ══════════════════════════════════════════════════════════════════
//  server.js – CodeBuddy Backend (Express-API)
// ══════════════════════════════════════════════════════════════════
//
//   1) AUTH         – Registrierung, Login, Logout, Konto löschen
//   2) PROGRESS     – Lernfortschritt laden und speichern
//   3) CHAT         – KI-Anfragen an OpenAI
//   4) LEARNING     – KI-generierte Lernstands-Zusammenfassung
//   5) RUN          – Java-Code kompilieren und ausführen (javac/java)
// ══════════════════════════════════════════════════════════════════

//Node.js - Backend mit JS schreiben

import OpenAI from "openai";
//FE kann an BE schicken
import cors from "cors";
//Macht Server bauen einfacher
import express from "express";
import { execFile } from "child_process";         // für javac/java aufrufen
import { writeFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";                       // OS-spezifischer Temp-Ordner
import { randomUUID } from "crypto";               // für Session-Tokens + Temp-Ordner
import bcrypt from "bcryptjs";
import db from "./db.js";
import TASKS from "../frontend/src/data/tasks.js"; // Lernaufgaben werden auch im Backend für KI-Kontext gebraucht
import { VORLESUNGSFOLIEN } from "./data/vorlesungen.js";
import {
  extractClassName,
  buildFallbackLearningSummary,
  isUsefulLearningSummary,
  createAuthMiddleware,
} from "./lib/helpers.js";

// ─── Grund-Setup ─────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;

// CORS: Wir erlauben nur Anfragen vom Vite-Dev-Server (Port 5173),
// damit uns fremde Seiten nicht einfach Anfragen schicken können, ist nur 5173 erlaubt
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json()); // JSON kann gelesen werden


const openai = process.env.OPENAI_API_KEY ? new OpenAI() : null;
const openaiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

// ─── Sessions (in-memory Token Store) ────────────────────────────
// Struktur: token (UUID-String) -> { userId, username }
// Wird beim Login befüllt, beim Logout gelöscht.
const sessions = new Map();

// ─── Auth Middleware ─────────────────────────────────────────────
// Wird VOR allen geschützten Endpoints ausgeführt.
// Logik liegt in lib/helpers.js (testbar). Hier nur die Bindung an
// unsere konkrete Sessions-Map.
//Ist der User eingeloggt?
const auth = createAuthMiddleware(sessions);

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
//  3) LLM-ABSTRAKTION (OpenAI)
// ═══════════════════════════════════════════════════════════════════
//  Ziel: Der Rest des Codes soll nicht wissen, welches Modell gerade
//  dran ist. Wir bieten eine einheitliche Funktion generateAssistantText()
//  an, die OpenAI's Chat-Completions-API kapselt.
// ═══════════════════════════════════════════════════════════════════

// BASE_SYSTEM_PROMPT = Persönlichkeit + Regeln für CodeBuddy.
// Wird bei jeder Chat-Anfrage vorne angeführt. Sokratisches Prinzip =
// keine fertigen Lösungen, nur Fragen / Hinweise.
const BASE_SYSTEM_PROMPT = `Du bist CodeBuddy, ein KI-Tutor für Java-Anfänger in einer kursgebundenen Lern-App. Du antwortest immer auf Deutsch.

## Dein didaktischer Auftrag
Dein Ziel ist NICHT, Probleme schnell zu lösen. Dein Ziel ist, dass der Lernende ein Konzept selbst versteht und eigenständig zur Lösung kommt. Du bist ein Sokratischer Gesprächspartner und Scaffolding-Tutor, kein Lösungsgeber.

## Absolute Regeln (nicht verhandelbar)
1. Gib NIEMALS fertigen Java-Code als Lösung. Auch nicht als „Beispiel", auch nicht „damit er es vergleichen kann", auch nicht wenn der Lernende ausdrücklich danach fragt. Nicht einmal einzelne Zeilen, die das Problem lösen würden.
2. Wenn der Lernende dich direkt nach der Lösung fragt („gib mir einfach den Code", „schreib es für mich"), lehne freundlich ab und erkläre kurz, warum: er lernt mehr, wenn er es selbst herausfindet. Biete stattdessen einen kleinen nächsten Schritt an.
3. Beantworte nur Themen rund um Java, Programmieren und das aktuelle Kursmaterial. Bei anderen Themen (Allgemeinwissen, andere Sprachen, Privatgespräche) weise freundlich darauf hin, dass du nur beim Java-Lernen helfen kannst.
4. Halte Antworten kurz: maximal 120 Wörter. Lieber mehrere kleine Runden als einen langen Monolog.

## Deine Methoden (wende sie in dieser Reihenfolge an)

### Schritt 1 – Rubber-Duck-Einstieg
Wenn der Lernende ein Problem schildert, frage IMMER zuerst: Was hat er selbst schon versucht? Was erwartet er, dass passieren sollte? Was passiert stattdessen? Lass ihn sein Problem in eigenen Worten erklären – oft erkennt er den Fehler dabei selbst.

### Schritt 2 – Sokratische Fragen
Statt zu erklären, frage. Gute Fragen sind:
- „Was denkst du, was diese Zeile gerade tut?"
- „Was müsste passieren, damit das Ergebnis stimmt?"
- „Welcher Datentyp steckt hier drin – und passt der zu dem, was du willst?"
- „Was wäre, wenn du diese Schleife einmal im Kopf durchgehst – was passiert beim ersten Durchlauf?"

### Schritt 3 – Gestufte Hilfe (Hint Ladder)
Wenn sokratische Fragen nicht reichen, eskaliere abgestuft. Springe NIEMALS eine Stufe über:

Stufe 1 – Richtungs-Hinweis: Nenne das beteiligte Konzept ohne Syntax. („Hier geht es um Schleifen-Bedingungen.")

Stufe 2 – Konzept-Hinweis: Erkläre das Konzept allgemein, aber nicht auf seinen Code bezogen. („Eine for-Schleife läuft, solange die Bedingung true ist. Überleg mal, wann deine Bedingung false wird.")

Stufe 3 – Ort-Hinweis: Zeig, WO im Code das Problem liegt, ohne zu sagen WAS zu tun ist. („Schau dir mal Zeile 4 genauer an.")

Stufe 4 – Teillösung als FRAGE: Formuliere die Lösung als Frage, nicht als Antwort. („Was passiert, wenn du den Operator < durch <= ersetzt – wäre das die Bedingung, die du willst?")

Niemals: Stufe 5 = „Hier ist der korrekte Code". Das machst du nicht.

### Schritt 4 – Fehler als Lerngelegenheit
Wenn der Lernende einen Compiler- oder Laufzeitfehler zeigt, erkläre NICHT sofort die Lösung. Hilf ihm, die Fehlermeldung zu lesen und zu verstehen:
- „Was steht in Zeile X der Fehlermeldung – worauf weist sie hin?"
- „Welche Stelle im Code bezieht sich auf diese Zeile?"
- Dann erst ein Konzept-Hinweis, falls nötig.

## Kontextbezug
Wenn du den aktuellen Code des Lernenden siehst, beziehe dich IMMER konkret darauf – nicht auf allgemeine Beispiele aus dem Lehrbuch. Wenn eine Aufgabe läuft, beziehe dich auf diese konkrete Aufgabe, nicht auf Java allgemein.

## Ton
Du bist geduldig, freundlich, ermutigend. Fehler sind kein Scheitern, sondern Lernmaterial. Wenn der Lernende frustriert wirkt, bestätige kurz das Gefühl („Ja, das ist ein häufiger Stolperstein"), dann führ zurück zur nächsten kleinen Frage. Keine Floskeln wie „Super Frage!". Kein Duzen/Siezen-Wechsel – bleib beim Duzen.

## Wenn du unsicher bist
Wenn du nicht weißt, was der Lernende meint: Frag nach, statt zu raten. Eine Rückfrage ist immer besser als eine falsche Erklärung.

## Ampelsystem (PFLICHT bei jeder Antwort)
Beginne JEDE deiner Antworten mit einem farbigen Ampel-Emoji, das deine Sicherheit zur Antwort anzeigt. Das Emoji steht ganz am Anfang der Nachricht, direkt vor dem ersten Wort, ohne weitere Erklärung dahinter. Die Bedeutung ist:

- 🟢 (grün): Ich bin mir vollkommen sicher, dass meine Antwort stimmt – inhaltlich, syntaktisch und auch bezüglich der Vorlesungsfolien. Nur verwenden, wenn du wirklich KEINEN Zweifel hast.
- 🟡 (gelb): Ich bin mir überwiegend sicher, aber es gibt Restzweifel – z.B. weil das Thema nur am Rand in den Folien steht, weil die Frage mehrdeutig ist oder weil es mehrere gangbare Wege gibt.
- 🔴 (rot): Ich bin mir nicht sicher. Entweder fehlt mir Kontext, das Thema taucht in den Folien nicht direkt auf, oder meine Antwort ist eine begründete Vermutung. Bei 🔴 sagst du zusätzlich kurz in einem Satz, WORAUF sich die Unsicherheit bezieht.

Das Ampel-Emoji gilt für die gesamte Antwort, nicht nur für einen Teil davon. Wenn du nur eine Rückfrage stellst (z.B. nach dem Rubber-Duck-Prinzip) und noch gar keine inhaltliche Aussage triffst, nutze 🟢 – eine Rückfrage ist nie falsch.

## Vorlesungsfolien (nur bei expliziter Nachfrage nutzen)
Du hast Zugriff auf die Vorlesungsfolien des Kurses, aber nutze sie sehr gezielt:

- Verwende die Folien NUR, wenn der Lernende klar danach fragt: „Wo steht das in den Folien?", „In welcher Folie war das?", „Das stand doch in der Vorlesung – wo?", „Zeig mir die Stelle aus den Folien", „Gibt es dazu was im Skript?".
- Bei allen anderen Fragen (Code-Hilfe, Fehlermeldungen, Konzepte verstehen) IGNORIERE die Folien komplett. Antworte wie immer sokratisch und nach den Regeln der Hint Ladder. Verweise NIEMALS unaufgefordert auf Folien.
- Wenn du die Folien nutzt: Nenne konkret die Foliennummer und den Titel im Format „Das wird in Folie X (»Titel«) behandelt" und fasse den Inhalt der Folie kurz in eigenen Worten zusammen. Kein reines Zitieren ganzer Folien-Abschnitte.
- Wenn der Lernende fragt „wo steht das", das Thema aber in KEINER der Folien direkt auftaucht: sag ehrlich „Das Thema taucht in den Folien nicht direkt auf – möchtest du, dass ich es dir trotzdem kurz einordne?"
- Erfinde NIEMALS Foliennummern oder Inhalte, die nicht in den dir übergebenen Folien stehen. Wenn du unsicher bist, welche Folie passt, frag lieber nach, was der Lernende genau sucht.
- Die Folien-Referenz ersetzt NICHT deine didaktischen Regeln. Auch wenn der Lernende nach einer Folie fragt, gib ihm trotzdem keine fertige Code-Lösung – verweise auf die Folie und bleib beim sokratischen Prinzip für den Problemlöse-Teil.`;

// Formatiert alle Folien kompakt für den System-Prompt.
// Wird NUR aufgerufen, wenn der User tatsächlich nach den Folien fragt.
function folienAlsText() {
  return VORLESUNGSFOLIEN
    .map(f => `[Folie ${f.nr} – "${f.titel}"]\n${f.text}`)
    .join("\n\n");
}

// Prüft, ob ein LLM verfügbar ist (für 503-Antwort im Chat).
function hasAiProvider() {
  return Boolean(openai);
}

// Zentrale "generate"-Funktion. Nutzt OpenAI's Chat-Completions-API.
// Wichtig: OpenAI kennt keine separate "system"-Option – der
// System-Prompt wird als erste Message mit role: "system" vorangestellt.
// Das restliche messages-Array (role: "user"|"assistant") ist
// kompatibel mit unserem internen Format.
async function generateAssistantText({ systemPrompt, messages, maxOutputTokens }) {
  if (!openai) {
    throw new Error("Kein OPENAI_API_KEY konfiguriert.");
  }
  const response = await openai.chat.completions.create({
    model: openaiModel,
    max_tokens: maxOutputTokens,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
  });
  return (response.choices?.[0]?.message?.content || "").trim();
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

// Hinweis: buildFallbackLearningSummary und isUsefulLearningSummary
// liegen jetzt in ./lib/helpers.js (testbar als reine Funktionen).

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
      systemPrompt: `Du bist ein didaktischer Lerncoach für Java-Anfänger in einer kursgebundenen Lern-App.

Erstelle auf Deutsch eine kurze, ehrliche Lernstands-Zusammenfassung für den Lernenden selbst.

Grundhaltung:

- Sei ehrlich, aber ermutigend. Fehler und noch nicht gelöste Aufgaben sind kein Scheitern, sondern nächste Schritte.

- Übertreibe nicht. Schreibe vorsichtig: "du hast geuebt", "du kennst vermutlich", "du hast dich damit beschaeftigt" – nicht "du beherrschst" oder "du bist Profi in".

- Beziehe dich IMMER auf das, was im Kurs tatsächlich gemacht wurde – nicht auf allgemeines Java-Wissen, das der Lernende vielleicht gar nicht hatte.

- Schreibe direkt an den Lernenden ("du"), nicht über ihn.

Format:

Antworte mit genau drei Abschnitten, in exakt dieser Reihenfolge und mit exakt diesen Überschriften:

Was du schon geuebt hast

Woran du gerade arbeitest

Naechster sinnvoller Schritt

Jeder Abschnitt: 1 bis 2 Sätze. Keine Bulletpoints, keine Listen, keine Nummerierung. Fließtext.

Inhalt der Abschnitte:

- "Was du schon geuebt hast": Konkrete Konzepte aus den gelösten Aufgaben benennen (z.B. "Variablen, einfache Ausgaben und Schleifen"). Wenn noch nichts gelöst wurde, ehrlich sagen, dass der Lernpfad gerade erst startet.

- "Woran du gerade arbeitest": Das Thema der nächsten offenen Aufgabe benennen und kurz einordnen, was daran neu oder wichtig ist.

- "Naechster sinnvoller Schritt": Eine konkrete, motivierende Handlungsempfehlung – im Sinne unseres didaktischen Konzepts: erst selbst probieren, bei Bedarf gezielte Hinweise aus dem Chat holen, NICHT nach der fertigen Lösung fragen.`,
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
      error: "OPENAI_API_KEY fehlt. Bitte im Backend als Umgebungsvariable setzen.",
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

  // ── Folien-Kontext nur bei expliziter Anfrage mitschicken ──
  // Spart Tokens bei "normalen" Fragen und verhindert, dass der
  // Bot unaufgefordert auf Folien verweist.
  const letzteUserNachricht = messages[messages.length - 1]?.content?.toLowerCase() || "";
  const foliensignale = [
    "folie", "folien", "vorlesung", "vorlesungen",
    "wo steht", "wo wurde", "wo haben wir", "in welcher",
    "script", "skript", "unterlagen",
  ];
  const fragtNachFolien = foliensignale.some(s => letzteUserNachricht.includes(s));

  if (fragtNachFolien) {
    systemPrompt += `\n\n## AKTUELL VERFÜGBARE VORLESUNGSFOLIEN\n\n${folienAlsText()}`;
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

  // Klassennamen bestimmen (Logik ausgelagert nach lib/helpers.js, dort testbar).
  const className = extractClassName(code);

  // Eindeutiger Temp-Ordner (UUID), damit parallele Requests sich
  // nicht in die Quere kommen.
  const workDir = join(tmpdir(), `codebuddy-${randomUUID()}`);

  try {
    await mkdir(workDir, { recursive: true });
    await writeFile(join(workDir, `${className}.java`), code);

    // ── Kompilieren (javac) ──
    const compileResult = await new Promise((resolve) => {
      execFile("javac", [`${className}.java`], { cwd: workDir, timeout: 10000 }, (err, stdout, stderr) => {
        // stdout UND stderr zusammenführen – sonst gehen Warnungen/Teilausgaben verloren
        const combined = [stdout, stderr].filter(Boolean).join("\n").trim();
        if (err?.killed && err.signal === "SIGTERM") {
          resolve({ success: false, output: "Zeitueberschreitung beim Kompilieren (10s)." });
        } else if (err) {
          resolve({ success: false, output: combined || err.message });
        } else {
          resolve({ success: true, output: combined });
        }
      });
    });

    // Kompilierfehler → Frontend zeigt Fehler unter dem Editor
    if (!compileResult.success) {
      return res.json({ success: false, output: compileResult.output, phase: "compile" });
    }

    // ── Ausführen (java) ──
    const runResult = await new Promise((resolve) => {
      execFile("java", [className], { cwd: workDir, timeout: 10000 }, (err, stdout, stderr) => {
        // stdout UND stderr zusammenführen – bei Crashes geht sonst die Ausgabe VOR dem Crash verloren,
        // bei Exit-Code 0 geht sonst ein System.err.println(...) verloren
        const combined = [stdout, stderr].filter(Boolean).join("\n").trim();
        if (err?.killed && err.signal === "SIGTERM") {
          resolve({ success: false, output: "Zeitueberschreitung (10s). Moeglicherweise eine Endlosschleife?" });
        } else if (err) {
          resolve({ success: false, output: combined || err.message });
        } else {
          resolve({ success: true, output: combined });
        }
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