// ═══════════════════════════════════════════════════════════════
//  App.jsx – Einstiegspunkt der React-App
// ═══════════════════════════════════════════════════════════════
//  Verantwortlich für:
//   - Auth-Gate: Nicht eingeloggt → AuthScreen (Login/Registrierung)
//   - Screen-Switching: start / code / learn (ohne React Router,
//     wir nutzen einfach einen useState-Wert)
//   - Theme-Verwaltung: "dark" oder "light", wird auf <html> und
//     <body> via data-theme Attribut gesetzt (CSS-Variablen reagieren)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import StartScreen from "./screens/StartScreen";
import CodeScreen from "./screens/CodeScreen";
import LearnScreen from "./screens/LearnScreen";
import AuthScreen from "./components/AuthScreen";
import useAuth from "./hooks/useAuth";

export default function App() {
  // Aktueller Screen. Wir nutzen bewusst keinen Router, weil wir nur
  // drei Screens haben und keine URLs teilen müssen.
  const [screen, setScreen] = useState("start");

  // Theme startet auf "dark", User kann umschalten.
  const [theme, setTheme] = useState("dark");

  // Auth-Logik komplett im Hook gekapselt (Token, Login, Logout, ...)
  const { token, username, login, register, logout, deleteAccount, isLoggedIn } = useAuth();

  // Wenn das Theme wechselt, setzen wir data-theme auf <html> und <body>.
  // Die CSS-Variablen in index.css reagieren auf [data-theme="light"].
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Auth-Gate: Ohne gültigen Token zeigen wir den Login-Screen
  if (!isLoggedIn) {
    return <AuthScreen onLogin={login} onRegister={register} />;
  }

  // Conditional Rendering pro Screen. Der jeweils aktive Screen
  // bekommt Theme + Logout-Handler + Token als Props.
  return (
    <>
      {screen === "start" && <StartScreen onNavigate={setScreen} theme={theme} onToggleTheme={toggleTheme} username={username} onLogout={logout} onDeleteAccount={deleteAccount} token={token} />}
      {screen === "code" && <CodeScreen onBack={() => setScreen("start")} theme={theme} onToggleTheme={toggleTheme} token={token} />}
      {screen === "learn" && <LearnScreen onBack={() => setScreen("start")} theme={theme} onToggleTheme={toggleTheme} token={token} />}
    </>
  );
}
