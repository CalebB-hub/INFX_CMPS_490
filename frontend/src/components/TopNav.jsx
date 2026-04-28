import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { logout } from "../services/authService";
import PhishFreeLogoText from "../Logos/Phish Free Logo Text.png";

const API_BASE = "http://localhost:8000/api";

export default function TopNav() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  function goToProfile() {
    setProfileOpen(false);
    navigate("/profile");
  }

  function goToSettings() {
    setProfileOpen(false);
    navigate("/settings");
  }

  async function handleLogout() {
    setProfileOpen(false);

    const token = localStorage.getItem("pf_auth_token");
    const refreshToken = localStorage.getItem("pf_refresh_token");

    if (token && refreshToken) {
      try {
        await fetch(`${API_BASE}/auth/logout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Always proceed with local logout even if backend call fails.
      }
    }

    localStorage.removeItem("pf_refresh_token");
    logout();
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    function onDocMouseDown(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }

    function onKeyDown(e) {
      if (e.key === "Escape") {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

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
          style={{ height: "32px", width: "auto", display: "block" }}
        />
      </div>

      <nav className="topnav__links" aria-label="Primary">
        <NavLink to="/home" className={({ isActive }) => (isActive ? "active" : "")}>
          Home
        </NavLink>

        <NavLink to="/learning" className={({ isActive }) => (isActive ? "active" : "")}>
          Learning
        </NavLink>

        <NavLink to="/grades" className={({ isActive }) => (isActive ? "active" : "")}>
          Grades
        </NavLink>

        <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>
          About
        </NavLink>
      </nav>

      <div className="topnav__right">
        <div className="topnav__profileMenu" ref={dropdownRef}>
          <button
            className="btn topnav__profileBtn"
            onClick={() => setProfileOpen((v) => !v)}
          >
            Profile
          </button>

          {profileOpen && (
            <div className="topnav__dropdown" role="menu">
              <button className="topnav__dropdownItem" role="menuitem" onClick={goToProfile}>
                My Profile
              </button>
              <button className="topnav__dropdownItem" role="menuitem" onClick={goToSettings}>
                Settings
              </button>
              <button className="topnav__dropdownItem" role="menuitem" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
