import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { mockSignup } from "../mock/mockApi";

export default function SignupCompany() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", companyName: "", password: "" });
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
          <label>Password <input type="password" required onChange={(e) => setFormData({...formData, password: e.target.value})} /></label>
          <button className="btn" type="submit" disabled={status.loading}>Register Company</button>
        </form>
        <footer style={{marginTop: "20px", textAlign: "center"}}>
          <Link to="/signup" style={{color: "var(--accent)"}}>Back to selection</Link>
        </footer>
      </div>
    </div>
  );
}