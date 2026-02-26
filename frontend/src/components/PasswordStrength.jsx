import React from "react";

export function computeChecks(pw = "", { username, email, recentPasswords = [] } = {}) {
  const checks = {
    minLength: pw.length >= 12,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
    // default to false so the uniqueness box is unchecked until user types
    unique: false,
  };

  // uniqueness: not equal to any recent password and does not contain username/email
  if (pw) {
    // start assuming unique until proven otherwise
    checks.unique = true;

    if (recentPasswords && recentPasswords.length) {
      for (const r of recentPasswords) {
        if (!r) continue;
        if (pw === r) {
          checks.unique = false;
          break;
        }
      }
    }

    // check username tokens (split on whitespace) and full username
    if (checks.unique && username && username.trim()) {
      const uname = username.trim().toLowerCase();
      if (pw.toLowerCase() === uname || pw.toLowerCase().includes(uname)) {
        checks.unique = false;
      } else {
        const parts = uname.split(/\s+/).filter(Boolean);
        for (const p of parts) {
          if (p && pw.toLowerCase().includes(p)) {
            checks.unique = false;
            break;
          }
        }
      }
    }

    // check email local-part and full email
    if (checks.unique && email && email.trim()) {
      const em = email.trim().toLowerCase();
      const local = em.split("@")[0] || em;
      if (pw.toLowerCase() === em || pw.toLowerCase() === local || pw.toLowerCase().includes(em) || pw.toLowerCase().includes(local)) {
        checks.unique = false;
      }
    }
  }

  const score = Object.values(checks).reduce((s, v) => s + (v ? 1 : 0), 0);
  return { checks, score };
}

function CheckRow({ ok, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: ok ? "var(--muted)" : "#666" }}>
      <div style={{ width: 18, height: 18, borderRadius: 4, background: ok ? "#2ecc71" : "#eee", display: "flex", alignItems: "center", justifyContent: "center", color: ok ? "white" : "#999", fontSize: 12 }}>
        {ok ? "✓" : ""}
      </div>
      <div style={{ color: ok ? "#111" : "#666" }}>{label}</div>
    </div>
  );
}

export default function PasswordStrength({ password = "", username = "", email = "", recentPasswords = [], showChecklist = true }) {
  const { checks, score } = computeChecks(password, { username, email, recentPasswords });

  const barWidth = Math.min(100, (score / 6) * 100);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ height: 8, background: "var(--border-weak)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${barWidth}%`, height: "100%", background: score < 3 ? "#e74c3c" : score < 5 ? "#f1c40f" : "#2ecc71", transition: "width .18s ease" }} />
      </div>

      {showChecklist && (
        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          <CheckRow ok={checks.minLength} label={"Minimum length: at least 12 characters."} />
          <CheckRow ok={checks.upper && checks.lower} label={"Case sensitivity: include both uppercase (A-Z) and lowercase (a-z)."} />
          <CheckRow ok={checks.number} label={"Numbers: at least one numeric digit (0-9)."} />
          <CheckRow ok={checks.special} label={"Special characters: at least one symbol (e.g., !, @, #, $, %)."} />
          <CheckRow ok={checks.unique} label={"Uniqueness: not a recent password and does not contain your username/email."} />
        </div>
      )}
    </div>
  );
}
