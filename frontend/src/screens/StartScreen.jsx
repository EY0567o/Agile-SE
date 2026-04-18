import { useState } from "react";
import ThemeToggle from "../components/ThemeToggle";

const DEMO_CODE = `public class Main {
    public static void main(String[] args) {
        String name = "Student";
        System.out.println(greet(name));
    }

    static String greet(String name) {
        return "Hallo, " + name + "!";
    }
}

// → Hallo, Student!`;

const NAV_ITEMS = [
  { key: "start", label: "Start", icon: "</>" },
  { key: "learn", label: "Lernpfad", icon: "◈" },
  { key: "code", label: "Trainingsraum", icon: ">_" },
];

export default function StartScreen({ onNavigate, theme, onToggleTheme, username, onLogout, onDeleteAccount }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [hoverBtn, setHoverBtn] = useState(null);
  const [hoverNav, setHoverNav] = useState(null);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflow: "auto",
      position: "relative",
    }}>
      {/* Background elements */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: "none", zIndex: 0,
      }}>
        <div style={{
          position: "absolute",
          top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: 900, height: 900, borderRadius: "50%",
          background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)",
        }} />
        <div style={{
          position: "absolute",
          bottom: "-20%", right: "-10%",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(74,222,128,0.04) 0%, transparent 60%)",
        }} />
      </div>

      {/* Navbar */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 48px",
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "var(--bg-header)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="CodeBuddy Logo" style={{
            width: 38, height: 38, objectFit: "contain",
          }} />
          <span style={{
            fontSize: 17, fontWeight: 700, color: "var(--text-primary)",
            letterSpacing: -0.5,
          }}>
            CodeBuddy
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => item.key !== "start" && onNavigate(item.key)}
              onMouseEnter={() => setHoverNav(item.key)}
              onMouseLeave={() => setHoverNav(null)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                border: item.key === "start" ? "1px solid var(--border-accent)" : "1px solid transparent",
                background: item.key === "start"
                  ? "var(--accent-glow)"
                  : hoverNav === item.key ? "var(--bg-card)" : "transparent",
                color: item.key === "start" ? "var(--accent)" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 12,
                opacity: 0.7,
              }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
          <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 8px" }} />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          {username && (
            <>
            <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 8px" }} />
            <div style={{ position: "relative" }}>
              <button onClick={() => setProfileOpen(!profileOpen)} style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "var(--accent-gradient)",
                border: "2px solid var(--border-accent)",
                color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                textTransform: "uppercase", transition: "all 0.2s",
              }}>
                {username.charAt(0)}
              </button>

              {profileOpen && (
                <>
                  <div onClick={() => setProfileOpen(false)} style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9,
                  }} />
                  <div style={{
                    position: "absolute", top: 42, right: 0, zIndex: 10,
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)", padding: "12px 0",
                    minWidth: 180, boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  }}>
                    <div style={{
                      padding: "8px 16px 12px", borderBottom: "1px solid var(--border)",
                      marginBottom: 4,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                        {username}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        Angemeldet
                      </div>
                    </div>
                    <button onClick={() => { setProfileOpen(false); onLogout(); }} style={{
                      width: "100%", padding: "8px 16px", background: "none", border: "none",
                      color: "var(--text-secondary)", fontSize: 12, cursor: "pointer",
                      textAlign: "left", transition: "background 0.15s",
                    }}
                      onMouseEnter={(e) => e.target.style.background = "var(--bg-card-hover)"}
                      onMouseLeave={(e) => e.target.style.background = "none"}
                    >Abmelden</button>
                    <button onClick={() => {
                      if (confirm("Benutzerkonto wirklich löschen? Alle Daten gehen verloren.")) {
                        setProfileOpen(false);
                        onDeleteAccount();
                      }
                    }} style={{
                      width: "100%", padding: "8px 16px", background: "none", border: "none",
                      color: "#ef4444", fontSize: 12, cursor: "pointer",
                      textAlign: "left", transition: "background 0.15s",
                    }}
                      onMouseEnter={(e) => e.target.style.background = "var(--bg-card-hover)"}
                      onMouseLeave={(e) => e.target.style.background = "none"}
                    >Konto löschen</button>
                  </div>
                </>
              )}
            </div>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "80px 32px 40px",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Heading */}
        <h1 style={{
          fontSize: 56,
          fontWeight: 800,
          color: "var(--text-primary)",
          margin: "0 0 20px 0",
          letterSpacing: -1.5,
          lineHeight: 1.1,
          maxWidth: 700,
          animation: "fadeUp 0.6s ease 0.1s both",
        }}>
          Lerne Programmieren{" "}
          <br />
          <span style={{
            background: "var(--accent-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            mit CodeBuddy
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 18,
          color: "var(--text-secondary)",
          margin: "0 0 44px 0",
          maxWidth: 520,
          lineHeight: 1.7,
          animation: "fadeUp 0.6s ease 0.2s both",
        }}>
          Dein intelligenter Lernbegleiter, der dir hilft, Java von Grund auf zu verstehen. Interaktiv, persönlich und in deinem Tempo.
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          animation: "fadeUp 0.6s ease 0.3s both",
        }}>
          <button
            onClick={() => onNavigate("learn")}
            onMouseEnter={() => setHoverBtn("learn")}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "14px 32px",
              borderRadius: "var(--radius-md)",
              background: "var(--accent-gradient)",
              border: "none",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: hoverBtn === "learn" ? "translateY(-2px)" : "none",
              boxShadow: hoverBtn === "learn"
                ? "0 12px 40px var(--accent-glow)"
                : "0 4px 16px var(--accent-glow)",
              letterSpacing: 0.2,
            }}
          >
            Lernpfad starten
            <span style={{ fontSize: 18 }}>→</span>
          </button>

          <button
            onClick={() => onNavigate("code")}
            onMouseEnter={() => setHoverBtn("code")}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "14px 28px",
              borderRadius: "var(--radius-md)",
              background: hoverBtn === "code" ? "var(--bg-card-hover)" : "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s",
              transform: hoverBtn === "code" ? "translateY(-2px)" : "none",
            }}
          >
            <span style={{
              fontFamily: "var(--font-mono)",
              color: "var(--accent)",
              fontSize: 14,
              fontWeight: 700,
            }}>{">_"}</span>
            Trainingsraum öffnen
          </button>
        </div>
      </div>

      {/* Code Preview Window */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        padding: "24px 48px 80px",
        position: "relative",
        zIndex: 1,
        animation: "fadeUp 0.8s ease 0.4s both",
      }}>
        <div style={{
          width: "100%",
          maxWidth: 680,
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.25), 0 0 0 1px var(--border)",
        }}>
          {/* Window bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            background: "var(--bg-card)",
            borderBottom: "1px solid var(--border)",
          }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#eab308" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{
              marginLeft: 12,
              fontSize: 12,
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}>
              Main.java
            </span>
          </div>

          {/* Code content */}
          <div style={{
            padding: "20px 24px",
            background: "var(--bg-editor)",
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            lineHeight: 1.8,
          }}>
            {DEMO_CODE.split("\n").map((line, i) => (
              <div key={i} style={{
                display: "flex", gap: 16,
              }}>
                <span style={{
                  color: "var(--text-muted)",
                  minWidth: 24,
                  textAlign: "right",
                  userSelect: "none",
                  fontSize: 13,
                  opacity: 0.5,
                }}>
                  {i + 1}
                </span>
                <span style={{ color: "var(--editor-text)" }}>
                  {highlightLine(line)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function highlightLine(line) {
  if (line.trim().startsWith("//")) {
    return <span style={{ color: "#6b7280", fontStyle: "italic" }}>{line}</span>;
  }

  if (line.includes('"')) {
    const parts = line.split(/(".*?")/g);
    return parts.map((part, i) =>
      part.startsWith('"') ? (
        <span key={i} style={{ color: "#e07b53" }}>{part}</span>
      ) : (
        <span key={i}>{highlightKeywords(part)}</span>
      )
    );
  }

  return highlightKeywords(line);
}

function highlightKeywords(text) {
  const keywords = ["public", "class", "static", "void", "String", "return"];
  const parts = text.split(/\b/);
  return parts.map((part, i) =>
    keywords.includes(part) ? (
      <span key={i} style={{ color: "var(--accent)", fontWeight: 600 }}>{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
