import React from "react";
import { computeChecks } from "../utils/passwordUtils";

export default function PasswordStrength({ password, username, email, showChecklist }) {
  const { checks } = computeChecks(password, { username, email });
  
  // Calculate score
  const passedCount = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  
  // Determine color based on strength
  let color = "var(--error, red)";
  if (passedCount >= 3) color = "orange";
  if (passedCount >= 5) color = "#84cc16"; // lime green
  if (passedCount === totalChecks) color = "var(--success, green)";

  const width = `${(passedCount / totalChecks) * 100}%`;

  return (
    <div className="password-strength">
      <div style={{ height: "4px", background: "#eee", marginTop: "8px", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ width, background: color, height: "100%", transition: "all 0.3s ease" }} />
      </div>
      
      {showChecklist && (
        <ul style={{ listStyle: "none", padding: 0, marginTop: "8px", fontSize: "0.85rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
          <li style={{ color: checks.minLength ? "var(--success, green)" : "var(--muted, #888)" }}>
            {checks.minLength ? "✓" : "○"} 8+ chars
          </li>
          <li style={{ color: checks.upper ? "var(--success, green)" : "var(--muted, #888)" }}>
            {checks.upper ? "✓" : "○"} Uppercase
          </li>
          <li style={{ color: checks.lower ? "var(--success, green)" : "var(--muted, #888)" }}>
            {checks.lower ? "✓" : "○"} Lowercase
          </li>
          <li style={{ color: checks.number ? "var(--success, green)" : "var(--muted, #888)" }}>
            {checks.number ? "✓" : "○"} Number
          </li>
          <li style={{ color: checks.special ? "var(--success, green)" : "var(--muted, #888)" }}>
            {checks.special ? "✓" : "○"} Special char
          </li>
          <li style={{ color: checks.unique ? "var(--success, green)" : "var(--muted, #888)" }}>
            {checks.unique ? "✓" : "○"} Unique
          </li>
        </ul>
      )}
    </div>
  );
}