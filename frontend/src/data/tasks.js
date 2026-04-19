// ═══════════════════════════════════════════════════════════════
//  tasks.js – Die 10 Java-Lernaufgaben
// ═══════════════════════════════════════════════════════════════
//  Zentrale Quelle der Wahrheit für alle Aufgaben. Wird verwendet von:
//   - PathView.jsx     → Zickzack-Pfad mit allen Aufgaben
//   - LearnScreen.jsx  → Editor, Beschreibung, Konzept-Block, Fortschritts-Logik
//   - server.js        → KI-Kontext (Titel + Hints an LLM weitergeben)
//
//  Jede Aufgabe hat:
//   - id          : fortlaufende Nummer (1–10), bestimmt die Reihenfolge
//   - title       : wird in der Navigation und im Header angezeigt
//   - description : Aufgabentext für den Lernenden (kurz, was zu tun ist)
//   - explanation : Konzept-Erklärung (3–6 Sätze, didaktisch, ohne Vorwissen
//                   verständlich) – wird als ausklappbarer "💡 Konzept"-Block
//                   in der Aufgaben-Ansicht angezeigt
//   - hint        : Hinweis an die KI (wird im System-Prompt genutzt)
//   - starter     : Vorlagen-Code, den der User beim Öffnen sieht
//
//  Aufgaben sind didaktisch aufsteigend (Hello World → Klassen) und
//  werden sequenziell freigeschaltet.
// ═══════════════════════════════════════════════════════════════

