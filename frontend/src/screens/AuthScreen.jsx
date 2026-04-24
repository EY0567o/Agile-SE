// ═══════════════════════════════════════════════════════════════
//  AuthScreen.jsx – Login- und Registrierungs-Maske
// ═══════════════════════════════════════════════════════════════
//  Wird in App.jsx als "Gate" angezeigt, solange kein Token im
//  localStorage ist. Nach erfolgreichem Login ruft App.jsx setToken()
//  und der Screen wird durch StartScreen ersetzt.
//
//  UI-Aufbau:
//   - Logo + Titel "CodeBuddy"
//   - Tab-Switch (Anmelden / Registrieren) – beides nutzt die selben
//     Eingabefelder, nur das Submit-Verhalten unterscheidet sich
//   - Username + Passwort + Submit-Button
//   - Inline Error-/Success-Banner (rot/grün)
//
//  Props:
//   - onLogin(user, pass)    : async, throws bei Fehler
//   - onRegister(user, pass) : async, throws bei Fehler
//
//  State:
//   - isLogin : Toggle zwischen Login- und Registrier-Modus
//   - error/success : sichtbare Inline-Meldungen
//   - loading : verhindert Doppel-Submits + zeigt "Bitte warten..."
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";

export default function AuthScreen({ onLogin, onRegister }) {
  const [isLogin, setIsLogin] = useState(true);     // true=Login-Tab, false=Registrieren-Tab
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");           // rotes Banner
  const [loading, setLoading] = useState(false);    // sperrt den Submit
  const [success, setSuccess] = useState("");       // grünes Banner (nach Registrierung)

  // handleSubmit: einheitlicher Submit-Handler für beide Modi.
  // Bei Login: Token wird vom Parent gesetzt → Auto-Redirect.
  // Bei Registrieren: Erfolgsmeldung anzeigen + zurück auf Login-Tab.
  const handleSubmit = async (e) => {
    e.preventDefault(); //Verhindert das Seite neu lädt
    setError("");
    setSuccess("");
    setLoading(true); //Anfrage läuft gerade

    try {
      if (isLogin) {
        await onLogin(username, password);
      } else {
        await onRegister(username, password);
        setSuccess("Registrierung erfolgreich! Du kannst dich jetzt anmelden.");
        setIsLogin(true);  // automatisch in den Login-Tab wechseln
      }
    } catch (err) {
      // Backend-Fehlertext (z.B. "Benutzername bereits vergeben") anzeigen
      setError(err.message);
    } finally {
      setLoading(false); //Anfrage endet
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      // Radial-Glow oben → CodeBuddy-typischer Hintergrund
      background: "radial-gradient(circle at top, var(--accent-glow) 0%, transparent 38%), var(--bg-primary)",
      padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "40px 32px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
      }}>
        {/* Logo + Titel */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/logo.png" alt="CodeBuddy Logo" style={{
            width: 80, height: 80, objectFit: "contain",
            marginBottom: 8,
          }} />
          <div style={{
            fontSize: 30, fontWeight: 800, color: "var(--text-primary)",
            letterSpacing: "var(--tracking-title)",
          }}>
            CodeBuddy
          </div>
        </div>

        {/* Tab-Switch: Anmelden / Registrieren */}
        <div style={{
          display: "flex", marginBottom: 24, gap: 4,
          background: "var(--bg-primary)", borderRadius: "var(--radius-sm)", padding: 3,
        }}>
          {["Anmelden", "Registrieren"].map((label, i) => { // Geht beide Tab-Bezeichnungen durch und rendert für jede einen Button
            const active = i === 0 ? isLogin : !isLogin;
            return (
              <button key={label}
                // Beim Tab-Wechsel auch Banner zurücksetzen, sonst bleiben alte Meldungen stehen
                onClick={() => { setIsLogin(i === 0); setError(""); setSuccess(""); }} //Was soll passieren wenn man drauf klickt
                style={{
                  flex: 1, padding: "8px 0", borderRadius: "var(--radius-sm)",
                  border: "none", fontSize: "var(--fs-body)", fontWeight: 700, cursor: "pointer",
                  background: active ? "var(--bg-card)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                  transition: "all 0.2s",
                  boxShadow: active ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                }}
              >{label}</button>
            );
          })}
        </div>

        {/* Eingabe-Formular (form → Enter triggert Submit automatisch) */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "var(--fs-label)", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
              Benutzername
            </label>
            <input
              value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="z.B. max123"
              autoComplete="username" //Gespeicherte usernamen können Vorgeschlagen werden
              style={{
                width: "100%", padding: "11px 14px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg-primary)",
                color: "var(--text-primary)", fontSize: "var(--fs-body)", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: "var(--fs-label)", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
              Passwort
            </label>
            <input
              //Eingabe wird versteckt angezeigt
              //Wenn der Nutzer tippt, wird der neue Wert gespeichert
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Mind. 4 Zeichen"
              // autoComplete-Hint für Browser-Passwortmanager (current vs new)
              autoComplete={isLogin ? "current-password" : "new-password"} //Aktuelles oder neues Passowrt?
              style={{
                width: "100%", padding: "11px 14px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg-primary)",
                color: "var(--text-primary)", fontSize: "var(--fs-body)", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Inline-Error-Banner (nur bei vorhandenem Fehler) */}
          {error && (
            <div style={{
              padding: "8px 12px", borderRadius: "var(--radius-sm)",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444", fontSize: "var(--fs-caption)", marginBottom: 14, lineHeight: 1.55,
            }}>{error}</div>
          )}

          {/* Inline-Success-Banner (nach erfolgreicher Registrierung) */}
          {success && (
            <div style={{
              padding: "8px 12px", borderRadius: "var(--radius-sm)",
              background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)",
              color: "var(--success)", fontSize: "var(--fs-caption)", marginBottom: 14, lineHeight: 1.55,
            }}>{success}</div>
          )}

          {/* Submit-Button (Beschriftung wechselt je nach Modus + Loading) */}
          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "12px",
            borderRadius: "var(--radius-sm)",
            background: loading ? "var(--bg-card)" : "var(--accent-gradient)",
            border: "none",
            color: loading ? "var(--text-muted)" : "#fff",
            fontSize: "var(--fs-body-lg)", fontWeight: 700, cursor: loading ? "default" : "pointer",
            transition: "all 0.2s",
            letterSpacing: 0.2,
          }}>
            {loading ? "Bitte warten..." : isLogin ? "Anmelden" : "Registrieren"}
          </button>
        </form>
      </div>
    </div>
  );
}
