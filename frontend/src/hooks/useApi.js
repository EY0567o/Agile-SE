const API = import.meta.env.VITE_API_BASE_URL || "";

export default function useApi(token) {
  const apiFetch = (path, options = {}) => {
    return fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  };

  return apiFetch;
}
