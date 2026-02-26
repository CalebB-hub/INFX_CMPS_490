import { useState } from "react";
import { mockForgotPassword } from "../mock/mockApi";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });
    try {
      const res = await mockForgotPassword(email.trim());
      setStatus({ loading: false, success: res.message || "Reset email sent.", error: "" });
    } catch (err) {
      setStatus({ loading: false, error: err.message || "Unable to send reset email.", success: "" });
    }
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <h2>Forgot password</h2>
        {status.error && <div className="alert alert--error">{status.error}</div>}
        {status.success && <div className="alert alert--success">{status.success}</div>}

        <form className="auth__form" onSubmit={handleSubmit}>
          <label>
            Email or username
            <input type="text" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button className="btn" type="submit" disabled={status.loading}>{status.loading ? "Sending..." : "Send reset email"}</button>
        </form>

        <footer style={{ marginTop: 16, textAlign: "center" }}>
          <Link to="/login" style={{ color: "var(--accent)" }}>Back to login</Link>
        </footer>
      </div>
    </div>
  );
}
