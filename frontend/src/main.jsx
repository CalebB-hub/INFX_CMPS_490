import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/global.css";

const THEME_KEY = "pf_theme";
const FONT_KEY = "pf_font_size";
const FONT_SIZES = {
  sm: "14px",
  md: "16px",
  lg: "18px",
  xl: "20px",
};

function applySavedPreferences() {
  try {
    const theme = localStorage.getItem(THEME_KEY) || "light";
    const sizeKey = localStorage.getItem(FONT_KEY) || "md";
    const size = FONT_SIZES[sizeKey] || FONT_SIZES.md;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.setProperty("--base-font-size", size);
  } catch {
    // Ignore storage errors and keep defaults.
  }
}

applySavedPreferences();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
