import { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom"; // Added Link
import { mockLogin } from "../mock/mockApi";
import PhishFreeFullLogo from "../Logos/Phish Free Full Logo.png";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = useMemo(() => {
    return location.state?.from || "/home";
  }, [location.state]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ loading: false, error: "" });
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: "" });

    try {
      const { token, user } = await mockLogin(email.trim(), password);
      localStorage.setItem("pf_auth_token", token);
      localStorage.setItem("pf_user", JSON.stringify(user));
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setStatus({ loading: false, error: err.message || "Invalid credentials." });
    } finally {
      setStatus((s) => ({ ...s, loading: false }));
    }
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <header style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          textAlign: "center", 
          marginBottom: "24px" 
        }}>
          <img 
            src={PhishFreeFullLogo} 
            alt="Phish Free Full Logo.png" 
            style={{ 
              width: "325px", 
              height: "auto", 
              marginBottom: "4px",
              display: "block"
            }} 
          />
          <h1 style={{ fontWeight: "800", fontSize: "1.8rem", margin: "0" }}>
            Sign in
          </h1>
          <p className="muted" style={{ margin: "4px 0 0 0", fontSize: "14px" }}>
            Securely access your training dashboard.
          </p>
        </header>

        {status.error && <div className="alert alert--error">{status.error}</div>}

        <form onSubmit={handleSubmit} className="auth__form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="student@example.com"
              required
            />
          </label>

          <label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Password</span>
              <Link to="/forgot-password" style={{ fontSize: "0.85rem", color: "var(--accent)" }}>Forgot password?</Link>
            </div>
            <div style={{ position: "relative" }}>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                required
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
          </label>

          <button className="btn" disabled={status.loading}>
            {status.loading ? "Checking..." : "Login"}
          </button>
        </form>

        <footer style={{ marginTop: "32px", textAlign: "center", borderTop: "1px solid var(--border-strong)", paddingTop: "20px" }}>
          {/* NEW: Link to Signup Role selection */}
          <p style={{ fontSize: "14px", marginBottom: "12px" }}>
            Don't have an account? <Link to="/signup" style={{ color: "var(--accent)", fontWeight: "bold" }}>Sign up here</Link>
          </p>
          
          <p className="muted" style={{ fontSize: "12px" }}>
            Mock credentials: <b>student@example.com</b> / <b>phishfree123</b>
          </p>
        </footer>
      </div>
    </div>
  );
}