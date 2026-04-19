import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";
import { useNavigate } from "react-router-dom";
import { getAccessToken, logout, refreshAccessToken } from "../services/authService";
import { API_BASE } from "../services/apiConfig";

async function requestDashboard(token) {
  const response = await fetch(`${API_BASE}/dashboard/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error("Dashboard endpoint did not return JSON.");
  }

  const data = raw ? JSON.parse(raw) : {};

  if (!response.ok) {
    throw new Error(data.error || data.detail || "Failed to load dashboard.");
  }

  return data;
}

async function fetchDashboard() {
  let token = getAccessToken();

  if (!token) {
    throw new Error("You are not logged in.");
  }

  try {
    return await requestDashboard(token);
  } catch (error) {
    if (
      error.message === "Authentication credentials were not provided." ||
      error.message.includes("Given token not valid") ||
      error.message.includes("Token is invalid or expired")
    ) {
      token = await refreshAccessToken();
      return requestDashboard(token);
    }

    throw error;
  }
}

export default function Home() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const data = await fetchDashboard();

        if (mounted) {
          setDashboard(data);
          setError("");
        }
      } catch (err) {
        if (mounted) {
          if (err.message === "Your session has expired. Please log in again.") {
            logout();
            navigate("/login", { replace: true });
            return;
          }
          setError(err.message || "Failed to load dashboard.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

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
        <h2>Home</h2>
        <p className="muted">
          Welcome back{dashboard?.user?.firstName ? `, ${dashboard.user.firstName}` : ""}. Here is your training overview.
        </p>

        {loading && <p className="muted">Loading dashboard...</p>}
        {!loading && error && <div className="alert alert--error">{error}</div>}

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
      </main>
    </div>
  );
}
