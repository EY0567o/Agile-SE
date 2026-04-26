// ═══════════════════════════════════════════════════════════════
//  useApi.js – fetch-Wrapper mit automatischem Auth-Header
// ═══════════════════════════════════════════════════════════════
//  Zweck: Vermeidet, dass wir bei jedem API-Call manuell den Token
//  und Content-Type setzen müssen. Jede Komponente ruft einfach
//     const apiFetch = useApi(token);
//     apiFetch("/api/progress")
//  und das Token wandert automatisch mit.
//
//  Der Proxy in vite.config.js leitet "/api/*" an das Backend
//  (localhost:3001) weiter. In Produktion würde man VITE_API_BASE_URL
//  per .env setzen.
// ═══════════════════════════════════════════════════════════════

const API = import.meta.env.VITE_API_BASE_URL || "";

//useApi ist dafür zuständig, aus dem aktuellen Token eine Hilfsfunktion apiFetch zu bauen, mit der spätere Backend-Requests automatisch mit den richtigen Headern geschickt werden können.

//Es wird eine Funktion in der Konstanten gespeichert
export default function useApi(token) {
  // Gibt eine fetch-ähnliche Funktion zurück, die den Auth-Header
  // schon gesetzt hat. Alle anderen Optionen können wie bei fetch
  // durchgereicht werden (method, body, ...).
  const apiFetch = (path, options = {}) => {
    return fetch(`${API}${path}`, {
      ...options, //method etc. wird hier übernommen
      headers: {
        "Content-Type": "application/json",
        // Token nur anhängen, wenn vorhanden (z.B. nicht bei Login/Register)
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // eigene Headers des Callers haben Vorrang
        ...options.headers,
      },
    });
  };

  return apiFetch;
}
