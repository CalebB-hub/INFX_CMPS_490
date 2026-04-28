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
        <h2>Learning</h2>
        <p className="muted">Browse lessons and open details.</p>

        {loading && <p className="muted">Loading lessons...</p>}
        {error && <p className="muted">{error}</p>}

        {!loading && !error && (
          <div style={{ display: "grid", gap: 16 }}>
            {Array.from(lessonsByModule.entries()).map(([moduleId, group]) => {
              const moduleLessons = group.lessons || []
              const moduleTitle = group.title || "Module"
              return (
                <section key={moduleId} style={{ display: "grid", gap: 12 }}>
                  <h3 style={{ margin: 0 }}>{moduleTitle}</h3>

                  {moduleLessons.length === 0 && (
                    <div className="card">
                      <div className="muted">No lessons yet</div>
                    </div>
                  )}

                  {moduleLessons.length > 0 && (
                    <div style={{ display: "grid", gap: 12 }}>
                      {moduleLessons.map((lesson) => {
                        let quizCompleteForLesson = null
                        let testGradeForLesson = null

                        try {
                          const raw = localStorage.getItem("quizGrades")
                          const parsed = raw ? JSON.parse(raw) : {}
                          quizCompleteForLesson = Object.values(parsed).find(
                            (grade) =>
                              grade &&
                              String(grade.lessonId) === String(lesson.lessonId)
                          )
                        } catch (e) {
                          quizCompleteForLesson = null
                        }

                        try {
                          const raw = localStorage.getItem("testGrades")
                          const parsed = raw ? JSON.parse(raw) : {}
                          testGradeForLesson = parsed[String(lesson.lessonId)] || null
                        } catch (e) {
                          testGradeForLesson = null
                        }

                        const passedQuizForLesson = Boolean(
                          quizCompleteForLesson &&
                            Number(quizCompleteForLesson.percent) > 70
                        )
                        const passedTestForLesson = Boolean(
                          testGradeForLesson &&
                            Number(testGradeForLesson.finalPercent) > 70
                        )

                        return (
                          <div className="card" key={lesson.lessonId}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600 }}>{lesson.title}</div>
                                <div className="muted" style={{ marginTop: 4 }}>
                                  {passedTestForLesson ? "Complete" : "Not Complete"}
                                </div>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                  gap: 8,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Link className="btn" to={`/learning/lessons/${lesson.lessonId}`}>
                                  Open Lesson
                                </Link>
                                {passedQuizForLesson && (
                                  <Link
                                    className="btn topnav__profileBtn"
                                    to={`/inbox?lessonId=${lesson.lessonId}`}
                                    aria-label="Go to inbox"
                                  >
                                    Take Test
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
