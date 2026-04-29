import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PhishFreeFullLogo from "../Logos/Phish Free Full Logo.png";
import PasswordStrength from "../components/PasswordStrength";
import PasswordToggleIcon from "../components/PasswordToggleIcon";
import { computeChecks } from "../utils/passwordUtils";

import { API_BASE } from '../config';

export default function SignupIndividual() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });

    try {
      const [firstName, ...rest] = formData.name.trim().split(/\s+/);
      const lastName = rest.join(" ");

      if (!firstName || !lastName) {
        throw new Error("Please enter both a first and last name.");
      }

      const response = await fetch(`${API_BASE}/auth/signup/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          firstName,
          lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details?.join(" ") || data.error || "Unable to create account.");
      }

      setStatus({ loading: false, success: "Success! Redirecting to login...", error: "" });
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setStatus({ loading: false, error: err.message || "Unable to create account.", success: "" });
    }
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          <img
            src={PhishFreeFullLogo}
            alt="Phish Free Full Logo.png"
            style={{
              width: "350px",
              height: "auto",
              marginBottom: "8px",
              display: "block",
            }}
          />
          <h1 style={{ fontWeight: "800", fontSize: "1.8rem", margin: "0" }}>
            Sign up
          </h1>
        </header>
        {status.error && <div className="alert alert--error">{status.error}</div>}
        {status.success && <div className="alert alert--success">{status.success}</div>}

        <form className="auth__form" onSubmit={handleSubmit}>
          <label>
            Full Name{" "}
            <input
              name="name"
              required
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </label>
          <label>
            Email{" "}
            <input
              type="email"
              required
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </label>
          <label>
            Password
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
                style={{ width: "100%", paddingRight: "40px" }}
              />
              {formData.password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0, display: "flex" }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <PasswordToggleIcon showPassword={showPassword} />
                </button>
              )}
            </div>
            <PasswordStrength password={formData.password} username={formData.name} email={formData.email} showChecklist={pwFocused || !!formData.password} />
          </label>
          {(() => {
            const { checks, containsPersonalInfo } = computeChecks(formData.password, { username: formData.name, email: formData.email });
            const allPassed = Object.values(checks).every(Boolean);
            return (
              <button className="btn" type="submit" disabled={status.loading || !allPassed || containsPersonalInfo}>
                Create Account
              </button>
            );
          })()}
        </form>
        <footer style={{ marginTop: "32px", textAlign: "center", borderTop: "1px solid var(--border-strong)", paddingTop: "20px" }}>
          <p style={{ fontSize: "14px", marginBottom: "12px" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--accent)", fontWeight: "bold" }}>
              Login Here
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
