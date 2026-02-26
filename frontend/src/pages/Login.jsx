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

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ loading: false, error: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: "" });

    try {
      const { token, user } = await mockLogin(username.trim(), password);
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
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="student"
              required
            />
          </label>

          <label>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <Link to="/forgot-password" style={{ color: "var(--accent)", fontSize: 13 }}>
                Forgot password?
              </Link>
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
            Mock credentials: <b>student</b> / <b>phishfree123</b>
          </p>
        </footer>
      </div>
    </div>
  );
}