import { useEffect, useMemo, useState } from "react";
import TopNav from "../components/TopNav";

const THEME_KEY = "pf_theme";
const FONT_KEY = "pf_font_size";

const FONT_SIZES = {
  sm: { label: "Small", value: "14px" },
  md: { label: "Medium", value: "16px" },
  lg: { label: "Large", value: "18px" },
  xl: { label: "Extra large", value: "20px" },
};

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
}

function applyFontSize(sizeKey) {
  const size = FONT_SIZES[sizeKey]?.value ?? FONT_SIZES.md.value;
  document.documentElement.style.setProperty("--base-font-size", size);
  localStorage.setItem(FONT_KEY, sizeKey);
}

export default function Settings() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");
  const [fontSizeKey, setFontSizeKey] = useState(() => localStorage.getItem(FONT_KEY) || "md");
  const fontOptions = useMemo(() => Object.entries(FONT_SIZES), []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    applyFontSize(fontSizeKey);
  }, [fontSizeKey]);

  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>Settings</h2>
        <p className="muted">Customize the experience with visual preferences.</p>

        <div className="card settings__card">
          <div className="settings__row">
            <div>
              <h3>Dark mode</h3>
              <p className="muted">Reduce glare and improve contrast.</p>
            </div>
            <label className="settings__toggle">
              <span className="settings__toggle-label">
                {theme === "dark" ? "On" : "Off"}
              </span>
              <input
                type="checkbox"
                checked={theme === "dark"}
                onChange={(event) => setTheme(event.target.checked ? "dark" : "light")}
              />
            </label>
          </div>

          <div className="settings__row settings__row--stack">
            <div>
              <h3>Letter size</h3>
              <p className="muted">Adjust base text size across the app.</p>
            </div>
            <label className="settings__select">
              <span className="settings__select-label">Font size</span>
              <select
                value={fontSizeKey}
                onChange={(event) => setFontSizeKey(event.target.value)}
              >
                {fontOptions.map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </main>
    </div>
  );
}
