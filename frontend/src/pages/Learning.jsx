import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";
import { getAccessToken, refreshAccessToken } from "../services/authService";
import { API_BASE } from "../services/apiConfig";

async function fetchWithAuth(url) {
  const token = getAccessToken();
  if (!token) {
    throw new Error("You are not logged in.");
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status !== 401) {
    return response;
  }

  const refreshedToken = await refreshAccessToken();
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${refreshedToken}`,
    },
  });
}

async function fetchModules() {
  const response = await fetchWithAuth(`${API_BASE}/learning/modules?scope=me`);

  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : {};

  if (!response.ok) {
    throw new Error(data.error || "Failed to load modules");
  }

  return data.modules || [];
}

export default function Learning() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadModules() {
      try {
        const loadedModules = await fetchModules();

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

                  <div style={{ display: "flex", gap: 8 }}>
                    <Link className="btn" to="/learning/lessons">
                      View lessons
                    </Link>
                    <Link className="btn" to="/profile">
                      View progress
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
