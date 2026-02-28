// src/pages/Learning.jsx
import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import TopNav from "../components/TopNav"
import { mockGetModules } from "../mock/mockApi"

export default function Learning() {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    mockGetModules()
      .then((data) => {
        if (!mounted) return
        setModules(data)
      })
      .catch((e) => setError(e.message || "Failed to load modules"))
      .finally(() => setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>Assigned Lessons</h2>
        
        {loading && <p className="muted">Loading modules…</p>}
        {error && <p className="muted">{error}</p>}

        {!loading && !error && (
          <div style={{ display: "grid", gap: 6 }}>
            {modules.map((m) => {
              const firstLessonId = m.lessonIds?.[0]

              return (
                <div className="card" key={m.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{m.title}</div>
                      <div className="muted" style={{ marginTop: 6 }}>
                        {m.description}
                      </div>
                    </div>

                    {firstLessonId ? (
                      <Link className="btn" to={`/learning/lessons/${firstLessonId}`}>
                        Start lesson
                      </Link>
                    ) : (
                      <span className="muted">No lesson yet</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}