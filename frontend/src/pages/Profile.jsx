import TopNav from "../components/TopNav";
import { getUser, logout } from "../services/authService";
import { useNavigate } from "react-router-dom";


export default function Profile() {
  const user = getUser();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  // ----- MOCK DATA (replace later with real API data) -----
  const stats = {
    phishingScore: 72, // %
    lessonsCompleted: 4,
    lessonsTotal: 6,
    simulationsCompleted: 3,
  };

  const assignedLessons = [
    { id: "l1", title: "Phishing Basics", status: "Completed" },
    { id: "l2", title: "Suspicious Links", status: "In Progress" },
    { id: "l3", title: "Attachments Safety", status: "Not Started" },
  ];

  const simulationHistory = [
    { id: "s1", subject: "Password Reset Required", result: "Reported (PASS)", date: "Feb 20, 2026" },
    { id: "s2", subject: "Urgent Invoice Attached", result: "Clicked (FAIL)", date: "Feb 18, 2026" },
    { id: "s3", subject: "Security Alert", result: "Ignored (PASS)", date: "Feb 15, 2026" },
  ];

  const hasIncompleteTraining = stats.lessonsCompleted < stats.lessonsTotal;
  // -------------------------------------------------------

  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>User Dashboard / Profile</h2>

        {/* Personal stats cards */}
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

        {/* Training progress */}
        <section style={{ marginTop: 16 }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <h3 style={{ margin: 0 }}>Training Progress</h3>
              <button className="btn" type="button" onClick={() => navigate("/learning")}>
                Go to Learning
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              {assignedLessons.map((l) => (
                <div
                  key={l.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <span>{l.title}</span>
                  <b>{l.status}</b>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Simulation results */}
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
                  {simulationHistory.map((s) => (
                    <tr key={s.id} style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                      <td style={{ padding: "8px 0" }}>{s.subject}</td>
                      <td style={{ padding: "8px 0" }}><b>{s.result}</b></td>
                      <td style={{ padding: "8px 0" }}>{s.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Recommended actions */}
        <section style={{ marginTop: 16 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Recommended Actions</h3>
            {hasIncompleteTraining ? (
              <div className="alert alert--warning">
                You still have unfinished training. Complete your remaining lessons to improve your phishing score.
              </div>
            ) : (
              <div className="alert alert--success">
                You’re all caught up! Keep an eye out for new training assignments.
              </div>
            )}
          </div>
        </section>

        {/* Profile info */}
        <section style={{ marginTop: 16 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Profile Information</h3>
            <p><b>Name:</b> {user?.name || "—"}</p>
            <p><b>Username:</b> {user?.username || "—"}</p>
            <p><b>Email:</b> {user?.email || "—"}</p>
            <p><b>Organization:</b> {user?.organization || "—"}</p>
            <p><b>Role:</b> {user?.role || "—"}</p>

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