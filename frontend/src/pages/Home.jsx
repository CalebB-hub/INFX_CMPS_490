import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";
import { useNavigate } from "react-router-dom";
import { getAccessToken, logout, refreshAccessToken } from "../services/authService";

const API_BASE = "http://localhost:8000/api";
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

async function requestLessons(token) {
  const response = await fetch(`${API_BASE}/learning/lessons`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error("Lessons endpoint did not return JSON.");
  }

  const data = raw ? JSON.parse(raw) : {};

  if (!response.ok) {
    throw new Error(data.error || data.detail || "Failed to load lessons.");
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
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        let token = getAccessToken();
        if (!token) {
          throw new Error("You are not logged in.");
        }

        let dashboardData;
        let lessonsData;

        try {
          [dashboardData, lessonsData] = await Promise.all([
            requestDashboard(token),
            requestLessons(token),
          ]);
        } catch (err) {
          if (
            err.message === "Authentication credentials were not provided." ||
            err.message.includes("Given token not valid") ||
            err.message.includes("Token is invalid or expired")
          ) {
            token = await refreshAccessToken();
            [dashboardData, lessonsData] = await Promise.all([
              requestDashboard(token),
              requestLessons(token),
            ]);
          } else {
            throw err;
          }
        }

        if (mounted) {
          setDashboard(dashboardData);
          setLessons(Array.isArray(lessonsData?.lessons) ? lessonsData.lessons : []);
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
  }, [navigate]);

  const completedLessonCount = (() => {
    try {
      const raw = localStorage.getItem("quizGrades");
      const parsed = raw ? JSON.parse(raw) : {};
      const completedLessonIds = new Set(
        Object.values(parsed || {})
          .map((grade) => grade?.lessonId)
          .filter(Boolean)
          .map((lessonId) => String(lessonId))
      );
      return completedLessonIds.size;
    } catch {
      return 0;
    }
  })();

  const completedLessonIds = (() => {
    try {
      const raw = localStorage.getItem("quizGrades");
      const parsed = raw ? JSON.parse(raw) : {};
      return new Set(
        Object.values(parsed || {})
          .map((grade) => grade?.lessonId)
          .filter(Boolean)
          .map((lessonId) => String(lessonId))
      );
    } catch {
      return new Set();
    }
  })();

  const averageTestPercent = (() => {
    try {
      const raw = localStorage.getItem("testGrades");
      const parsed = raw ? JSON.parse(raw) : {};
      const percents = Object.values(parsed || {})
        .map((grade) => Number(grade?.percent))
        .filter((percent) => Number.isFinite(percent));

      if (percents.length === 0) {
        return 0;
      }

      return percents.reduce((sum, percent) => sum + percent, 0) / percents.length;
    } catch {
      return 0;
    }
  })();

  const assignedLessonCount = lessons.length;

  const simulationHistory = (() => {
    try {
      const raw = localStorage.getItem("testGrades");
      const parsed = raw ? JSON.parse(raw) : {};

      return Object.values(parsed || {})
        .filter((grade) => grade && grade.title && grade.submittedAt)
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
        .map((grade) => ({
          id: grade.testId || `${grade.title}-${grade.submittedAt}`,
          subject: grade.title,
          result: `${Math.round(Number(grade.percent) || 0)}%`,
          date: new Date(grade.submittedAt).toLocaleDateString(),
        }));
    } catch {
      return [];
    }
  })();

  const stats = {
    phishingScore: Math.round(averageTestPercent),
    lessonsCompleted: completedLessonCount,
    lessonsTotal: assignedLessonCount,
  };

  const assignedLessons = lessons
    .filter((lesson) => !completedLessonIds.has(String(lesson.lessonId)))
    .map((lesson) => ({
      id: `lesson-${lesson.lessonId}`,
      title: lesson.title,
      status: "Not completed",
    }));

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
      </main>
    </div>
  );
}
