import { useState } from "react";
import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";

// Mock Data for the Dashboard
const MOCK_USERS = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", score: 85, lessons: 8, totalLessons: 10 },
  { id: 2, name: "Bob Smith", email: "bob@example.com", score: 45, lessons: 2, totalLessons: 10 },
  { id: 3, name: "Charlie Brown", email: "charlie@example.com", score: 92, lessons: 10, totalLessons: 10 },
  { id: 4, name: "Diana Prince", email: "diana@example.com", score: 70, lessons: 5, totalLessons: 10 },
  { id: 5, name: "Evan Wright", email: "evan@example.com", score: 30, lessons: 1, totalLessons: 10 },
];

const MOCK_SIMULATIONS = [
  { id: 101, title: "Urgent Invoice", user: "Alice Johnson", status: "Reported", date: "2023-10-01" },
  { id: 102, title: "Password Reset", user: "Bob Smith", status: "Clicked", date: "2023-10-02" },
  { id: 103, title: "Urgent Invoice", user: "Charlie Brown", status: "Ignored", date: "2023-10-03" },
  { id: 104, title: "Free Gift", user: "Diana Prince", status: "Reported", date: "2023-10-04" },
  { id: 105, title: "CEO Request", user: "Evan Wright", status: "Clicked", date: "2023-10-05" },
];

