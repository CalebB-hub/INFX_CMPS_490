import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";

const API_BASE = "http://localhost:8000/api";

export default function Home() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const token = localStorage.getItem("pf_auth_token");
        const response = await fetch(`${API_BASE}/dashboard/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to load dashboard.");
        }

        if (mounted) {
          setDashboard(data);
        }
      } catch (err) {
        if (mounted) {
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

  const pendingAssignments = dashboard?.assignments?.pending || [];
  const overdueAssignments = dashboard?.assignments?.overdue || [];
  const recentTests = dashboard?.tests?.recentTests || [];

  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>Home</h2>
        <p className="muted">Welcome to Phish Free. This is your training dashboard.</p>

        {loading && <p className="muted">Loading dashboard...</p>}
        {error && <div className="alert alert--error">{error}</div>}

        {!loading && !error && dashboard && (
          <>
            <div
              className="grid"
              style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
            >
              <div className="card">
                <p><b>Pending Assignments</b></p>
                <p style={{ fontSize: 22, margin: 0 }}>{dashboard.assignments.totalPending}</p>
              </div>
              <div className="card">
                <p><b>Overdue Assignments</b></p>
                <p style={{ fontSize: 22, margin: 0 }}>{dashboard.assignments.totalOverdue}</p>
              </div>
              <div className="card">
                <p><b>Completed Tests</b></p>
                <p style={{ fontSize: 22, margin: 0 }}>{dashboard.tests.totalCompleted}</p>
              </div>
              <div className="card">
                <p><b>Lesson Average</b></p>
                <p style={{ fontSize: 22, margin: 0 }}>{Math.round(dashboard.lessons.averageScore || 0)}%</p>
              </div>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h3>Pending Assignments</h3>
              {pendingAssignments.length === 0 ? (
                <p className="muted">No pending assignments right now.</p>
              ) : (
                <ul>
                  {pendingAssignments.map((assignment) => (
                    <li key={assignment.assignmentId}>
                      {assignment.testTitle} due {new Date(assignment.dueDate).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h3>Overdue Assignments</h3>
              {overdueAssignments.length === 0 ? (
                <p className="muted">You have no overdue assignments.</p>
              ) : (
                <ul>
                  {overdueAssignments.map((assignment) => (
                    <li key={assignment.assignmentId}>
                      {assignment.testTitle} is {assignment.daysPastDue} day(s) overdue
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h3>Recent Test Activity</h3>
              {recentTests.length === 0 ? (
                <p className="muted">No completed tests yet.</p>
              ) : (
                <ul>
                  {recentTests.map((test) => (
                    <li key={test.testId}>
                      {test.title} scored {Math.round(test.score)}% on {new Date(test.dateTaken).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
