import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { mockSignup } from "../mock/mockApi";
import PasswordStrength, { computeChecks } from "../components/PasswordStrength";

export default function SignupCompany() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", companyName: "", password: "" });
  const [pwFocused, setPwFocused] = useState(false);
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });

    try {
      await mockSignup({ ...formData, role: "organization" });
      setStatus({ loading: false, success: "Organization registered! Redirecting...", error: "" });
      
      // The Reroute: sends the admin to the login page
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setStatus({ loading: false, error: err.message, success: "" });
    }
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <h2>Organization Signup</h2>
        {status.error && <div className="alert alert--error">{status.error}</div>}
        {status.success && <div className="alert alert--success">{status.success}</div>}
        
        <form className="auth__form" onSubmit={handleSubmit}>
          <label>Admin Name <input required onChange={(e) => setFormData({...formData, name: e.target.value})} /></label>
          <label>Company Name <input required onChange={(e) => setFormData({...formData, companyName: e.target.value})} /></label>
          <label>Work Email <input type="email" required onChange={(e) => setFormData({...formData, email: e.target.value})} /></label>
          <label>
            Password
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onFocus={() => setPwFocused(true)}
              onBlur={() => setPwFocused(false)}
            />
            <PasswordStrength
              password={formData.password}
              username={formData.name}
              email={formData.email}
              showChecklist={pwFocused || !!formData.password}
            />
          </label>
          {(() => {
            const { checks } = computeChecks(formData.password, { username: formData.name, email: formData.email });
            const allPassed = checks.minLength && checks.upper && checks.lower && checks.number && checks.special && checks.unique;
            return (
              <button className="btn" type="submit" disabled={status.loading || !allPassed}>
                {status.loading ? "Registering..." : "Register Company"}
              </button>
            );
          })()}
        </form>
        <footer style={{marginTop: "20px", textAlign: "center"}}>
          <Link to="/signup" style={{color: "var(--accent)"}}>Back to selection</Link>
        </footer>
      </div>
    </div>
  );
}