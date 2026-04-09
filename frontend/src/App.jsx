import { useState, useEffect } from "react";
import StartScreen from "./screens/StartScreen";
import CodeScreen from "./screens/CodeScreen";
import LearnScreen from "./screens/LearnScreen";
import AuthScreen from "./components/AuthScreen";
import useAuth from "./hooks/useAuth";

export default function App() {
  const [screen, setScreen] = useState("start");
  const [theme, setTheme] = useState("dark");
  const { token, username, login, register, logout, deleteAccount, isLoggedIn } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  if (!isLoggedIn) {
    return <AuthScreen onLogin={login} onRegister={register} />;
  }

  return (
    <>
      {screen === "start" && <StartScreen onNavigate={setScreen} theme={theme} onToggleTheme={toggleTheme} username={username} onLogout={logout} onDeleteAccount={deleteAccount} />}
      {screen === "code" && <CodeScreen onBack={() => setScreen("start")} theme={theme} onToggleTheme={toggleTheme} token={token} />}
      {screen === "learn" && <LearnScreen onBack={() => setScreen("start")} theme={theme} onToggleTheme={toggleTheme} token={token} />}
    </>
  );
}
