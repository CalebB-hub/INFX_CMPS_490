import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import PasswordStrength, { computeChecks } from "../components/PasswordStrength";
import { mockResetPassword } from "../mock/mockApi";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwFocused, setPwFocused] = useState(false);
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setStatus({ loading: false, error: "Passwords do not match.", success: "" });
      return;
    }

    setStatus({ loading: true, error: "", success: "" });
    try {
      await mockResetPassword(token, password);
      setStatus({ loading: false, success: "Password updated. Redirecting to login...", error: "" });
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setStatus({ loading: false, error: err.message || "Unable to reset password.", success: "" });
    }
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <h2>Reset password</h2>
        {status.error && <div className="alert alert--error">{status.error}</div>}
        {status.success && <div className="alert alert--success">{status.success}</div>}

        <form className="auth__form" onSubmit={handleSubmit}>
          <label>
            New password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPwFocused(true)}
              onBlur={() => setPwFocused(false)}
            />
            <PasswordStrength password={password} showChecklist={pwFocused || !!password} />
          </label>

          <label>
            Confirm password
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>

          {(() => {
            const { checks } = computeChecks(password, {});
            const allPassed = checks.minLength && checks.upper && checks.lower && checks.number && checks.special && checks.unique;
            return (
              <button className="btn" type="submit" disabled={status.loading || !allPassed}>
                {status.loading ? "Updating..." : "Set new password"}
              </button>
            );
          })()}
        </form>

        <footer style={{ marginTop: 16, textAlign: "center" }}>
          <Link to="/login" style={{ color: "var(--accent)" }}>Back to login</Link>
        </footer>
      </div>
    </div>
  );
}
