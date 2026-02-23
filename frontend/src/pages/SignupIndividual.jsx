import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { mockSignup } from "../mock/mockApi";

export default function SignupIndividual() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });

    try {
      await mockSignup({ ...formData, role: "individual" });
      setStatus({ loading: false, success: "Success! Redirecting to login...", error: "" });
      
      // The Reroute: waits 2 seconds then moves to /login
      setTimeout(() => navigate("/login"), 2000); 
    } catch (err) {
      setStatus({ loading: false, error: err.message, success: "" });
    }
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <h2>Individual Signup</h2>
        {status.error && <div className="alert alert--error">{status.error}</div>}
        {status.success && <div className="alert alert--success">{status.success}</div>}
        
        <form className="auth__form" onSubmit={handleSubmit}>
          <label>Full Name <input name="name" required onChange={(e) => setFormData({...formData, name: e.target.value})} /></label>
          <label>Email <input type="email" required onChange={(e) => setFormData({...formData, email: e.target.value})} /></label>
          <label>Password <input type="password" required onChange={(e) => setFormData({...formData, password: e.target.value})} /></label>
          <button className="btn" type="submit" disabled={status.loading}>Create Account</button>
        </form>
        <footer style={{marginTop: "20px", textAlign: "center"}}>
          <Link to="/signup" style={{color: "var(--accent)"}}>Back to selection</Link>
        </footer>
      </div>
    </div>
  );
}