import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import TopNav from "../components/TopNav"
import { getAccessToken, refreshAccessToken } from "../services/authService"
import { fetchQuizzes } from "../services/quizService"

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
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const quizCompletedForLesson = useMemo(() => {
    try {
      const raw = localStorage.getItem("quizGrades")
      const parsed = raw ? JSON.parse(raw) : {}
      return Object.values(parsed).find(
        (grade) => grade && String(grade.lessonId) === String(lessonId)
      )
    } catch {
      return null
    }
  }, [lessonId])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError("")
    Promise.all([fetchLesson(lessonId), fetchQuizzes()])
      .then(([data, quizzes]) => {
        if (!mounted) return
        setLesson(data)
        setQuiz(
          quizzes.find((item) => String(item.lessonId) === String(data.lessonId)) || null
        )
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

  return (
    <div>
      <TopNav />
      <main className="page">
        <div style={{ marginBottom: 20 }}>
          <Link className="btn" to="/learning">
            ← Back To Learning
          </Link>
        </div>

        {loading && <p className="muted">Loading lesson…</p>}
        {error && <p className="muted">{error}</p>}

        {!loading && !error && lesson && (
          <>
            <div className="card">
              <h2 style={{ marginTop: 0 }}>{lesson.title}</h2>

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
            </div>

            {(quiz || quizCompletedForLesson) && (
              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                {quiz && (
                  <Link className="btn" to={`/learning/quizzes/${quiz.id}?lessonId=${lesson.lessonId}`}>
                    Take Quiz
                  </Link>
                )}
                {quizCompletedForLesson && (
                  <Link className="btn" to={`/inbox?lessonId=${lesson.lessonId}`}>
                    Take Test
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