const SIMULATION_TEMPLATES = [
  "Urgent Invoice",
  "Password Reset",
  "Free Gift",
  "CEO Request",
  "IT Support Ticket"
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [users] = useState(MOCK_USERS);
  const [simulations, setSimulations] = useState(MOCK_SIMULATIONS);
  
  // Assignment Form State
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [assignStatus, setAssignStatus] = useState("");

  // Stats Calculations
  const avgScore = Math.round(users.reduce((acc, u) => acc + u.score, 0) / users.length);
  const totalSims = simulations.length;

  const handleAssign = (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedTemplate) return;
    
    const newUser = users.find(u => u.id.toString() === selectedUser);
    const newSim = {
      id: Date.now(),
      title: selectedTemplate,
      user: newUser.name,
      status: "Sent",
      date: new Date().toISOString().split('T')[0]
    };
    
    setSimulations([newSim, ...simulations]);
    setAssignStatus(`Simulation "${selectedTemplate}" assigned to ${newUser.name}.`);
    
    // Clear success message after 3 seconds
    setTimeout(() => setAssignStatus(""), 3000);
    
    // Reset form
    setSelectedUser("");
    setSelectedTemplate("");
  };

  return (
    <div>
      <TopNav />
      <main className="page">
        <header style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2>Admin Dashboard</h2>
            <p className="muted">Manage users, simulations, and track organization security health.</p>
          </div>
          <Link to="/home" className="btn btn--ghost" style={{ background: 'var(--accent)', color: 'black' }}>Back to Home</Link>
        </header>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          <div className="card" style={{ textAlign: "center" }}>
            <h3 style={{ fontSize: "2rem", margin: "0 0 8px 0", color: "var(--accent)" }}>{users.length}</h3>
            <p className="muted" style={{ margin: 0 }}>Total Users</p>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <h3 style={{ fontSize: "2rem", margin: "0 0 8px 0", color: "var(--accent)" }}>{totalSims}</h3>
            <p className="muted" style={{ margin: 0 }}>Simulations Sent</p>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <h3 style={{ fontSize: "2rem", margin: "0 0 8px 0", color: avgScore < 70 ? "red" : "var(--accent)" }}>{avgScore}%</h3>
            <p className="muted" style={{ margin: 0 }}>Avg Phishing Score</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ borderBottom: "1px solid var(--border-strong, #ccc)", marginBottom: "24px", display: "flex", gap: "16px" }}>
          {["users", "simulations", "assign"].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                padding: "10px 20px", 
                background: "none", 
                border: "none", 
                borderBottom: activeTab === tab ? "3px solid var(--accent)" : "3px solid transparent",
                fontWeight: activeTab === tab ? "bold" : "normal",
                cursor: "pointer",
                textTransform: "capitalize"
              }}
            >
              {tab === "assign" ? "Assign Simulation" : tab}
            </button>
          ))}
        </div>

        {/* Tab Content: Users & Training Progress */}
        {activeTab === "users" && (
          <div className="card">
            <h3>User List & Training Progress</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-strong, #ccc)", textAlign: "left" }}>
                    <th style={{ padding: "12px" }}>Name</th>
                    <th style={{ padding: "12px" }}>Email</th>
                    <th style={{ padding: "12px" }}>Phishing Score</th>
                    <th style={{ padding: "12px" }}>Training Progress</th>
                    <th style={{ padding: "12px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const progress = (user.lessons / user.totalLessons) * 100;
                    const isLow = progress < 30;
                    return (
                      <tr key={user.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "12px" }}>{user.name}</td>
                        <td style={{ padding: "12px" }} className="muted">{user.email}</td>
                        <td style={{ padding: "12px", fontWeight: "bold", color: user.score < 60 ? "red" : "green" }}>{user.score}</td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ flex: 1, height: "8px", background: "#eee", borderRadius: "4px", overflow: "hidden" }}>
                              <div style={{ width: `${progress}%`, height: "100%", background: isLow ? "red" : "var(--accent)" }}></div>
                            </div>
                            <span style={{ fontSize: "0.85rem" }}>{user.lessons}/{user.totalLessons}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          {isLow ? <span style={{ color: "red", fontWeight: "bold", fontSize: "0.85rem" }}>Needs Attention</span> : <span style={{ color: "green", fontSize: "0.85rem" }}>On Track</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Simulation Results */}
        {activeTab === "simulations" && (
          <div className="card">
            <h3>Completed Simulations</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-strong, #ccc)", textAlign: "left" }}>
                    <th style={{ padding: "12px" }}>Simulation</th>
                    <th style={{ padding: "12px" }}>User</th>
                    <th style={{ padding: "12px" }}>Date</th>
                    <th style={{ padding: "12px" }}>Result</th>
                    <th style={{ padding: "12px" }}>Pass/Fail</th>
                  </tr>
                </thead>
                <tbody>
                  {simulations.map(sim => {
                    let pass = sim.status === "Reported";
                    let color = pass ? "green" : (sim.status === "Clicked" ? "red" : "gray");
                    return (
                      <tr key={sim.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "12px" }}>{sim.title}</td>
                        <td style={{ padding: "12px" }}>{sim.user}</td>
                        <td style={{ padding: "12px" }} className="muted">{sim.date}</td>
                        <td style={{ padding: "12px", fontWeight: "bold", color }}>{sim.status}</td>
                        <td style={{ padding: "12px" }}>
                          {pass ? "Pass" : (sim.status === "Sent" ? "Pending" : "Fail")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Assign Simulation */}
        {activeTab === "assign" && (
          <div className="card" style={{ maxWidth: "600px" }}>
            <h3>Assign New Simulation</h3>
            <p className="muted">Select a user and a phishing template to send a simulated attack.</p>
            
            {assignStatus && <div className="alert alert--success" style={{ marginBottom: "16px" }}>{assignStatus}</div>}
            
            <form onSubmit={handleAssign}>
              <label style={{ display: "block", marginBottom: "16px" }}>
                <span style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Select User</span>
                <select 
                  value={selectedUser} 
                  onChange={(e) => setSelectedUser(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
                  required
                >
                  <option value="">-- Choose a user --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </label>

              <label style={{ display: "block", marginBottom: "24px" }}>
                <span style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Select Template</span>
                <select 
                  value={selectedTemplate} 
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
                  required
                >
                  <option value="">-- Choose a template --</option>
                  {SIMULATION_TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>

              <button className="btn" type="submit">Send Simulation</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}