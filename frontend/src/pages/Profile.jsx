import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";
import { getUser, logout } from "../services/authService";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8000/api";
const USER_KEY = "pf_user";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfileData() {
      try {
        const token = localStorage.getItem("pf_auth_token");
        const [profileResponse, dashboardResponse] = await Promise.all([
          fetch(`${API_BASE}/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE}/dashboard/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const profileData = await profileResponse.json();
        const dashboardData = await dashboardResponse.json();

        if (!profileResponse.ok) {
          throw new Error(profileData.error || "Failed to load profile.");
        }

        if (!dashboardResponse.ok) {
          throw new Error(dashboardData.error || "Failed to load dashboard.");
        }

        if (mounted) {
          setUser(profileData);
          setDashboard(dashboardData);
          localStorage.setItem(USER_KEY, JSON.stringify(profileData));
        }
      } catch (err) {
        if (mounted) {
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
  }, []);

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
      } catch {
      }
    }

    localStorage.removeItem("pf_refresh_token");
    logout();
    navigate("/login", { replace: true });
  }

  const stats = {
    phishingScore: Math.round(dashboard?.tests?.averageScore || 0),
    lessonsCompleted: dashboard?.lessons?.totalCompleted || 0,
    lessonsTotal:
      (dashboard?.lessons?.totalCompleted || 0) +
      (dashboard?.assignments?.totalPending || 0) +
      (dashboard?.assignments?.totalOverdue || 0),
    simulationsCompleted: dashboard?.tests?.totalCompleted || 0,
  };

  const assignedLessons = [
    ...(dashboard?.assignments?.pending || []).map((assignment) => ({
      id: `pending-${assignment.assignmentId}`,
      title: assignment.testTitle,
      status: "Pending",
    })),
    ...(dashboard?.assignments?.overdue || []).map((assignment) => ({
      id: `overdue-${assignment.assignmentId}`,
      title: assignment.testTitle,
      status: "Overdue",
    })),
  ];

  const simulationHistory = (dashboard?.tests?.recentTests || []).map((test) => ({
    id: test.testId,
    subject: test.title,
    result: `${Math.round(test.score)}%`,
    date: new Date(test.dateTaken).toLocaleDateString(),
  }));

  const hasIncompleteTraining = stats.lessonsCompleted < stats.lessonsTotal;

  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>User Dashboard / Profile</h2>

        {loading && <p className="muted">Loading profile...</p>}
        {error && <div className="alert alert--error">{error}</div>}

        <div className="grid" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <div className="card">
            <p><b>Phishing Score</b></p>
            <p style={{ fontSize: 22, margin: 0 }}>{stats.phishingScore}%</p>
          </div>
          <div className="card">
            <p><b>Lessons Completed</b></p>
            <p style={{ fontSize: 22, margin: 0 }}>
              {stats.lessonsCompleted} / {stats.lessonsTotal}
            </p>
          </div>
          <div className="card">
            <p><b>Simulations Completed</b></p>
            <p style={{ fontSize: 22, margin: 0 }}>{stats.simulationsCompleted}</p>
          </div>
        </div>

        <section style={{ marginTop: 16 }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <h3 style={{ margin: 0 }}>Training Progress</h3>
              <button className="btn" type="button" onClick={() => navigate("/learning")}>
                Go to Learning
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              {assignedLessons.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>No assignments available.</p>
              ) : (
                assignedLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <span>{lesson.title}</span>
                    <b>{lesson.status}</b>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section style={{ marginTop: 16 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Simulation History</h3>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 0" }}>Subject</th>
                    <th style={{ textAlign: "left", padding: "8px 0" }}>Result</th>
                    <th style={{ textAlign: "left", padding: "8px 0" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {simulationHistory.length === 0 ? (
                    <tr style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                      <td style={{ padding: "8px 0" }} colSpan="3" className="muted">
                        No recent test activity.
                      </td>
                    </tr>
                  ) : (
                    simulationHistory.map((simulation) => (
                      <tr key={simulation.id} style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                        <td style={{ padding: "8px 0" }}>{simulation.subject}</td>
                        <td style={{ padding: "8px 0" }}><b>{simulation.result}</b></td>
                        <td style={{ padding: "8px 0" }}>{simulation.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 16 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Recommended Actions</h3>
            {hasIncompleteTraining ? (
              <div className="alert alert--warning">
                You still have unfinished training. Complete your remaining lessons to improve your phishing score.
              </div>
            ) : (
              <div className="alert alert--success">
                You're all caught up! Keep an eye out for new training assignments.
              </div>
            )}
          </div>
        </section>

        <section style={{ marginTop: 16 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Profile Information</h3>
            <p><b>Name:</b> {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "-"}</p>
            <p><b>Username:</b> {user?.email || "-"}</p>
            <p><b>Email:</b> {user?.email || "-"}</p>
            <p><b>Organization:</b> {dashboard?.user?.company || "-"}</p>
            <p><b>Role:</b> {user?.role || "-"}</p>

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
