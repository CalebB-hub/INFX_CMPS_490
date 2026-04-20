import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";
import { getAccessToken, refreshAccessToken } from "../services/authService";

const API_BASES = ["http://localhost:8000/api", "/api"];

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

function parseMaybeJson(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function fetchModules() {
  let lastError = null;

  for (const base of API_BASES) {
    try {
      const response = await fetchWithAuth(`${base}/learning/lessons`);

      const raw = await response.text();
      const data = parseMaybeJson(raw);

      if (data === null) {
        // The endpoint returned non-JSON (often an HTML fallback page).
        throw new Error("Server returned an unexpected response format.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to load lessons");
      }

      const lessons = Array.isArray(data.lessons) ? data.lessons : [];
      const completedLessons = lessons.filter((lesson) => lesson.completedAt);
      const scoredLessons = completedLessons.filter(
        (lesson) => lesson.score !== null && lesson.score !== undefined,
      );
      const averageScore =
        scoredLessons.length > 0
          ? scoredLessons.reduce((sum, lesson) => sum + Number(lesson.score), 0) /
            scoredLessons.length
          : null;
      const lastActivity = completedLessons.reduce((latest, lesson) => {
        if (!lesson.completedAt) return latest;
        if (!latest) return lesson.completedAt;
        return new Date(lesson.completedAt) > new Date(latest) ? lesson.completedAt : latest;
      }, null);

      return [
        {
          moduleId: 1,
          title: "Lessons",
          description: "All phishing awareness lessons",
          totalLessons: lessons.length,
          progress: {
            completedLessons: completedLessons.length,
            totalLessons: lessons.length,
            progressPercentage:
              lessons.length > 0 ? (completedLessons.length / lessons.length) * 100 : 0,
            averageScore,
            lastActivity,
          },
          isStarted: completedLessons.length > 0,
          isCompleted: lessons.length > 0 && completedLessons.length === lessons.length,
        },
      ];
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Failed to load lessons");
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
        setError(e.message || "Failed to load lessons");
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

        {loading && <p className="muted">Loading lessons...</p>}
        {!loading && error && <div className="alert alert--error">{error}</div>}

        {!loading && !error && modules.length === 0 && (
          <div className="card">
            <p className="muted" style={{ margin: 0 }}>
              No lessons were returned by the backend yet.
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
