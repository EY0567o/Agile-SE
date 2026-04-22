// ══════════════════════════════════════════════════════════════════
//  vorlesungen.js – Vorlesungsfolien als Text-Daten für den Bot
// ══════════════════════════════════════════════════════════════════
//  Quelle: Vorlesungsfolien_Prog1.pdf (Semester 1 – Einführung in die
//  Programmierung mit Java). Die Folien hier sind die inhaltliche
//  Wissensbasis für den Bot, wenn User fragen wie "wo steht das in den
//  Folien?" stellen.
//
//  Wichtig: Dieses Array wird in server.js NUR dann in den System-
//  Prompt eingehängt, wenn der User explizit nach den Folien fragt
//  (Signalwort-Filterung im /api/chat-Endpoint). Bei normalen Code-
//  Fragen bleiben die Folien unsichtbar für den Bot.
//
//  Struktur pro Folie:
//   - nr     : Foliennummer (1–10), muss dem PDF entsprechen
//   - titel  : Kurzer, aussagekräftiger Titel (wird vom Bot zitiert)
//   - text   : Fließtext mit allen Kernaussagen + einem Mini-Beispiel.
//              Bewusst KEINE Bulletpoints – Bots zitieren Fließtext
//              sauberer, und das Keyword-Matching profitiert davon.
// ══════════════════════════════════════════════════════════════════

