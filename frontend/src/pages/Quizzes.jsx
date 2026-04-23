import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
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

export default function Quizzes() {
  const [lessons, setLessons] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError("")
    Promise.all([fetchLessons(), fetchQuizzes()])
      .then(([lessonsData, quizzesData]) => {
        if (!mounted) return
        setLessons(lessonsData)
        setQuizzes(quizzesData)
      })
      .catch((e) => setError(e.message || "Failed to load quizzes"))
      .finally(() => setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  const quizByLessonId = useMemo(() => {
    const map = new Map()
    quizzes.forEach((quiz) => {
      if (quiz.lessonId) map.set(String(quiz.lessonId), quiz)
    })
    return map
  }, [quizzes])

  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>Quizzes</h2>
        <p className="muted">Review all quizzes tied to each learning module.</p>

        {loading && <p className="muted">Loading quizzes...</p>}
        {error && <p className="muted">{error}</p>}

        {!loading && !error && (
          <div style={{ display: "grid", gap: 12 }}>
            {lessons.map((lesson) => {
              const quiz = quizByLessonId.get(String(lesson.lessonId))
              return (
                <div className="card" key={lesson.lessonId}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{lesson.title}</div>
                      <div className="muted" style={{ marginTop: 4 }}>
                        {quiz?.title || "Quiz coming soon"}
                      </div>
                    </div>
                    {quiz ? (
                      <Link
                        className="btn"
                        to={`/learning/quizzes/${quiz.id}?lessonId=${lesson.lessonId}`}
                      >
                        Take Quiz
                      </Link>
                    ) : (
                      <span className="muted">Unavailable</span>
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
