import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";

const API_BASES = ["http://localhost:8000/api", "/api"];

async function fetchModules(token) {
  let lastError = null;

  for (const base of API_BASES) {
    try {
      const response = await fetch(`${base}/learning/modules?scope=me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      if (!response.ok) {
        throw new Error(data.error || "Failed to load modules");
      }

      return data.modules || [];
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Failed to load modules");
}

export default function Learning() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadModules() {
      try {
        const token = localStorage.getItem("pf_auth_token");

        if (!token) {
          throw new Error("You are not logged in.");
        }

        const loadedModules = await fetchModules(token);

        if (!mounted) return;
        setModules(loadedModules);
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
        {!loading && error && <div className="alert alert--error">{error}</div>}

        {!loading && !error && modules.length === 0 && (
          <div className="card">
            <p className="muted" style={{ margin: 0 }}>
              No published learning modules were returned by the backend yet.
            </p>
          </div>
        )}

        {!loading && !error && modules.length > 0 && (
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
                      {module.progress
                        ? ` · ${Math.round(module.progress.progressPercentage || 0)}% complete`
                        : ""}
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
