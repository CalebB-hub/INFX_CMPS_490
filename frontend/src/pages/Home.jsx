import { useEffect, useMemo, useState } from "react";
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

async function loadDashboardAndLessons(token) {
  try {
    const [dashboardData, lessonsData] = await Promise.all([
      requestDashboard(token),
      requestLessons(token),
    ]);
    return { dashboardData, lessonsData, dashboardError: "" };
  } catch (err) {
    if (
      err.message === "Authentication credentials were not provided." ||
      err.message.includes("Given token not valid") ||
      err.message.includes("Token is invalid or expired")
    ) {
      throw err;
    }

    const lessonsData = await requestLessons(token);
    return {
      dashboardData: null,
      lessonsData,
      dashboardError: err.message || "Failed to load dashboard.",
    };
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
        let dashboardError = "";

        try {
          ({ dashboardData, lessonsData, dashboardError } =
            await loadDashboardAndLessons(token));
        } catch (err) {
          if (
            err.message === "Authentication credentials were not provided." ||
            err.message.includes("Given token not valid") ||
            err.message.includes("Token is invalid or expired")
          ) {
            token = await refreshAccessToken();
            ({ dashboardData, lessonsData, dashboardError } =
              await loadDashboardAndLessons(token));
          } else {
            throw err;
          }
        }

        if (mounted) {
          setDashboard(dashboardData);
          setLessons(Array.isArray(lessonsData?.lessons) ? lessonsData.lessons : []);
          setError(dashboardError);
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

  const quizGradesByLessonId = useMemo(() => {
    try {
      const raw = localStorage.getItem("quizGrades");
      const parsed = raw ? JSON.parse(raw) : {};
      return Object.values(parsed || {}).reduce((acc, grade) => {
        if (grade?.lessonId !== null && grade?.lessonId !== undefined) {
          acc[String(grade.lessonId)] = grade;
        }
        return acc;
      }, {});
    } catch {
      return {};
    }
  }, []);

  const testGradesByLessonId = useMemo(() => {
    try {
      const raw = localStorage.getItem("testGrades");
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }, []);

  const lessonProgress = useMemo(
    () =>
      lessons.map((lesson) => {
        const lessonId = String(lesson.lessonId);
        const quizGrade = quizGradesByLessonId[lessonId] || null;
        const testGrade = testGradesByLessonId[lessonId] || null;
        const completedTests = Object.keys(testGrade?.emails || {}).length;
        const isCompleted = Boolean(quizGrade) && completedTests >= 4;

        return {
          id: `lesson-${lesson.lessonId}`,
          title: lesson.title,
          status: isCompleted ? "Completed" : "Not completed",
          isCompleted,
        };
      }),
    [lessons, quizGradesByLessonId, testGradesByLessonId]
  );

  const completedLessonCount = lessonProgress.filter(
    (lesson) => lesson.isCompleted
  ).length;

  const averageTestPercent = (() => {
    try {
      const raw = localStorage.getItem("testGrades");
      const parsed = raw ? JSON.parse(raw) : {};
      const percents = Object.values(parsed || {})
        .filter((grade) => grade && grade.finalPercent !== null && grade.finalPercent !== undefined)
        .map((grade) => Number(grade.finalPercent))
        .filter((percent) => Number.isFinite(percent));

      if (percents.length === 0) {
        return 0;
      }

      return percents.reduce((sum, percent) => sum + percent, 0) / percents.length;
    } catch {
      return 0;
    }
  })();

  const simulationHistory = (() => {
    try {
      const raw = localStorage.getItem("testGrades");
      const parsed = raw ? JSON.parse(raw) : {};
      const results = Object.values(parsed || {}).filter(
        (grade) => grade && grade.finalPercent !== null && grade.finalPercent !== undefined
      );

      if (results.length === 0) {
        return [];
      }

      const average =
        results.reduce((sum, result) => sum + (Number(result.finalPercent) || 0), 0) /
        results.length;
      const latestSubmission = results.reduce((latest, result) => {
        if (!latest) return result.finalizedAt || result.submittedAt;
        return new Date(result.finalizedAt || result.submittedAt || 0) > new Date(latest || 0)
          ? result.finalizedAt || result.submittedAt
          : latest;
      }, null);

      return [
        {
          id: "phishing-email-test",
          subject: "Phishing Email Test",
          result: `${Math.round(average)}%`,
          date: latestSubmission
            ? new Date(latestSubmission).toLocaleDateString()
            : "Submission saved",
        },
      ];
    } catch {
      return [];
    }
  })();

  const stats = {
    phishingScore: Math.round(averageTestPercent),
    lessonsCompleted: completedLessonCount,
    lessonsTotal: lessons.length,
  };

  return (
    <div>
      <TopNav />
      <main className="page">
        <style>
          {`
            @keyframes dashboard-loader-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
        <h2>Home</h2>
        <p className="muted">
          Welcome back{dashboard?.user?.firstName ? `, ${dashboard.user.firstName}` : ""}. Here is your training overview.
        </p>

        {loading && (
          <div className="card" style={{ minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "3px solid rgba(0,0,0,0.12)",
                  borderTopColor: "var(--accent)",
                  animation: "dashboard-loader-spin 0.9s linear infinite",
                }}
              />
              <div className="muted" style={{ fontWeight: 600 }}>
                Loading Dashboard...
              </div>
            </div>
          </div>
        )}
        {!loading && error && <div className="alert alert--error">{error}</div>}

        <div className="grid" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <div className="card">
            <p><b>Average Test Score</b></p>
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
                Go To Learning
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              {lessonProgress.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>No assignments available.</p>
              ) : (
                lessonProgress.map((lesson) => (
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
