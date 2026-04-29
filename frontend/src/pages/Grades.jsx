import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import TopNav from "../components/TopNav"
import { fetchQuizzes } from "../services/quizService"
import { getAccessToken, refreshAccessToken } from "../services/authService"

import { API_BASES } from '../config';

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

export default function Grades() {
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
      .catch((e) => setError(e.message || "Failed to load grades"))
      .finally(() => setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  const gradesByQuizId = useMemo(() => {
    try {
      const raw = localStorage.getItem("quizGrades")
      return raw ? JSON.parse(raw) : {}
    } catch (e) {
      return {}
    }
  }, [])

  const testGrades = useMemo(() => {
    try {
      const raw = localStorage.getItem("testGrades")
      return raw ? JSON.parse(raw) : {}
    } catch (e) {
      return {}
    }
  }, [])

  const quizByLessonId = useMemo(() => {
    const map = new Map()
    quizzes.forEach((quiz) => {
      if (quiz.lessonId) map.set(String(quiz.lessonId), quiz)
    })
    return map
  }, [quizzes])

  const gradeItems = useMemo(
    () =>
      lessons.map((lesson) => {
        const lessonId = String(lesson.lessonId)
        const quiz = quizByLessonId.get(lessonId)
        const quizId = quiz?.id
        const quizGrade = quizId ? gradesByQuizId[quizId] : null
        const testGrade = testGrades[lessonId] || null

        return {
          lesson,
          quiz,
          quizGrade,
          testGrade,
        }
      }),
    [lessons, quizByLessonId, gradesByQuizId, testGrades]
  )

  return (
    <div>
      <TopNav />
      <main className="page">
        <style>
          {`
            @keyframes grades-loader-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
        <h2>Grades</h2>
        <p className="muted">Your quiz and test results by lesson.</p>

        {loading && (
          <div className="card" style={{ minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "3px solid rgba(0,0,0,0.12)",
                  borderTopColor: "var(--accent)",
                  animation: "grades-loader-spin 0.9s linear infinite",
                }}
              />
              <div className="muted" style={{ fontWeight: 600 }}>
                Loading Grades...
              </div>
            </div>
          </div>
        )}
        {error && <p className="muted">{error}</p>}

        {!loading && !error && (
          <div style={{ display: "grid", gap: 14 }}>
            {gradeItems.map(({ lesson, quiz, quizGrade, testGrade }) => {
              const lessonLink = `/learning/lessons/${lesson.lessonId}`

              return (
                <div className="card" key={lesson.lessonId}>
                  <div style={{ display: "grid", gap: 14 }}>
                    <div>
                      <Link
                        to={lessonLink}
                        style={{
                          fontWeight: 700,
                          color: "inherit",
                          textDecoration: "none",
                          fontSize: "1.05rem",
                        }}
                      >
                        {lesson.title}
                      </Link>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 10,
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      }}
                    >
                      <div
                        style={{
                          border: "1px solid rgba(255,255,255,0.18)",
                          borderRadius: 12,
                          padding: 14,
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>Quiz Grade</div>
                        <div className="muted" style={{ marginTop: 4 }}>
                          {quiz?.title || "Quiz"}
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 10 }}>
                          {quizGrade ? `${quizGrade.percent}%` : "--"}
                        </div>
                        <div className="muted" style={{ marginTop: 4 }}>
                          {quizGrade
                            ? `${quizGrade.score}/${quizGrade.total} correct`
                            : "Not taken yet"}
                        </div>
                      </div>

                      <div
                        style={{
                          border: "1px solid rgba(255,255,255,0.18)",
                          borderRadius: 12,
                          padding: 14,
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>Test Grade</div>
                        <div className="muted" style={{ marginTop: 4 }}>
                          Email simulation question
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 10 }}>
                          {testGrade ? `${testGrade.finalPercent ?? 0}%` : "--"}
                        </div>
                        <div className="muted" style={{ marginTop: 4 }}>
                          {testGrade
                            ? testGrade.finalizedAt
                              ? new Date(testGrade.finalizedAt).toLocaleDateString()
                              : "Submitted"
                            : "Not taken yet"}
                        </div>
                      </div>
                    </div>
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
