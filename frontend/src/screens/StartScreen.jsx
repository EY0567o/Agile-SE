// ═══════════════════════════════════════════════════════════════
//  StartScreen.jsx – Landing-Page nach dem Login
// ═══════════════════════════════════════════════════════════════
//  Der Screen, den der User direkt nach dem Login sieht. Aufbau:
//   - Navbar      : Logo + Nav-Items (Lernpfad, Trainingsraum,
//                   "Was kann ich schon?") + Theme + Profil-Menü
//   - Hero        : Großer Titel + Untertitel + zwei CTA-Buttons
//   - Code-Preview: Stilisiertes "Mac-Fenster" mit Demo-Java-Code
//   - Modal       : "Was kann ich schon?" – KI-gestützter Lernstand
//
//  Props:
//   - onNavigate(key)   : "learn" | "code" → App.jsx wechselt den Screen
//   - theme/onToggleTheme : Dark/Light-Switch
//   - username          : Angezeigter Name im Profil-Menü
//   - onLogout          : Token verwerfen, zurück zum AuthScreen
//   - onDeleteAccount   : Konto samt allen Daten löschen
//   - token             : für den Learning-Summary-Aufruf
//
//  Hinweis zum Demo-Code:
//   Die winzige "Hand-made"-Syntaxhervorhebung unten (highlightLine,
//   highlightKeywords) ist bewusst minimal – sie dient NUR der
//   Hero-Preview. Im echten Editor (LearnScreen, CodeScreen) kommt
//   Monaco zum Einsatz.
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import useApi from "../hooks/useApi";

// Demo-Snippet für die Code-Preview unterhalb der Hero-Sektion
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

// Haupt-Navigation: Key wird an onNavigate() gegeben, das App.jsx schaltet
const NAV_ITEMS = [
  { key: "learn", label: "Lernpfad" },
  { key: "code",  label: "Trainingsraum" },
];

