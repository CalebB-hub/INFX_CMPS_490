import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import TopNav from "../components/TopNav"
import { getAccessToken, refreshAccessToken } from "../services/authService"

const API_BASES = ["http://localhost:8000/api", "/api"]

async function fetchWithAuth(url) {
  const token = getAccessToken()
  if (!token) {
    throw new Error("You are not logged in.")
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (response.status !== 401) {
    return response
  }

  const refreshedToken = await refreshAccessToken()
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${refreshedToken}`,
    },
  })
}

async function fetchLessons() {
  let lastError = null

  for (const base of API_BASES) {
    try {
      const response = await fetchWithAuth(`${base}/learning/lessons`)

      const raw = await response.text()
      const data = raw ? JSON.parse(raw) : {}

      if (!response.ok) {
        throw new Error(data.error || "Failed to load lessons")
      }

      return data.lessons || []
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error("Failed to load lessons")
}

export default function Lessons() {
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError("")
    fetchLessons()
      .then((lessonsData) => {
        if (!mounted) return
        setLessons(lessonsData)
      })
      .catch((e) => setError(e.message || "Failed to load lessons"))
      .finally(() => setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  const lessonsByModule = useMemo(() => {
    const map = new Map()
    lessons.forEach((lesson) => {
      const key = lesson.moduleId ?? "unassigned"
      if (!map.has(key)) map.set(key, { title: lesson.moduleTitle, lessons: [] })
      map.get(key).lessons.push(lesson)
    })
    return map
  }, [lessons])

  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>Lessons</h2>
        <p className="muted">Browse lessons and open details.</p>

        {loading && <p className="muted">Loading lessons…</p>}
        {error && <p className="muted">{error}</p>}

        {!loading && !error && (
          <div style={{ display: "grid", gap: 12 }}>
            {Array.from(lessonsByModule.entries()).map(([moduleId, group]) => {
              const moduleLessons = group.lessons || []
              const moduleTitle = group.title || "Module"
              return (
                <div className="card" key={moduleId}>
                  <h3 style={{ marginTop: 0 }}>{moduleTitle}</h3>

                  {moduleLessons.length === 0 && (
                    <div className="muted">No lessons yet</div>
                  )}

                  {moduleLessons.length > 0 && (
                    <div style={{ display: "grid", gap: 10 }}>
                      {moduleLessons.map((lesson) => {
                        let quizCompleteForLesson = null
                        try {
                          const raw = localStorage.getItem("quizGrades")
                          const parsed = raw ? JSON.parse(raw) : {}
                          quizCompleteForLesson = Object.values(parsed).find(
                            (grade) => grade && grade.lessonId === lesson.lessonId
                          )
                        } catch (e) {
                          quizCompleteForLesson = null
                        }
                        const showTestButton = Boolean(
                          lesson.completedAt && quizCompleteForLesson
                        )
                        return (
                        <div
                          key={lesson.lessonId}
                          style={{ display: "flex", alignItems: "center", gap: 12 }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{lesson.title}</div>
                            <div className="muted" style={{ marginTop: 4 }}>
                              {lesson.completedAt
                                ? `Completed · Score ${lesson.score ?? "N/A"}`
                                : "Not completed yet"}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Link className="btn" to={`/learning/lessons/${lesson.lessonId}`}>
                              Open lesson
                            </Link>
                            {showTestButton && (
                              <Link
                                className="btn topnav__profileBtn"
                                to={`/test?lessonId=${lesson.lessonId}`}
                                aria-label="Go to test"
                              >
                                Take test
                              </Link>
                            )}
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
