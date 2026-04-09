# CodeBuddy – Java Lernassistent

Eine interaktive Lernplattform, die Anfängern hilft, Java von Grund auf zu lernen. Mit eingebautem Code-Editor, KI-gestütztem Tutor (Claude API) und einem strukturierten Lernpfad mit 10 Aufgaben.

## Features

- **Lernpfad** — 10 aufeinander aufbauende Java-Aufgaben (Hello World bis Klassen), sequenziell freigeschaltet
- **Code-Editor** — Eigener Editor mit Java-Syntax-Highlighting und Zeilennummern
- **Java-Ausführung** — Code wird serverseitig kompiliert und ausgeführt (`javac` / `java`)
- **KI-Chat (CodeBuddy)** — Sokratischer Lernassistent, der abgestufte Hilfe gibt statt fertige Lösungen
- **Trainingsraum** — Freier Sandbox-Editor ohne Aufgabenbindung
- **Benutzerkonten** — Registrierung, Login, Fortschritt wird serverseitig gespeichert
- **Dark / Light Theme**

## Tech-Stack

| Schicht    | Technologie                          |
|------------|--------------------------------------|
| Frontend   | React 19, Vite 6                     |
| Backend    | Node.js, Express 4 (ESM)            |
| Datenbank  | SQLite (better-sqlite3, WAL-Modus)   |
| KI         | Anthropic Claude API                 |
| Auth       | bcryptjs + UUID-Token                |

## Voraussetzungen

- **Node.js** (v18+)
- **Java JDK** (für die Code-Ausführung, `javac` und `java` müssen im PATH sein)
- **Anthropic API Key** (für den KI-Chat)

## Installation

```bash
# Repository klonen
git clone <repo-url>
cd AgileSE

# Backend einrichten
cd backend
npm install
cp .env.example .env
# .env bearbeiten und ANTHROPIC_API_KEY eintragen

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

## Projektstruktur

```
AgileSE/
├── backend/
│   ├── server.js          # Express-API (Auth, Chat, Code-Ausführung, Fortschritt)
│   ├── db.js              # SQLite-Verbindung und Tabellenerstellung
│   ├── .env               # Umgebungsvariablen (API-Key, Port)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Haupt-App mit Navigation und Theme
│   │   ├── main.jsx             # React-Einstiegspunkt
│   │   ├── index.css            # Globale Styles und CSS-Variablen (Dark/Light)
│   │   ├── screens/
│   │   │   ├── StartScreen.jsx  # Startseite mit Hero-Section
│   │   │   ├── LearnScreen.jsx  # Lernpfad mit Aufgaben
│   │   │   └── CodeScreen.jsx   # Freier Trainingsraum
│   │   ├── components/
│   │   │   ├── AuthScreen.jsx   # Login / Registrierung
│   │   │   ├── CodeEditor.jsx   # Code-Editor mit Syntax-Highlighting
│   │   │   ├── ChatPanel.jsx    # KI-Chat-Interface
│   │   │   ├── ChatBubble.jsx   # Einzelne Chat-Nachricht
│   │   │   ├── QuickActions.jsx # Schnellaktionen im Chat
│   │   │   ├── PathView.jsx     # Zickzack-Lernpfad-Ansicht
│   │   │   └── ThemeToggle.jsx  # Dark/Light-Umschalter
│   │   ├── hooks/
│   │   │   ├── useAuth.js       # Auth-Logik (Login, Register, Logout)
│   │   │   └── useApi.js        # API-Fetch-Wrapper mit Token
│   │   ├── data/
│   │   │   └── tasks.js         # 10 Java-Lernaufgaben
│   │   └── utils/
│   │       └── highlightJava.js # Token-basiertes Java-Syntax-Highlighting
│   ├── index.html
│   └── vite.config.js           # Vite-Konfiguration mit API-Proxy
```

## API-Endpoints

| Methode  | Pfad                   | Beschreibung                     | Auth |
|----------|------------------------|----------------------------------|------|
| POST     | `/api/register`        | Neuen Benutzer registrieren      | Nein |
| POST     | `/api/login`           | Anmelden, Token erhalten         | Nein |
| POST     | `/api/logout`          | Abmelden                         | Ja   |
| DELETE   | `/api/account`         | Konto und Daten löschen          | Ja   |
| GET      | `/api/progress`        | Lernfortschritt laden            | Ja   |
| POST     | `/api/progress/:taskId`| Fortschritt speichern            | Ja   |
| POST     | `/api/chat`            | KI-Chat-Nachricht senden         | Ja   |
| POST     | `/api/run`             | Java-Code kompilieren/ausführen  | Ja   |
| GET      | `/api/health`          | Health-Check                     | Nein |

## Umgebungsvariablen

| Variable           | Beschreibung               | Standard |
|--------------------|-----------------------------|----------|
| `ANTHROPIC_API_KEY`| Anthropic API-Schlüssel     | —        |
| `PORT`             | Backend-Port                | `3001`   |

## Lizenz

Dieses Projekt ist im Rahmen des Moduls Agile Software Engineering entstanden.