export const VORLESUNGSFOLIEN = [
  {
    nr: 1,
    titel: "Was ist Programmieren?",
    text: `Programmieren heißt, einem Computer in einer festen Sprache schrittweise Anweisungen zu geben. Der Computer führt diese Anweisungen der Reihe nach aus – nicht mehr, nicht weniger. Eine Programmiersprache ist dabei das Werkzeug: sie definiert, welche Befehle es gibt und wie sie geschrieben werden müssen. In diesem Kurs arbeiten wir mit Java.

Ein Java-Programm besteht mindestens aus einer Klasse (class) als äußerer Hülle, einer main-Methode als Startpunkt und einer oder mehreren Anweisungen innerhalb. Die main-Methode ist immer der Ort, an dem ein Java-Programm startet. Ohne sie passiert nichts.

Beispiel:
public class Main {
    public static void main(String[] args) {
        // Hier stehen die Anweisungen
    }
}`,
  },
  {
    nr: 2,
    titel: "Die erste Ausgabe – Hello World",
    text: `Die einfachste Art, einem Programm etwas zu entlocken, ist eine Ausgabe auf der Konsole. Dazu nutzt man in Java System.out.println(...). Alles, was in den Klammern als Text (in Anführungszeichen) steht, wird Zeile für Zeile auf der Konsole ausgegeben. Der Zusatz ln am Ende (für "line") sorgt für einen Zeilenumbruch danach.

Das berühmte Hello-World-Programm ist traditionell das erste Programm, das man in einer neuen Sprache schreibt. Es prüft, ob alles richtig eingerichtet ist: vom Editor über den Compiler bis zur Ausführung.

Merke: Strings (Text) stehen immer in doppelten Anführungszeichen. Jede Anweisung endet mit einem Semikolon.

Beispiel:
System.out.println("Hello World!");`,
  },
  {
    nr: 3,
    titel: "Variablen und Datentypen",
    text: `Eine Variable ist ein benannter Speicherplatz für einen Wert. In Java muss beim Anlegen festgelegt werden, welchen Typ die Variable hat.

Die wichtigsten primitiven Datentypen sind: int für ganze Zahlen (z.B. 42, -7, 0), double für Kommazahlen (z.B. 3.14, -0.5), boolean für Wahrheitswerte (true oder false), und char für ein einzelnes Zeichen (z.B. 'A'). Für Text gibt es zusätzlich den Typ String – kein primitiver Typ, aber sehr häufig gebraucht.

Die Syntax zum Anlegen einer Variable ist immer: typ name = wert;

Einmal deklariert, kann der Wert einer Variable überall im Code per Namen angesprochen, ausgegeben oder verändert werden.

Beispiel:
int alter = 21;
double preis = 9.99;
boolean angemeldet = true;
String name = "Anna";`,
  },
  {
    nr: 4,
    titel: "Rechnen mit Operatoren",
    text: `Java kennt die üblichen arithmetischen Operatoren: + für Addition, - für Subtraktion, * für Multiplikation, / für Division und % für Modulo (den Rest einer Division). Diese Operatoren funktionieren sowohl mit direkten Zahlen (Literalen) als auch mit Variablen. Das Ergebnis kann in einer neuen Variable gespeichert oder direkt ausgegeben werden.

Reihenfolge: Es gilt die klassische Mathe-Regel Punkt vor Strich. Mit Klammern lässt sich die Reihenfolge gezielt beeinflussen.

Wichtig: Bei zwei int-Werten ist auch das Ergebnis ein int – d.h. 7 / 2 ergibt 3 (nicht 3,5). Für Kommaergebnisse braucht man double.

Beispiel:
int a = 10;
int b = 3;
int summe = a + b;         // 13
int rest = a % b;          // 1
int ergebnis = (a + b) * 2; // 26`,
  },
  {
    nr: 5,
    titel: "Entscheidungen – if und else",
    text: `Mit einer if-Abfrage kann ein Programm Entscheidungen treffen. Die Anweisung in den geschweiften Klammern wird nur ausgeführt, wenn die angegebene Bedingung wahr (true) ist. Mit else wird ein Alternativ-Block definiert, der ausgeführt wird, wenn die Bedingung nicht zutrifft.

Die wichtigsten Vergleichsoperatoren sind: == (gleich), != (ungleich), > (größer), < (kleiner), >= (größer oder gleich) und <= (kleiner oder gleich).

Mehrere Bedingungen lassen sich mit && (und) sowie || (oder) verknüpfen. Für mehrstufige Entscheidungen gibt es else if.

Beispiel:
int zahl = 15;
if (zahl > 10) {
    System.out.println("Groß");
} else {
    System.out.println("Klein");
}`,
  },
  {
    nr: 6,
    titel: "Schleifen – die for-Schleife",
    text: `Eine for-Schleife wiederholt einen Codeblock mehrfach. Sie eignet sich besonders dann, wenn man im Voraus weiß, wie oft sich etwas wiederholen soll.

Eine for-Schleife besteht aus drei Teilen: dem Start (Zählvariable anlegen, z.B. int i = 1), der Bedingung (solange diese wahr ist, läuft die Schleife, z.B. i <= 10) und dem Schritt (was nach jedem Durchlauf passieren soll, z.B. i++). Der Ausdruck i++ bedeutet "erhöhe i um 1". Analog gibt es i-- (verringere um 1).

Die Zähl-Variable – klassisch "i" genannt – kann innerhalb des Schleifen-Blocks verwendet werden, etwa zur Ausgabe oder als Index.

Beispiel:
for (int i = 1; i <= 10; i++) {
    System.out.println(i);
}
// Ausgabe: 1, 2, 3, ... 10`,
  },
  {
    nr: 7,
    titel: "Schleifen – die while-Schleife",
    text: `Eine while-Schleife läuft so lange, wie eine Bedingung wahr ist. Sie eignet sich, wenn die Anzahl der Durchläufe nicht im Voraus bekannt ist. Vor jedem Durchlauf wird die Bedingung geprüft. Ist sie falsch, springt das Programm zum Code hinter der Schleife.

Wichtig: Innerhalb der Schleife muss dafür gesorgt werden, dass die Bedingung irgendwann false wird – sonst läuft die Schleife endlos (Endlosschleife).

Im Unterschied zur for-Schleife gibt es hier keinen festen Aufbau mit Start, Bedingung und Schritt. Die Zähl-Variable (falls benötigt) muss selbst vor der Schleife angelegt und innen aktualisiert werden.

Faustregel: for nimmt man für eine feste Anzahl an Durchläufen, while nimmt man, bis eine Bedingung erfüllt ist.

Beispiel:
int i = 10;
while (i >= 1) {
    System.out.println(i);
    i--;
}
// Ausgabe: 10, 9, 8, ... 1`,
  },
  {
    nr: 8,
    titel: "Arrays – Sammlungen von Werten",
    text: `Ein Array ist eine feste Liste von Werten, die alle denselben Typ haben und unter einem gemeinsamen Namen zusammengefasst sind. Angelegt wird ein Array so: int[] zahlen = {1, 2, 3, 4, 5};

Arrays sind nullbasiert. Der Zugriff auf einzelne Werte erfolgt per Index, wobei das erste Element den Index 0 hat, das zweite den Index 1 und so weiter. Also liefert zahlen[0] die 1 und zahlen[4] die 5.

Die Länge eines Arrays erhält man mit array.length. Wichtig: length ist eine Eigenschaft, keine Methode – also ohne Klammern geschrieben.

Schleifen sind ideal, um alle Elemente eines Arrays nacheinander zu durchlaufen. Ein typisches Muster ist eine for-Schleife von 0 bis array.length - 1.

Beispiel:
int[] zahlen = {1, 2, 3, 4, 5};
for (int i = 0; i < zahlen.length; i++) {
    System.out.println(zahlen[i]);
}`,
  },
  {
    nr: 9,
    titel: "Methoden – eigene Bausteine",
    text: `Eine Methode ist ein wiederverwendbarer Block Code mit einem Namen. Statt denselben Code mehrfach zu schreiben, definiert man ihn einmal und ruft ihn dann beliebig oft auf.

Der Aufbau einer Methode besteht aus einem Rückgabetyp (welcher Typ wird zurückgegeben, z.B. int oder void), einem Namen (frei wählbar, sprechend benennen), Parametern (Eingabewerte in Klammern), einem Rumpf (der eigentliche Code, in geschweiften Klammern) und optional einem return, das ein Ergebnis zurückliefert. void als Rückgabetyp bedeutet, dass die Methode nichts zurückgibt.

Methoden werden mit ihrem Namen und den Argumenten aufgerufen. Das Ergebnis kann in einer Variable gespeichert oder direkt weiterverwendet werden.

Beispiel:
public static int addiere(int a, int b) {
    return a + b;
}

public static void main(String[] args) {
    int ergebnis = addiere(3, 4);
    System.out.println(ergebnis); // 7
}`,
  },
  {
    nr: 10,
    titel: "Strings und Klassen",
    text: `Strings sind in Java nicht nur Text, sondern Objekte mit eigenen Methoden. Die wichtigsten sind: text.length() für die Anzahl der Zeichen, text.toUpperCase() für den Text in Großbuchstaben und text.toLowerCase() für den Text in Kleinbuchstaben.

Strings sind unveränderlich: Methoden wie toUpperCase() ändern den Originalstring nicht, sondern liefern einen neuen zurück. Das Ergebnis muss also einer Variable zugewiesen oder direkt verwendet werden.

Klassen sind Baupläne für Objekte. Sie definieren, welche Daten (Attribute) ein Objekt enthält und was es kann (Methoden). Aus einer Klasse lassen sich beliebig viele Instanzen erzeugen: Student s = new Student();

Auf Attribute greift man mit der Punkt-Schreibweise zu, z.B. s.name = "Anna". Klassen sind der Grundstein der objektorientierten Programmierung und ermöglichen es, größere Programme klar zu strukturieren.

Beispiel:
class Student {
    String name;
    int alter;
}

Student s = new Student();
s.name = "Anna";
s.alter = 21;
System.out.println(s.name + ", " + s.alter);`,
  },
];

export default VORLESUNGSFOLIEN;