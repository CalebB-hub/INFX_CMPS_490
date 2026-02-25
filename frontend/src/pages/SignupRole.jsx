import { useNavigate, Link } from "react-router-dom";
import PhishFreeFullLogo from "../Logos/Phish Free Full Logo.png";

export default function SignupRole() {
  const navigate = useNavigate();

  return (
    <div className="auth">
      <div className="auth__card" style={{ textAlign: "center" }}>
        <header style={{ marginBottom: "24px" }}>
          <img src={PhishFreeFullLogo} alt="Logo" style={{ width: "280px", marginBottom: "12px" }} />
          <h1 style={{ fontWeight: "800", fontSize: "1.8rem" }}>Join Phish Free</h1>
          <p className="muted">Choose the account type that fits your needs.</p>
        </header>

        <div style={{ display: "grid", gap: "16px" }}>
          <button className="btn" onClick={() => navigate("/signup/individual")}>
            I am an Individual
          </button>
          <button className="btn btn--ghost" onClick={() => navigate("/signup/company")}>
            I am a Company / Organization
          </button>
        </div>

        <footer style={{ marginTop: "32px", borderTop: "1px solid var(--border-strong)", paddingTop: "20px" }}>
          Already have an account? <Link to="/login" style={{ color: "var(--accent)", fontWeight: "bold" }}>Login here</Link>
        </footer>
      </div>
    </div>
  );
}