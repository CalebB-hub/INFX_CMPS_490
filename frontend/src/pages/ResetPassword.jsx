import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import PasswordStrength from "../components/PasswordStrength";
import { computeChecks } from "../utils/passwordUtils";
import { mockResetPassword } from "../mock/mockApi";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwFocused, setPwFocused] = useState(false);
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      setTimeout(() => navigate("/login"), 2000);
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
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
                style={{ width: "100%", paddingRight: "40px" }}
              />
              {password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0, display: "flex" }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              )}
            </div>
            <PasswordStrength password={password} showChecklist={pwFocused || !!password} />
          </label>

          <label>
            Confirm password
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={{ width: "100%", paddingRight: "40px" }}
              />
              {confirm && (
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0, display: "flex" }}
                  title={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              )}
            </div>
          </label>

          {(() => {
            // Uniqueness: block username/email as password if available
            // You may want to pass username/email from props or context
            const { checks } = computeChecks(password, {});
            const allPassed = Object.values(checks).every(Boolean);
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
