import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { mockSignup } from "../mock/mockApi";
import PasswordStrength from "../components/PasswordStrength";
import PasswordToggleIcon from "../components/PasswordToggleIcon";
import { computeChecks } from "../utils/passwordUtils";

export default function SignupCompany() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", companyName: "", password: "" });
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

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
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
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
            const { checks } = computeChecks(formData.password, { username: formData.name, email: formData.email });
            const allPassed = Object.values(checks).every(Boolean);
            return <button className="btn" type="submit" disabled={status.loading || !allPassed}>Register Company</button>;
          })()}
        </form>
        <footer style={{marginTop: "20px", textAlign: "center"}}>
          <Link to="/signup" style={{color: "var(--accent)"}}>Back to selection</Link>
        </footer>
      </div>
    </div>
  );
}