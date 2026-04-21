import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import TopNav from "../components/TopNav"
import { mockGetQuizzes } from "../mock/mockApi"
import { getAccessToken, refreshAccessToken } from "../services/authService"

const API_BASES = ["http://localhost:8000/api", "/api"]

const TEST_ID_BY_LESSON_ID = {
  1: "mock-1",
  2: "mock-2",
  3: "mock-3",
  4: "mock-4",
}

const QUIZ_ID_BY_LESSON_ID = {
  1: "q1",
  2: "q2",
  3: "q3",
}

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
    Promise.all([fetchLessons(), mockGetQuizzes()])
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
      if (quiz.lessonId) map.set(quiz.lessonId, quiz)
    })
    return map
  }, [quizzes])

  const gradeItems = useMemo(
    () =>
      lessons.map((lesson) => {
        const lessonId = String(lesson.lessonId)
        const quiz = quizByLessonId.get(`l${lessonId}`)
        const quizId = quiz?.id || QUIZ_ID_BY_LESSON_ID[lessonId]
        const quizGrade = quizId ? gradesByQuizId[quizId] : null
        const testGrade = testGrades[TEST_ID_BY_LESSON_ID[lessonId]]

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
        <h2>Grades</h2>
        <p className="muted">Your quiz and test results by lesson.</p>

        {loading && <p className="muted">Loading grades...</p>}
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
                          border: "1px solid rgba(0,0,0,0.08)",
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
                          border: "1px solid rgba(0,0,0,0.08)",
                          borderRadius: 12,
                          padding: 14,
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>Test Grade</div>
                        <div className="muted" style={{ marginTop: 4 }}>
                          Email simulation question
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 10 }}>
                          {testGrade ? `${testGrade.percent}%` : "--"}
                        </div>
                        <div className="muted" style={{ marginTop: 4 }}>
                          {testGrade
                            ? testGrade.submittedAt
                              ? new Date(testGrade.submittedAt).toLocaleDateString()
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
