//Frontend und Backend können über des reden
//Nur im Dev, in Produc finden die sich anders, wie gleiche Domain zum Beispiel
//React Übersetzer
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

//Damit kann ich Vite einstellen
export default defineConfig({
  plugins: [react()],
  //Wenn Datei geöfnnet werden, wird Vite benutzt
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});


