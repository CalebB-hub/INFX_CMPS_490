import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { mockLogin } from "../mock/mockApi";

const TOKEN_KEY = "pf_auth_token";
const USER_KEY = "pf_user";

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

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      navigate(redirectTo, { replace: true });
    } catch (err) {
      setStatus({ loading: false, error: err.message || "Login failed." });
      return;
    }

    setStatus((s) => ({ ...s, loading: false }));
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <h1>Sign in</h1>
        <p className="muted">
          Mock login for now. Use: <b>student</b> / <b>phishfree123</b>
        </p>

        {status.error && <div className="alert">{status.error}</div>}

        <form onSubmit={handleSubmit} className="auth__form">
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="student"
            />
          </label>

          <label>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="phishfree123"
            />
          </label>

          <button className="btn" disabled={status.loading}>
            {status.loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
