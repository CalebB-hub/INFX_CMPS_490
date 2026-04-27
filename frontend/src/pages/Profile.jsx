import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";
import { getUser, logout } from "../services/authService";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8000/api";
const USER_KEY = "pf_user";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfileData() {
      const token = localStorage.getItem("pf_auth_token");

      if (!token) {
        if (mounted) {
          setError("You are not logged in.");
          setLoading(false);
        }
        return;
      }

      try {
        const profileResponse = await fetch(`${API_BASE}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const profileData = await profileResponse.json();

        if (!profileResponse.ok) {
          throw new Error(profileData.error || "Failed to load profile.");
        }

        if (!mounted) return;

        setUser(profileData);
        localStorage.setItem(USER_KEY, JSON.stringify(profileData));
        setError("");
      } catch (err) {
        if (!mounted) return;

        if (!user) {
          setError(err.message || "Failed to load profile.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfileData();
    return () => {
      mounted = false;
    };
  }, [user]);

  async function handleLogout() {
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
      } catch (error) {
        console.warn("Logout request failed:", error);
      }
    }

    localStorage.removeItem("pf_refresh_token");
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>Profile</h2>

        {loading && <p className="muted">Loading profile...</p>}
        {error && <div className="alert alert--error">{error}</div>}

        <section style={{ marginTop: 16 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Profile Information</h3>
            <p><b>Name:</b> {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "-"}</p>
            <p><b>Email:</b> {user?.email || "-"}</p>
            <p><b>Member Since:</b> {user?.memberSince || "-"}</p>

            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button
                className="btn"
                type="button"
                onClick={() => navigate("/reset-password")}
              >
                Change Password
              </button>

              <button
                className="btn btn--danger"
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
