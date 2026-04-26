//React starten, und in index.html rendern

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// createRoot(...) verbindet React mit dem HTML-Container aus index.html.
// document.getElementById("root") sucht: <div id="root"></div>
//--> und redert es dann dort in den Container
// .render(...) sagt dann: Rendere unsere App genau dort hinein.
createRoot(document.getElementById("root")).render(
  // StrictMode ist ein React-Pruefmodus fuer die Entwicklung.
  // Er hilft dabei, unsaubere oder veraltete Muster frueher zu erkennen.
  // Fuer die sichtbare UI ist er kein eigenes Element, sondern nur ein Wrapper.
  <StrictMode>
    <App />
  </StrictMode>
);
