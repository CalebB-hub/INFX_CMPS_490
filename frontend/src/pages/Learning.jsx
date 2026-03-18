import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";

const API_BASE = "http://localhost:8000/api";

export default function Learning() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadModules() {
      try {
        const token = localStorage.getItem("pf_auth_token");
        const response = await fetch(`${API_BASE}/learning/modules?scope=me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to load modules");
        }

        if (!mounted) return;
        setModules(data.modules || []);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || "Failed to load modules");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadModules();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>Assigned Lessons</h2>

        {loading && <p className="muted">Loading modules...</p>}
        {error && <p className="muted">{error}</p>}

        {!loading && !error && (
          <div style={{ display: "grid", gap: 6 }}>
            {modules.map((module) => (
              <div className="card" key={module.moduleId}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{module.title}</div>
                    <div className="muted" style={{ marginTop: 6 }}>
                      {module.description}
                    </div>
                    <div className="muted" style={{ marginTop: 6 }}>
                      {module.totalLessons} lessons
                      {module.progress ? ` · ${Math.round(module.progress.progressPercentage)}% complete` : ""}
                    </div>
                  </div>

                  <Link className="btn" to="/profile">
                    View progress
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
