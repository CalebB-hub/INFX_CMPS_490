import { NavLink, useNavigate } from "react-router-dom";
import { getUser, logout } from "../services/authService";

export default function TopNav() {
  const navigate = useNavigate();
  const user = getUser();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="topnav">
      <div className="topnav__brand">Phish Free</div>

      <nav className="topnav__links">
        <NavLink to="/home" className={({ isActive }) => (isActive ? "active" : "")}>
          Home
        </NavLink>
        <NavLink to="/learning" className={({ isActive }) => (isActive ? "active" : "")}>
          Learning
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? "active" : "")}>
          Profile
        </NavLink>
      </nav>

      <div className="topnav__right">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginRight: "10px" }}>
          <span style={{ fontWeight: "700", fontSize: "14px" }}>{user?.name || "User"}</span>
          {/* ROLE BADGE */}
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
        <button className="btn btn--ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}