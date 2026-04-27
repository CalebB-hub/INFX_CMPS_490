import { useNavigate, Link } from "react-router-dom";
import PhishFreeFullLogo from "../Logos/Phish Free Full Logo.png";

export default function SignupRole() {
  const navigate = useNavigate();

  return (
    <div className="auth">
      <div className="auth__card" style={{ textAlign: "center" }}>
        <header style={{ marginBottom: "24px" }}>
          <img src={PhishFreeFullLogo} alt="Logo" style={{ width: "350px", marginBottom: "8px" }} />
          <h1 style={{ fontWeight: "800", fontSize: "1.8rem" }}>Welcome to Phish Free</h1>
          <p className="muted">Create an account or Login to continue.</p>
        </header>

        <div style={{ display: "grid", gap: "16px" }}>
          <button className="btn" onClick={() => navigate("/signup/individual")}>
            Sign Up
          </button>
          <button className="btn" onClick={() => navigate("/login")}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
