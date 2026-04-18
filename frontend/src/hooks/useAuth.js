// ═══════════════════════════════════════════════════════════════
//  useAuth.js – Kompletter Auth-Flow (Login, Register, Logout, Delete)
// ═══════════════════════════════════════════════════════════════
//  Der Hook hält die Auth-Zustände (Token, Username) sowohl im
//  React-State als auch in localStorage, sodass ein Refresh den
//  User nicht ausloggt. Wird in App.jsx einmal aufgerufen und von
//  dort an alle Screens weitergereicht.
//
//  Funktionen:
//   - login(user, pass)     → fragt /api/login, speichert Token
//   - register(user, pass)  → fragt /api/register (kein Auto-Login!)
//   - logout()              → löscht Token lokal und serverseitig
//   - deleteAccount()       → löscht ganzes Konto (DB + Session)
//
//  Zusätzlich: Beim Start wird mit /api/progress geprüft, ob der
//  gespeicherte Token noch gültig ist. 401 → automatisch ausloggen.
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function useAuth() {
  // Initialer State kommt aus localStorage (Lazy-Init, nur beim Mount).
  // So bleibt der User auch nach einem Browser-Refresh eingeloggt.
  const [token, setToken] = useState(() => localStorage.getItem("codebuddy_token"));
  const [username, setUsername] = useState(() => localStorage.getItem("codebuddy_username"));

  // Token-Validierung beim Mount: Wenn der Server mit 401 antwortet
  // (z.B. Backend wurde neu gestartet → sessions-Map leer), räumen wir
  // den lokalen Token weg. Der `active`-Flag verhindert State-Updates
  // nach Unmount (wichtig bei React Strict Mode).
  useEffect(() => {
    if (!token) return;

    let active = true;

    fetch(`${API}/api/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (active && res.status === 401) {
          localStorage.removeItem("codebuddy_token");
          localStorage.removeItem("codebuddy_username");
          setToken(null);
          setUsername(null);
        }
      })
      .catch(() => {}); // Netzwerk-Fehler ignorieren (offline o.ä.)

    return () => { active = false; };
  }, [token]);

  // Login: POST /api/login → Token zurück bekommen → in State + localStorage
  const login = useCallback(async (user, pass) => {
    const res = await fetch(`${API}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem("codebuddy_token", data.token);
    localStorage.setItem("codebuddy_username", data.username);
    setToken(data.token);
    setUsername(data.username);
  }, []);

  // Registrieren: POST /api/register. WICHTIG: Kein Auto-Login!
  // Der User muss danach explizit den Login-Tab benutzen – so sieht
  // er die Erfolgsmeldung und merkt sich seine Zugangsdaten.
  const register = useCallback(async (user, pass) => {
    const res = await fetch(`${API}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
  }, []);

  // Logout: Token lokal UND serverseitig invalidieren
  const logout = useCallback(() => {
    if (token) {
      // Fire-and-forget – auch wenn der Server-Call fehlschlägt,
      // räumen wir lokal auf (User soll sich trotzdem ausloggen können).
      fetch(`${API}/api/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem("codebuddy_token");
    localStorage.removeItem("codebuddy_username");
    setToken(null);
    setUsername(null);
  }, [token]);

  // Konto löschen: komplette User-Daten aus DB entfernen + lokal ausloggen
  const deleteAccount = useCallback(async () => {
    if (token) {
      await fetch(`${API}/api/account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem("codebuddy_token");
    localStorage.removeItem("codebuddy_username");
    setToken(null);
    setUsername(null);
  }, [token]);

  // isLoggedIn = praktischer Boolean-Shortcut für App.jsx
  return { token, username, login, register, logout, deleteAccount, isLoggedIn: !!token };
}
