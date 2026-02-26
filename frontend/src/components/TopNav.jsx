import { NavLink, useNavigate } from "react-router-dom";
import { getUser } from "../services/authService";
import PhishFreeLogoText from "../Logos/Phish Free Logo Text.png";

export default function TopNav() {
  const navigate = useNavigate();
  const user = getUser();

  function goToProfile() {
    navigate("/profile");
  }

  return (
    <header className="topnav">
      <div 
        className="topnav__brand"
        onClick={() => navigate("/home")}
        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
      >
        <img 
          src={PhishFreeLogoText} 
          alt="Phish Free" 
          style={{ 
            height: "32px", 
            width: "auto",
            display: "block"
          }} 
        />
      </div>

      <nav className="topnav__links">
        <NavLink to="/home" className={({ isActive }) => (isActive ? "active" : "")}>
          Home
        </NavLink>

        <NavLink to="/learning" className={({ isActive }) => (isActive ? "active" : "")}>
          Learning
        </NavLink>

        <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>
          About
        </NavLink>
      </nav>

      <div className="topnav__right">

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginRight: "10px" }}>
          <span style={{ fontWeight: "700", fontSize: "14px" }}>
            {user?.name || "User"}
          </span>

          <span style={{
            fontSize: "10px",
            textTransform: "uppercase",
            backgroundColor: user?.role === "organization" ? "#7cd4fd" : "#FDAD6B",
            color: "#111",
            padding: "2px 8px",
            borderRadius: "12px",
            fontWeight: "900",
            marginTop: "2px"
          }}>
            {user?.role || "Guest"}
          </span>
        </div>

        {/* NEW PROFILE BUTTON */}
        <button
          className="btn btn--ghost"
          onClick={goToProfile}
        >
          Profile
        </button>

      </div>
    </header>
  );
}