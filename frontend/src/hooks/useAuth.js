import { useState, useCallback, useEffect } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem("codebuddy_token"));
  const [username, setUsername] = useState(() => localStorage.getItem("codebuddy_username"));

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
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [token]);

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

  const register = useCallback(async (user, pass) => {
    const res = await fetch(`${API}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
  }, []);

  const logout = useCallback(() => {
    if (token) {
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

  return { token, username, login, register, logout, deleteAccount, isLoggedIn: !!token };
}
