# CodeBuddy – KI-gestützter didaktischer Begleiter für Java-Programmierung

Ein Prototyp eines Lern-Chatbots, der Studierende beim Programmieren-Lernen unterstützt – nicht durch fertige Lösungen, sondern durch sokratische Fragen und gestufte Hinweise (Hint Ladder).

## Tech-Stack

| Schicht    | Technologie                          |
|------------|--------------------------------------|
| Frontend   | React 19, Vite 6                     |
| Editor     | Monaco Editor (Java-Highlighting)    |
| Backend    | Node.js, Express 4 (ESM)             |
| Datenbank  | SQLite (better-sqlite3, WAL-Modus)   |
| KI         | OpenAI API (gpt-4o-mini)             |
| Auth       | bcryptjs + UUID-Token                |
| Tests      | Vitest                               |

## Voraussetzungen

- **Node.js** (v18+)
- **Java JDK** (für die Code-Ausführung, `javac` und `java` müssen im PATH sein)
- **OpenAI API Key** (für den KI-Chat)

## Installation

```bash
# Repository klonen
git clone <repo-url>
cd AgileSE

# Backend einrichten
cd backend
npm install
cp .env.example .env
# .env bearbeiten und OPENAI_API_KEY eintragen

# Frontend einrichten
cd ../frontend
npm install
```

## Starten

```bash
# Backend starten (Port 3001)
cd backend
npm run dev

# Frontend starten (Port 5173) — in einem zweiten Terminal
cd frontend
npm run dev
```

Die App ist dann unter `http://localhost:5173` erreichbar.

## Tests ausführen

```bash
# Unit-Tests im Backend (Vitest)
cd backend
npm test
```

Getestet werden die reinen Helper-Funktionen aus `lib/helpers.js`
(Klassennamen-Extraktion, Lernstands-Fallback, Auth-Middleware).

## Didaktische Besonderheiten

- **Sokratisches Prinzip:** Der Bot gibt NIEMALS fertigen Code. Stattdessen
  arbeitet er sich über eine 4-stufige Hint-Ladder zur Lösung vor.
- **Ampelsystem (🟢🟡🔴):** Jede KI-Antwort beginnt mit einem Vertrauens-Indikator,
  damit der Lernende weiß, wie sicher die Aussage ist.
- **Mini-RAG für Vorlesungsfolien:** Die Vorlesungsinhalte werden NUR dann an
  die KI übergeben, wenn der Lernende explizit nach Folien fragt
  (spart Tokens und verhindert unaufgeforderte Verweise).
- **Lernstands-Reflexion:** `/api/learning-summary` generiert eine
  ehrliche Selbsteinschätzung in drei Abschnitten (Was du geübt hast,
  Woran du arbeitest, Nächster Schritt).

## Projektstruktur

```
AgileSE/
├── backend/
│   ├── server.js                  # Express-API (Auth, Chat, Code-Ausführung, Fortschritt)
│   ├── db.js                      # SQLite-Verbindung und Tabellenerstellung
│   ├── lib/
│   │   ├── helpers.js             # Reine Helper-Funktionen (testbar)
│   │   └── helpers.test.js        # Unit-Tests (Vitest)
│   ├── data/
│   │   └── vorlesungen.js         # Vorlesungsfolien als Mini-RAG-Quelle
│   ├── .env                       # Umgebungsvariablen (API-Key, Port)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Haupt-App mit Navigation und Theme
│   │   ├── main.jsx               # React-Einstiegspunkt
│   │   ├── index.css              # Globale Styles und CSS-Variablen (Dark/Light)
│   │   ├── screens/
│   │   │   ├── AuthScreen.jsx     # Login / Registrierung
│   │   │   ├── StartScreen.jsx    # Startseite mit Hero-Section + Lernstand
│   │   │   ├── LearnScreen.jsx    # Lernpfad mit 10 Aufgaben
│   │   │   └── CodeScreen.jsx     # Freier Trainingsraum
│   │   ├── components/
│   │   │   ├── CodeEditor.jsx     # Monaco-Editor mit Java-Highlighting
│   │   │   ├── PathView.jsx       # Zickzack-Lernpfad-Ansicht
│   │   │   ├── ThemeToggle.jsx    # Dark/Light-Umschalter
│   │   │   └── chat/
│   │   │       ├── ChatPanel.jsx  # KI-Chat-Interface
│   │   │       ├── ChatBubble.jsx # Einzelne Chat-Nachricht
│   │   │       └── QuickActions.jsx # Vordefinierte Schnellaktionen
│   │   ├── hooks/
│   │   │   ├── useAuth.js         # Auth-Logik (Login, Register, Logout)
│   │   │   └── useApi.js          # API-Fetch-Wrapper mit Bearer-Token
│   │   └── data/
│   │       └── tasks.js           # 10 Java-Lernaufgaben
│   ├── index.html
│   └── vite.config.js             # Vite-Konfiguration mit API-Proxy
```

## API-Endpoints

| Methode  | Pfad                       | Beschreibung                       | Auth |
|----------|----------------------------|------------------------------------|------|
| POST     | `/api/register`            | Neuen Benutzer registrieren        | Nein |
| POST     | `/api/login`               | Anmelden, Token erhalten           | Nein |
| POST     | `/api/logout`              | Abmelden                           | Ja   |
| DELETE   | `/api/account`             | Konto und Daten löschen            | Ja   |
| GET      | `/api/progress`            | Lernfortschritt laden              | Ja   |
| POST     | `/api/progress/:taskId`    | Fortschritt speichern              | Ja   |
| POST     | `/api/chat`                | KI-Chat-Nachricht senden           | Ja   |
| GET      | `/api/learning-summary`    | KI-generierte Lernstands-Reflexion | Ja   |
| POST     | `/api/run`                 | Java-Code kompilieren/ausführen    | Ja   |
| GET      | `/api/health`              | Health-Check                       | Nein |

## Umgebungsvariablen

| Variable           | Beschreibung               | Standard       |
|--------------------|-----------------------------|----------------|
| `OPENAI_API_KEY`   | OpenAI API-Schlüssel        | —              |
| `OPENAI_MODEL`     | OpenAI-Modell               | `gpt-4o-mini`  |
| `PORT`             | Backend-Port                | `3001`         |

## Datenschutz-Hinweise

- Passwörter werden ausschließlich als bcrypt-Hash gespeichert
- Sessions liegen im RAM (Map), nicht in der Datenbank
- Chatverläufe werden NICHT serverseitig persistiert (nur React-State)
- Java-Code wird LOKAL kompiliert und ausgeführt (nie an die Cloud)
- Chat-Nachrichten + Code werden zur Beantwortung an OpenAI gesendet
- Migration auf lokales LLM (z.B. Ollama) durch saubere Kapselung in
  `generateAssistantText()` mit minimalem Aufwand möglich

## Lizenz

Dieses Projekt ist im Rahmen des Moduls Agile Software Engineering entstanden.
