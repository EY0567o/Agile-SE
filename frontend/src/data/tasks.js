const TASKS = [
  {
    id: 1,
    title: "Hello World",
    description:
      'Schreibe ein Java-Programm, das „Hello World!" auf der Konsole ausgibt.',
    hint: "Nutze System.out.println() innerhalb der main-Methode.",
    starter: `public class Main {\n    public static void main(String[] args) {\n        // Dein Code hier\n    }\n}`,
  },
  {
    id: 2,
    title: "Variablen deklarieren",
    description:
      "Erstelle eine Variable vom Typ int mit dem Wert 42 und gib sie auf der Konsole aus.",
    hint: "Deklariere mit: int zahl = 42;",
    starter: `public class Main {\n    public static void main(String[] args) {\n        // Erstelle eine int-Variable und gib sie aus\n    }\n}`,
  },
  {
    id: 3,
    title: "Zwei Zahlen addieren",
    description:
      "Deklariere zwei int-Variablen, addiere sie und gib das Ergebnis aus.",
    hint: "int summe = a + b;",
    starter: `public class Main {\n    public static void main(String[] args) {\n        // Zwei Zahlen addieren\n    }\n}`,
  },
  {
    id: 4,
    title: "If-Abfrage",
    description:
      'Prüfe, ob eine Zahl größer als 10 ist. Gib „Groß" oder „Klein" aus.',
    hint: "Nutze if (zahl > 10) { ... } else { ... }",
    starter: `public class Main {\n    public static void main(String[] args) {\n        int zahl = 15;\n        // If-Abfrage hier\n    }\n}`,
  },
  {
    id: 5,
    title: "For-Schleife",
    description:
      "Gib die Zahlen 1 bis 10 mit einer for-Schleife auf der Konsole aus.",
    hint: "for (int i = 1; i <= 10; i++) { ... }",
    starter: `public class Main {\n    public static void main(String[] args) {\n        // For-Schleife von 1 bis 10\n    }\n}`,
  },
  {
    id: 6,
    title: "While-Schleife",
    description:
      "Nutze eine while-Schleife, um die Zahlen 10 bis 1 rückwärts auszugeben.",
    hint: "int i = 10; while (i >= 1) { ... i--; }",
    starter: `public class Main {\n    public static void main(String[] args) {\n        // While-Schleife rückwärts\n    }\n}`,
  },
  {
    id: 7,
    title: "Array erstellen",
    description:
      "Erstelle ein int-Array mit 5 Zahlen und gib alle Elemente mit einer Schleife aus.",
    hint: "int[] zahlen = {1, 2, 3, 4, 5};",
    starter: `public class Main {\n    public static void main(String[] args) {\n        // Array erstellen und ausgeben\n    }\n}`,
  },
  {
    id: 8,
    title: "Methode schreiben",
    description:
      "Schreibe eine Methode addiere(int a, int b), die die Summe zurückgibt. Rufe sie in main auf.",
    hint: "public static int addiere(int a, int b) { return a + b; }",
    starter: `public class Main {\n    // Methode hier definieren\n\n    public static void main(String[] args) {\n        // Methode aufrufen und Ergebnis ausgeben\n    }\n}`,
  },
  {
    id: 9,
    title: "String-Verarbeitung",
    description:
      "Lies einen String ein und gib seine Länge sowie den String in Großbuchstaben aus.",
    hint: "text.length() und text.toUpperCase()",
    starter: `public class Main {\n    public static void main(String[] args) {\n        String text = "CodeBuddy";\n        // Länge und Großbuchstaben ausgeben\n    }\n}`,
  },
  {
    id: 10,
    title: "Einfache Klasse",
    description:
      "Erstelle eine Klasse Student mit Name und Alter. Erzeuge ein Objekt und gib die Daten aus.",
    hint: "class Student { String name; int alter; }",
    starter: `class Student {\n    // Attribute hier\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        // Student-Objekt erstellen und ausgeben\n    }\n}`,
  },
];

export default TASKS;
