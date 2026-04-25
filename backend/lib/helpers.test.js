// ══════════════════════════════════════════════════════════════════
//  helpers.test.js – Unit-Tests fuer die reinen Helper-Funktionen
// ══════════════════════════════════════════════════════════════════
//  Ausfuehren mit:  npm test
//  Vitest findet diese Datei automatisch (Endung ".test.js").
//
//  Geprueft werden:
//   - extractClassName        (Java-Klassenname aus Quellcode lesen)
//   - buildFallbackLearningSummary (Fallback-Text wenn KI nicht hilft)
//   - isUsefulLearningSummary (Qualitaets-Check der KI-Antwort)
// ══════════════════════════════════════════════════════════════════

import { describe, test, expect } from "vitest";
import {
  extractClassName,
  buildFallbackLearningSummary,
  isUsefulLearningSummary,
} from "./helpers.js";

describe("extractClassName", () => {
  test("findet 'public class Foo' und liefert 'Foo'", () => {
    const code = "public class Foo { public static void main(String[] args) {} }";
    expect(extractClassName(code)).toBe("Foo");
  });

  test("findet 'class Bar' (ohne public) und liefert 'Bar'", () => {
    expect(extractClassName("class Bar {}")).toBe("Bar");
  });

  test("liefert Fallback 'Main' wenn keine Klasse gefunden wird", () => {
    expect(extractClassName("// nur ein Kommentar")).toBe("Main");
  });

  test("public hat Vorrang vor einer anderen class-Deklaration", () => {
    const code = "class Helper {} public class Hauptklasse {}";
    expect(extractClassName(code)).toBe("Hauptklasse");
  });
});

describe("buildFallbackLearningSummary", () => {
  test("nennt die geloesten Aufgaben beim Namen", () => {
    const result = buildFallbackLearningSummary({
      solvedTasks: [{ title: "Hello World" }, { title: "Variablen" }],
      nextTask: { title: "For-Schleife", description: "Schleifen ueben" },
    });
    expect(result).toContain("Hello World");
    expect(result).toContain("Variablen");
    expect(result).toContain("For-Schleife");
  });

  test("erkennt, wenn noch keine Aufgabe geloest wurde", () => {
    const result = buildFallbackLearningSummary({
      solvedTasks: [],
      nextTask: { title: "Hello World", description: "Erste Ausgabe" },
    });
    expect(result).toContain("noch keine Aufgabe");
  });

  test("erkennt, wenn alle Aufgaben fertig sind (nextTask = null)", () => {
    const result = buildFallbackLearningSummary({
      solvedTasks: [{ title: "Hello World" }],
      nextTask: null,
    });
    expect(result).toContain("alle Aufgaben");
  });
});

describe("isUsefulLearningSummary", () => {
  test("akzeptiert eine valide Zusammenfassung mit allen drei Ueberschriften", () => {
    const valid = `Was du schon geuebt hast: Du hast Variablen und Schleifen geuebt und kannst die Grundlagen anwenden.
Woran du gerade arbeitest: Aktuell uebst du die for-Schleife und ihre typischen Bestandteile.
Naechster sinnvoller Schritt: Probier die Aufgabe selbststaendig und hol dir nur gezielte Hinweise.`;
    expect(isUsefulLearningSummary(valid)).toBe(true);
  });

  test("lehnt zu kurze Antworten (< 120 Zeichen) ab", () => {
    expect(isUsefulLearningSummary("Zu kurz.")).toBe(false);
  });

  test("lehnt Antworten ohne die drei Ueberschriften ab", () => {
    const langeAberFalsch = "Hallo! ".repeat(40); // > 120 Zeichen, aber keine Ueberschriften
    expect(isUsefulLearningSummary(langeAberFalsch)).toBe(false);
  });

  test("lehnt null und undefined ab", () => {
    expect(isUsefulLearningSummary(null)).toBe(false);
    expect(isUsefulLearningSummary(undefined)).toBe(false);
  });
});
