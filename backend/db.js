// ─────────────────────────────────────────────────────────────
//  db.js – Datenbank-Setup (SQLite via better-sqlite3)
// ─────────────────────────────────────────────────────────────
//  Verantwortlich für:
//   - Verbindung zur SQLite-Datei (codebuddy.db)
//   - Anlegen der Tabellen beim ersten Start (CREATE IF NOT EXISTS)
//   - WAL-Modus für bessere Schreib-Performance
//
//  Wird von server.js importiert: `import db from "./db.js";`
//  Alle SQL-Queries laufen als db.prepare(...).run() / .get() / .all()
// ─────────────────────────────────────────────────────────────

import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// __dirname ist in ESM nicht automatisch verfügbar → manuell herleiten,
// damit die DB-Datei IMMER neben der db.js liegt (nicht im CWD).
const __dirname = dirname(fileURLToPath(import.meta.url));

// Verbindung zur SQLite-Datei öffnen. Wenn sie nicht existiert, wird
// sie beim ersten Zugriff automatisch angelegt.
const db = new Database(join(__dirname, "codebuddy.db"));

// WAL (Write-Ahead Logging) erlaubt gleichzeitiges Lesen/Schreiben
// und ist bei SQLite klar empfohlen für Server-Anwendungen.
db.pragma("journal_mode = WAL");

// ─── Tabellen anlegen (nur falls nicht vorhanden) ─────────────
db.exec(`
  -- users: Eine Zeile pro registriertem Nutzer
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT UNIQUE NOT NULL,         -- muss eindeutig sein
    password   TEXT NOT NULL,                -- bcrypt-Hash, NIE im Klartext
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- progress: Pro (user, task) eine Zeile. Speichert den aktuellen
  -- Code und ob die Aufgabe bereits als gelöst markiert wurde.
  CREATE TABLE IF NOT EXISTS progress (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    task_id    INTEGER NOT NULL,
    code       TEXT NOT NULL,                 -- letzter Code des Users
    solved     INTEGER DEFAULT 0,             -- 0 = offen, 1 = gelöst
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, task_id)                  -- pro User nur 1 Eintrag pro Aufgabe
  );
`);

export default db;
