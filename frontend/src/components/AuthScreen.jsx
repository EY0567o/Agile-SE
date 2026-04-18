import { useState } from "react";

export default function AuthScreen({ onLogin, onRegister }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        await onLogin(username, password);
      } else {
        await onRegister(username, password);
        setSuccess("Registrierung erfolgreich! Du kannst dich jetzt anmelden.");
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-primary)",
      padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 380,
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "40px 32px",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/logo.png" alt="CodeBuddy Logo" style={{
            width: 80, height: 80, objectFit: "contain",
            marginBottom: 8,
          }} />
          <div style={{
            fontSize: 28, fontWeight: 800, color: "var(--text-primary)",
          }}>
            CodeBuddy
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>
            Dein Java-Lernpartner
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", marginBottom: 24, gap: 4,
          background: "var(--bg-primary)", borderRadius: "var(--radius-sm)", padding: 3,
        }}>
          {["Anmelden", "Registrieren"].map((label, i) => {
            const active = i === 0 ? isLogin : !isLogin;
            return (
              <button key={label} onClick={() => { setIsLogin(i === 0); setError(""); setSuccess(""); }}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: "var(--radius-sm)",
                  border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: active ? "var(--bg-card)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                  transition: "all 0.2s",
                  boxShadow: active ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                }}
              >{label}</button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
              Benutzername
            </label>
            <input
              value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="z.B. max123"
              autoComplete="username"
              style={{
                width: "100%", padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg-primary)",
                color: "var(--text-primary)", fontSize: 14, outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
              Passwort
            </label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Mind. 4 Zeichen"
              autoComplete={isLogin ? "current-password" : "new-password"}
              style={{
                width: "100%", padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg-primary)",
                color: "var(--text-primary)", fontSize: 14, outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: "8px 12px", borderRadius: "var(--radius-sm)",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444", fontSize: 12, marginBottom: 14,
            }}>{error}</div>
          )}

          {success && (
            <div style={{
              padding: "8px 12px", borderRadius: "var(--radius-sm)",
              background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)",
              color: "var(--success)", fontSize: 12, marginBottom: 14,
            }}>{success}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "12px",
            borderRadius: "var(--radius-sm)",
            background: loading ? "var(--bg-card)" : "var(--accent-gradient)",
            border: "none",
            color: loading ? "var(--text-muted)" : "#fff",
            fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer",
            transition: "all 0.2s",
          }}>
            {loading ? "Bitte warten..." : isLogin ? "Anmelden" : "Registrieren"}
          </button>
        </form>
      </div>
    </div>
  );
}
