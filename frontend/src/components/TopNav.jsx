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
        <span className="topnav__user">
          {user?.name || "User"} ({user?.role || "n/a"})
        </span>
        <button className="btn btn--ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