export default function StartScreen({ onNavigate, theme, onToggleTheme, username, onLogout, onDeleteAccount, token }) {
  const apiFetch = useApi(token);

  // UI-State für Profil-Dropdown + verschiedene Hover-Effekte
  const [profileOpen, setProfileOpen] = useState(false);
  const [hoverBtn, setHoverBtn] = useState(null);        // Hero-CTA Hover
  const [hoverNav, setHoverNav] = useState(null);        // Navbar-Item Hover
  const [hoverSummary, setHoverSummary] = useState(false);

  // State für das "Was kann ich schon?"-Modal
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  // "ai" = KI-Antwort, sonst automatisch aus dem Fortschritt erzeugt
  const [summarySource, setSummarySource] = useState("ai");
  const [summaryError, setSummaryError] = useState("");

  // handleLearningSummary:
  //   - Erster Klick: Modal öffnen + /api/learning-summary laden
  //   - Zweiter Klick (während offen): Modal schließen (Toggle-Verhalten)
  const handleLearningSummary = async () => {
    if (summaryLoading) return; // Doppel-Klicks während Laden ignorieren
    if (summaryOpen) {
      setSummaryOpen(false);
      return;
    }

    setSummaryOpen(true);
    setSummaryLoading(true);
    setSummaryError("");

    try {
      const res = await apiFetch("/api/learning-summary");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lernstands-Zusammenfassung konnte nicht geladen werden.");
      setSummaryText(data.summary || "");
      setSummarySource(data.source || "ai");
    } catch (err) {
      setSummaryError(err.message || "Lernstands-Zusammenfassung konnte nicht geladen werden.");
      setSummaryText("");
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflow: "auto",
      position: "relative",
    }}>
      {/* ─── Hintergrund-Glow (rein dekorativ, pointerEvents:none) ─── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: "none", zIndex: 0,
      }}>
        {/* Oberer großer Accent-Glow */}
        <div style={{
          position: "absolute",
          top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: 900, height: 900, borderRadius: "50%",
          background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)",
        }} />
        {/* Unterer rechter Grün-Hauch (success-Farbe, sehr dezent) */}
        <div style={{
          position: "absolute",
          bottom: "-20%", right: "-10%",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(74,222,128,0.04) 0%, transparent 60%)",
        }} />
      </div>

      {/* ─── Navbar (oben, sticky) ─── */}
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
        {/* Links: Logo + Marke */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="CodeBuddy Logo" style={{
            width: 52, height: 52, objectFit: "contain",
          }} />
          <span style={{
            fontSize: "var(--fs-brand)", fontWeight: 700, color: "var(--text-primary)",
            letterSpacing: "var(--tracking-tight)",
          }}>
            CodeBuddy
          </span>
        </div>

        {/* Rechts: Nav-Items, Summary, Theme, Profil */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Nav-Items aus NAV_ITEMS (Lernpfad, Trainingsraum) */}
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              onMouseEnter={() => setHoverNav(item.key)}
              onMouseLeave={() => setHoverNav(null)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                minHeight: 52,
                padding: "8px 18px",
                borderRadius: "var(--radius-sm)",
                border: hoverNav === item.key ? "1px solid var(--border-accent)" : "1px solid transparent",
                background: hoverNav === item.key ? "var(--bg-card)" : "transparent",
                color: hoverNav === item.key ? "var(--text-primary)" : "var(--text-secondary)",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {item.label}
            </button>
          ))}

          {/* "Was kann ich schon?"-Button (öffnet Summary-Modal) */}
          <button
            onClick={handleLearningSummary}
            onMouseEnter={() => setHoverSummary(true)}
            onMouseLeave={() => setHoverSummary(false)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              minHeight: 52,
              padding: "8px 18px",
              borderRadius: "var(--radius-sm)",
              border: (summaryOpen || hoverSummary) ? "1px solid var(--border-accent)" : "1px solid transparent",
              background: (summaryOpen || hoverSummary) ? "var(--bg-card)" : "transparent",
              color: (summaryOpen || hoverSummary) ? "var(--text-primary)" : "var(--text-secondary)",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            Was kann ich schon?
          </button>

          {/* Trenner + Theme-Toggle */}
          <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 8px" }} />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          {/* Profil-Bereich (nur wenn eingeloggt, also immer auf StartScreen) */}
          {username && (
            <>
            <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 8px" }} />
            <div style={{ position: "relative" }}>
              {/* Runder Avatar mit dem ersten Buchstaben des Usernames */}
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

              {/* Profil-Dropdown (Abmelden / Konto löschen) */}
              {profileOpen && (
                <>
                  {/* Unsichtbares Overlay → Klick irgendwo schließt das Menü */}
                  <div onClick={() => setProfileOpen(false)} style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9,
                  }} />
                  <div style={{
                    position: "absolute", top: 42, right: 0, zIndex: 10,
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)", padding: "12px 0",
                    minWidth: 180, boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  }}>
                    {/* Kopfzeile mit Username */}
                    <div style={{
                      padding: "8px 16px 12px", borderBottom: "1px solid var(--border)",
                      marginBottom: 4,
                    }}>
                      <div style={{ fontSize: "var(--fs-body)", fontWeight: 700, color: "var(--text-primary)" }}>
                        {username}
                      </div>
                      <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 2 }}>
                        Angemeldet
                      </div>
                    </div>
                    {/* Abmelden-Button */}
                    <button onClick={() => { setProfileOpen(false); onLogout(); }} style={{
                      width: "100%", padding: "8px 16px", background: "none", border: "none",
                      color: "var(--text-secondary)", fontSize: "var(--fs-caption)", cursor: "pointer",
                      textAlign: "left", transition: "background 0.15s",
                    }}
                      onMouseEnter={(e) => e.target.style.background = "var(--bg-card-hover)"}
                      onMouseLeave={(e) => e.target.style.background = "none"}
                    >Abmelden</button>
                    {/* Konto-löschen mit nativer confirm()-Rückfrage (irreversibel!) */}
                    <button onClick={() => {
                      if (confirm("Benutzerkonto wirklich löschen? Alle Daten gehen verloren.")) {
                        setProfileOpen(false);
                        onDeleteAccount();
                      }
                    }} style={{
                      width: "100%", padding: "8px 16px", background: "none", border: "none",
                      color: "#ef4444", fontSize: "var(--fs-caption)", cursor: "pointer",
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

      {/* ─── Hero-Sektion (Titel + Untertitel + CTAs) ─── */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "80px 32px 40px",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Titel (2-zeilig, responsiver Fontsize via clamp) */}
        <h1 style={{
          fontSize: "clamp(50px, 5.7vw, 68px)",
          fontWeight: 800,
          color: "var(--text-primary)",
          margin: "0 0 20px 0",
          letterSpacing: -1.5,
          lineHeight: 1.1,
          maxWidth: 980,
          animation: "fadeUp 0.6s ease 0.1s both",
        }}>
          Lerne Programmieren
          <br />
          {/* "mit CodeBuddy" mit dem Accent-Gradient als Text-Farbe */}
          <span style={{
            background: "var(--accent-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            mit CodeBuddy
          </span>
        </h1>

        {/* Untertitel / Tagline */}
        <p style={{
          fontSize: 20,
          color: "var(--text-secondary)",
          margin: "0 0 44px 0",
          maxWidth: 760,
          lineHeight: 1.65,
          paddingInline: 18,
          animation: "fadeUp 0.6s ease 0.2s both",
        }}>
          Dein intelligenter Lernbegleiter, der dir hilft, Java von Grund auf zu verstehen. Interaktiv, persönlich und in deinem Tempo.
        </p>

        {/* Call-to-Action-Buttons: Lernpfad (primär) + Trainingsraum (sekundär) */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          animation: "fadeUp 0.6s ease 0.3s both",
        }}>
          {/* Primärer CTA: Lernpfad starten */}
          <button
            onClick={() => onNavigate("learn")}
            onMouseEnter={() => setHoverBtn("learn")}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "11px 32px",
              borderRadius: "var(--radius-md)",
              background: "var(--accent-gradient)",
              border: "none",
              color: "#fff",
              fontSize: 17,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              // Leichter "Lift"-Effekt beim Hover
              transform: hoverBtn === "learn" ? "translateY(-2px)" : "none",
              boxShadow: hoverBtn === "learn"
                ? "0 12px 40px var(--accent-glow)"
                : "0 4px 16px var(--accent-glow)",
              letterSpacing: 0.2,
            }}
          >
            <img
              src="/Logo_lernpfad.png"
              alt="Lernpfad Logo"
              style={{
                width: 58,
                height: 58,
                objectFit: "contain",
              }}
            />
            Lernpfad starten
          </button>

          {/* Sekundärer CTA: Trainingsraum öffnen */}
          <button
            onClick={() => onNavigate("code")}
            onMouseEnter={() => setHoverBtn("code")}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "11px 28px",
              borderRadius: "var(--radius-md)",
              background: hoverBtn === "code" ? "var(--bg-card-hover)" : "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              fontSize: 17,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s",
              transform: hoverBtn === "code" ? "translateY(-2px)" : "none",
            }}
          >
            <img
              src="/Logo_Trainingsraum.png"
              alt="Trainingsraum Logo"
              style={{
                width: 58,
                height: 58,
                objectFit: "contain",
              }}
            />
            Trainingsraum öffnen
          </button>
        </div>
      </div>

      {/* ─── Code-Preview-Fenster (stilisiertes "Mac-Fenster") ─── */}
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
          {/* Titelleiste mit den typischen 3 Ampel-Punkten + Dateinamen */}
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

          {/* Code-Inhalt: Zeilenweise rendern + rudimentäre Syntax-Färbung */}
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
                {/* Zeilennummer (nicht selektierbar, gedämpft) */}
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

      {/* ─── "Was kann ich schon?"-Modal ─── */}
      {/* Zeigt eine KI-generierte Einschätzung des bisherigen Lernstands */}
      {summaryOpen && (
        <>
          {/* Overlay (klickbar zum Schließen) */}
          <div
            onClick={() => setSummaryOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "var(--bg-overlay)",
              zIndex: 29,
            }}
          />
          {/* Modal-Box (mittig positioniert) */}
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(560px, calc(100vw - 32px))",
            maxHeight: "min(70vh, 680px)",
            overflow: "auto",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
            padding: 24,
            zIndex: 30,
          }}>
            {/* Modal-Header: Titel + Schließen-Button */}
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 18,
            }}>
              <div>
                <div style={{
                  fontSize: "var(--fs-title-md)",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "var(--tracking-title)",
                }}>
                  Was kann ich schon?
                </div>
                {/* Quelle kennzeichnen (KI vs. Auto-Fallback) */}
                <div style={{
                  color: "var(--text-muted)",
                  fontSize: 12,
                  marginTop: 4,
                }}>
                  {summarySource === "ai" ? "KI-gestuetzte Einschaetzung" : "Automatisch aus deinem Lernstand erzeugt"}
                </div>
              </div>
              <button
                onClick={() => setSummaryOpen(false)}
                style={{
                  width: 34, height: 34,
                  borderRadius: "50%",
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: 18,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Modal-Inhalt: drei States (Loading / Error / Erfolg) */}
            {summaryLoading ? (
              <div style={{
                padding: "18px 0",
                color: "var(--text-secondary)",
                fontSize: "var(--fs-body)",
                lineHeight: "var(--lh-copy)",
              }}>
                CodeBuddy schaut sich deinen bisherigen Lernfortschritt an...
              </div>
            ) : summaryError ? (
              <div style={{
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#ef4444",
                fontSize: "var(--fs-caption)",
                lineHeight: 1.6,
              }}>
                {summaryError}
              </div>
            ) : (
              <div style={{
                whiteSpace: "pre-wrap", // Zeilenumbrüche aus dem KI-Text erhalten
                color: "var(--text-secondary)",
                fontSize: "var(--fs-body)",
                lineHeight: 1.8,
              }}>
                {summaryText}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Mini-Syntax-Highlighter NUR für die Hero-Preview ──────────────
// Bewusst minimal gehalten – ersetzt nicht Monaco im echten Editor.
// Logik: Kommentare → grau/kursiv, Strings → orange, Keywords → Accent.

// highlightLine: Eine Zeile verarbeiten
//   1. Zuerst Kommentare erkennen (`// ...`) → eigener Stil
//   2. Dann Strings isolieren, innerhalb der Strings KEIN Keyword-
//      Highlighting (sonst würde "return" in "return X" doppelt färben)
//   3. Rest normal durch highlightKeywords schicken
function highlightLine(line) {
  if (line.trim().startsWith("//")) {
    return <span style={{ color: "#6b7280", fontStyle: "italic" }}>{line}</span>;
  }

  if (line.includes('"')) {
    // Split per Regex: Strings in Anführungszeichen isolieren
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

// highlightKeywords: Färbt Java-Schlüsselwörter im gegebenen Text-Segment.
// \b splittet an Wort-Grenzen → jedes "Wort" kann isoliert geprüft werden.
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
