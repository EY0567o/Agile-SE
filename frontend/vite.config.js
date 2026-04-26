//Frontend und Backend können über des reden
//Nur im Dev, in Produc finden die sich anders, wie gleiche Domain zum Beispiel
//React Übersetzer
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

//Damit kann ich Vite einstellen
export default defineConfig({
  plugins: [react()],
  //API Aufruf an Backend weiterleiten
  //Beispiel: wenn im frontend etwas mit "/api" kommt, dann macht vite draus "http://localhost:3001/api/login"
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});


//statt fetch("http://localhost:3001/api/login")
//einfach fetch("/api/login")