const TASKS = [
  {
    id: 1,
    title: "Hello World",
    description:
      'Schreibe ein Java-Programm, das „Hello World!" auf der Konsole ausgibt.',
    explanation:
      'Ein Programm besteht aus Anweisungen, die der Computer der Reihe nach ausführt. Mit System.out.println(...) kannst du Text auf die Konsole schreiben – das ist die einfachste Möglichkeit, einem Java-Programm etwas mitzuteilen oder ein Ergebnis sichtbar zu machen. Die main-Methode ist der Startpunkt: jedes Java-Programm beginnt seine Ausführung dort. Der Name „Hello World" ist Tradition und meist das erste Programm, das man in einer neuen Sprache schreibt.',
    hint: "Nutze System.out.println() innerhalb der main-Methode.",
    starter: `public class Main {\n    public static void main(String[] args) {\n        // Dein Code hier\n    }\n}`,
  },
  {
    id: 2,
    title: "Variablen deklarieren",
    description:
      "Erstelle eine Variable vom Typ int mit dem Wert 42 und gib sie auf der Konsole aus.",
    explanation:
      "Eine Variable ist ein benannter Speicherplatz für einen Wert, den dein Programm später verwenden soll. In Java musst du beim Anlegen festlegen, welchen Typ die Variable hat – int ist der Typ für ganze Zahlen (z.B. 42, -7, 0). Die Syntax lautet immer: typ name = wert; (z.B. int alter = 21;). Sobald die Variable existiert, kannst du sie überall im Code per Namen ansprechen, also auch ausgeben oder verändern.",
    hint: "Deklariere mit: int zahl = 42;",
    starter: `public class Main {\n    public static void main(String[] args) {\n        // Erstelle eine int-Variable und gib sie aus\n    }\n}`,
  },
  {
    id: 3,
    title: "Zwei Zahlen addieren",
    description:
      "Deklariere zwei int-Variablen, addiere sie und gib das Ergebnis aus.",
    explanation:
      "Mit Operatoren wie +, -, *, / kannst du in Java rechnen. Du kannst dabei direkte Zahlen einsetzen – oder Variablen, die Zahlen enthalten. Das Ergebnis einer Berechnung lässt sich wiederum einer neuen Variable zuweisen oder direkt ausgeben. Die Reihenfolge der Operationen folgt den üblichen Mathe-Regeln (Punkt vor Strich), und mit Klammern kannst du sie gezielt ändern.",
    hint: "int summe = a + b;",
    starter: `public class Main {\n    public static void main(String[] args) {\n        // Zwei Zahlen addieren\n    }\n}`,
  },
  {
    id: 4,
    title: "If-Abfrage",
    description:
      'Prüfe, ob eine Zahl größer als 10 ist. Gib „Groß" oder „Klein" aus.',
    explanation:
      "Mit einer if-Abfrage kann dein Programm Entscheidungen treffen. Du gibst eine Bedingung an, die wahr oder falsch sein kann – z.B. zahl > 10. Ist die Bedingung wahr, wird der Codeblock in den geschweiften Klammern ausgeführt. Mit else definierst du, was sonst passieren soll. Die wichtigsten Vergleichsoperatoren sind >, <, >=, <=, == (gleich) und != (ungleich).",
    hint: "Nutze if (zahl > 10) { ... } else { ... }",
    starter: `public class Main {\n    public static void main(String[] args) {\n        int zahl = 15;\n        // If-Abfrage hier\n    }\n}`,
  },
  {
    id: 5,
    title: "For-Schleife",
    description:
      "Gib die Zahlen 1 bis 10 mit einer for-Schleife auf der Konsole aus.",
    explanation:
      "Eine for-Schleife wiederholt einen Codeblock mehrfach – ideal, wenn du im Voraus weißt, wie oft. Sie besteht aus drei Teilen: Start (z.B. int i = 1), Bedingung (z.B. i <= 10) und Schritt (z.B. i++, also „erhöhe i um 1“). Solange die Bedingung wahr ist, wird der Block ausgeführt und danach der Schritt durchgeführt. Die Zähler-Variable (meistens i genannt) kannst du im Block selbst verwenden, etwa zum Ausgeben.",
    hint: "for (int i = 1; i <= 10; i++) { ... }",
    starter: `public class Main {\n    public static void main(String[] args) {\n        // For-Schleife von 1 bis 10\n    }\n}`,
  },
  {
    id: 6,
    title: "While-Schleife",
    description:
      "Nutze eine while-Schleife, um die Zahlen 10 bis 1 rückwärts auszugeben.",
    explanation:
      "Eine while-Schleife läuft so lange, wie eine Bedingung wahr ist – ohne festen Zähler-Aufbau wie bei for. Vor jedem Durchlauf wird die Bedingung geprüft; ist sie falsch, springt das Programm zum Code dahinter. Wichtig: Du musst innerhalb der Schleife dafür sorgen, dass die Bedingung irgendwann falsch wird (z.B. mit i--), sonst läuft sie endlos. while eignet sich gut, wenn du nicht im Voraus weißt, wie viele Wiederholungen nötig sind.",
    hint: "int i = 10; while (i >= 1) { ... i--; }",
    starter: `public class Main {\n    public static void main(String[] args) {\n        // While-Schleife rückwärts\n    }\n}`,
  },
  {
    id: 7,
    title: "Array erstellen",
    description:
      "Erstelle ein int-Array mit 5 Zahlen und gib alle Elemente mit einer Schleife aus.",
    explanation:
      "Ein Array ist eine Liste von Werten, die alle denselben Typ haben und unter einem Namen zusammengefasst sind. Du legst es z.B. so an: int[] zahlen = {1, 2, 3, 4, 5}; Auf einzelne Werte greifst du per Index zu, beginnend bei 0 – zahlen[0] ist also das erste Element. Mit zahlen.length bekommst du die Anzahl der Elemente. Schleifen sind ideal, um alle Elemente nacheinander zu durchlaufen.",
    hint: "int[] zahlen = {1, 2, 3, 4, 5};",
    starter: `public class Main {\n    public static void main(String[] args) {\n        // Array erstellen und ausgeben\n    }\n}`,
  },
  {
    id: 8,
    title: "Methode schreiben",
    description:
      "Schreibe eine Methode addiere(int a, int b), die die Summe zurückgibt. Rufe sie in main auf.",
    explanation:
      "Eine Methode ist ein wiederverwendbarer Block Code mit einem Namen. Du übergibst ihr Werte (Parameter), sie macht etwas damit und kann ein Ergebnis (Rückgabewert) zurückliefern. Der Aufbau: Rückgabetyp name(Parameter) { ... return wert; }. Vorteil: Du musst denselben Code nicht mehrfach schreiben – einmal definieren, beliebig oft aufrufen. Der Rückgabetyp void bedeutet, dass die Methode nichts zurückgibt.",
    hint: "public static int addiere(int a, int b) { return a + b; }",
    starter: `public class Main {\n    // Methode hier definieren\n\n    public static void main(String[] args) {\n        // Methode aufrufen und Ergebnis ausgeben\n    }\n}`,
  },
  {
    id: 9,
    title: "String-Verarbeitung",
    description:
      "Lies einen String ein und gib seine Länge sowie den String in Großbuchstaben aus.",
    explanation:
      "Ein String in Java ist mehr als nur Text – er ist ein Objekt mit eigenen Methoden. Diese rufst du mit der Punkt-Schreibweise auf: text.length() liefert die Anzahl der Zeichen, text.toUpperCase() gibt den Text in Großbuchstaben zurück. Wichtig: Strings sind in Java unveränderlich – Methoden wie toUpperCase() ändern den Originalstring nicht, sondern liefern einen neuen zurück. Du musst das Ergebnis also einer Variable zuweisen oder direkt verwenden.",
    hint: "text.length() und text.toUpperCase()",
    starter: `public class Main {\n    public static void main(String[] args) {\n        String text = "CodeBuddy";\n        // Länge und Großbuchstaben ausgeben\n    }\n}`,
  },
  {
    id: 10,
    title: "Einfache Klasse",
    description:
      "Erstelle eine Klasse Student mit Name und Alter. Erzeuge ein Objekt und gib die Daten aus.",
    explanation:
      "Eine Klasse ist ein Bauplan für Objekte. Sie definiert, welche Daten ein Objekt enthält (Attribute) und was es kann (Methoden). Aus einer Klasse kannst du beliebig viele Objekte (Instanzen) erzeugen, z.B. mit: Student s = new Student(); Auf Attribute greifst du per Punkt zu: s.name = \"Anna\"; – genauso liest du sie wieder aus. Klassen sind das Herz der objektorientierten Programmierung und der Grundstein für größere Programme.",
    hint: "class Student { String name; int alter; }",
    starter: `class Student {\n    // Attribute hier\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        // Student-Objekt erstellen und ausgeben\n    }\n}`,
  },
];

export default TASKS;
