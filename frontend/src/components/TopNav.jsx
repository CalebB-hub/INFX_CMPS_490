import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getAccessToken, getUser, refreshAccessToken, logout } from "../services/authService";
import PhishFreeLogoText from "../Logos/Phish Free Logo Text.png";

const API_BASE = "http://localhost:8000/api";
const API_BASES = ["http://localhost:8000/api", "/api"];

export default function TopNav() {
  const navigate = useNavigate();
  const user = getUser();

  const [inboxOpen, setInboxOpen] = useState(false);
  const [inboxMessages, setInboxMessages] = useState([]);
  const [inboxError, setInboxError] = useState("");
  const [inboxLoading, setInboxLoading] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inboxRef = useRef(null);

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

  // close dropdown on outside click + Escape
  useEffect(() => {
    function onDocMouseDown(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (inboxRef.current && !inboxRef.current.contains(e.target)) {
        setInboxOpen(false);
      }
    }
    function onKeyDown(e) {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setInboxOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchWithAuth(url) {
      const token = getAccessToken();
      if (!token) throw new Error("You are not logged in.");

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status !== 401) return response;

      const refreshed = await refreshAccessToken();
      return fetch(url, {
        headers: { Authorization: `Bearer ${refreshed}` },
      });
    }

    async function loadInbox() {
      const token = getAccessToken();
      if (!token) return;

      setInboxLoading(true);
      setInboxError("");

      let lastError = null;
      for (const base of API_BASES) {
        try {
          const response = await fetchWithAuth(`${base}/learning/lessons`);
          const raw = await response.text();
          const data = raw ? JSON.parse(raw) : {};

          if (!response.ok) {
            throw new Error(data.error || "Failed to load inbox");
          }

          const lessons = data.lessons || [];
          const messages = lessons
            .filter((lesson) => lesson.completedAt)
            .map((lesson) => ({
              id: `lesson-${lesson.lessonId}`,
              text: `Test available for ${lesson.title}`,
              href: "/learning/quizzes",
            }));

          if (!mounted) return;
          setInboxMessages(messages);
          setInboxLoading(false);
          return;
        } catch (error) {
          lastError = error;
        }
      }

      if (!mounted) return;
      setInboxError(lastError?.message || "Failed to load inbox");
      setInboxLoading(false);
    }

    loadInbox();
    return () => {
      mounted = false;
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

      {/* Centered tabs */}
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
        {/* Inbox dropdown */}
        <div className="topnav__profileMenu" ref={inboxRef}>
          <button
            className="btn topnav__profileBtn"
            onClick={() => setInboxOpen((v) => !v)}
            aria-label="Inbox"
          >
            <span
              aria-hidden="true"
              style={{ display: "inline-flex", alignItems: "center" }}
            >
              <svg
                width="18"
                height="14"
                viewBox="0 0 18 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 2.5C1 1.67157 1.67157 1 2.5 1H15.5C16.3284 1 17 1.67157 17 2.5V11.5C17 12.3284 16.3284 13 15.5 13H2.5C1.67157 13 1 12.3284 1 11.5V2.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 2.5L9 8L16 2.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {inboxMessages.length > 0 && (
              <span style={{ marginLeft: 6, fontWeight: 700 }}>
                {inboxMessages.length}
              </span>
            )}
          </button>

          {inboxOpen && (
            <div className="topnav__dropdown" role="menu">
              {inboxLoading && (
                <div className="topnav__dropdownItem" role="menuitem">
                  Loading…
                </div>
              )}
              {!inboxLoading && inboxError && (
                <div className="topnav__dropdownItem" role="menuitem">
                  {inboxError}
                </div>
              )}
              {!inboxLoading && !inboxError && inboxMessages.length === 0 && (
                <div className="topnav__dropdownItem" role="menuitem">
                  No new messages
                </div>
              )}
              {!inboxLoading &&
                !inboxError &&
                inboxMessages.map((message) => (
                  <button
                    key={message.id}
                    className="topnav__dropdownItem"
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setInboxOpen(false);
                      navigate(message.href);
                    }}
                  >
                    {message.text}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="topnav__profileMenu" ref={dropdownRef}>
          <button
            className="btn topnav__profileBtn"
            onClick={() => setProfileOpen((v) => !v)}
          > 
            Profile
          </button>

          {profileOpen && (
            <div className="topnav__dropdown" role="menu">
              <button className="topnav__dropdownItem" role="menuitem" onClick={handleLogout}>
                Logout
              </button>
              <button className="topnav__dropdownItem" role="menuitem" onClick={goToProfile}>
                My Profile
              </button>
              <button className="topnav__dropdownItem" role="menuitem" onClick={goToSettings}>
                Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}