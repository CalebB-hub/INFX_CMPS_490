import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
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

async function fetchLesson(lessonId) {
  let lastError = null

  for (const base of API_BASES) {
    try {
      const response = await fetchWithAuth(`${base}/learning/lessons/${lessonId}`)

      const raw = await response.text()
      const data = raw ? JSON.parse(raw) : {}

      if (!response.ok) {
        throw new Error(data.error || "Failed to load lesson")
      }

      return data
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error("Failed to load lesson")
}

export default function LessonDetails() {
  const { lessonId } = useParams()
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError("")
    fetchLesson(lessonId)
      .then((data) => {
        if (!mounted) return
        setLesson(data)
      })
      .catch((e) => setError(e.message || "Failed to load lesson"))
      .finally(() => setLoading(false))
    return () => {
      mounted = false
    }
  }, [lessonId])

  const paragraphs = useMemo(() => {
    if (!lesson?.lessonMaterial) return []
    return lesson.lessonMaterial
      .split(/\n\s*\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  }, [lesson?.lessonMaterial])

  const quizCompleteForLesson = useMemo(() => {
    if (!lesson?.lessonId) return null
    try {
      const raw = localStorage.getItem("quizGrades")
      const parsed = raw ? JSON.parse(raw) : {}
      return Object.values(parsed).find(
        (grade) => grade && grade.lessonId === lesson.lessonId
      )
    } catch (e) {
      return null
    }
  }, [lesson?.lessonId])

  const isPerfectQuiz = quizCompleteForLesson?.percent === 100

  return (
    <div>
      <TopNav />
      <main className="page">
        <div style={{ marginBottom: 20 }}>
          <Link className="btn" to="/learning">
            ← Back to Learning
          </Link>
        </div>

        {loading && <p className="muted">Loading lesson…</p>}
        {error && <p className="muted">{error}</p>}

        {!loading && !error && lesson && (
          <div className="card">
            <h2 style={{ marginTop: 0 }}>{lesson.title}</h2>

            <div className="muted" style={{ marginBottom: 12 }}>
              Lesson ID: {lesson.lessonId}
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {paragraphs.map((p, idx) => (
                <p key={idx} style={{ margin: 0 }}>
                  {p}
                </p>
              ))}
            </div>

            {lesson.score !== null && lesson.score !== undefined && (
              <div className="muted" style={{ marginTop: 12 }}>
                Score: {lesson.score}
              </div>
            )}

            {lesson.completedAt && isPerfectQuiz && (
              <div style={{ marginTop: 16 }}>
                <Link
                  className="btn"
                  to={`/test?lessonId=${lesson.lessonId}`}
                  aria-label="Go to test"
                >
                  <span
                    aria-hidden="true"
                    style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                  >
                    <svg
                      width="18"
                      height="14"
                      viewBox="0 0 18 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 2.5C1 1.67157 1.67157 1 2.5 1H15.5C16.3284 1 17 1.67157 17 2.5V11.5C17 12.3284 16.3284 13 15.5 13H2.5C1.67157 13 1 12.3284 1 11.5V2.5Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2 2.5L9 8L16 2.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Go to test</span>
                  </span>
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}