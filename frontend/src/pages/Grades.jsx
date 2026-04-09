import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import TopNav from "../components/TopNav"
import { mockGetLessons, mockGetQuizzes } from "../mock/mockApi"
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

async function fetchTestScores() {
  let lastError = null

  for (const base of API_BASES) {
    try {
      const response = await fetchWithAuth(`${base}/dashboard/me`)
      const raw = await response.text()
      const data = raw ? JSON.parse(raw) : {}

      if (!response.ok) {
        throw new Error(data.error || "Failed to load test scores")
      }

      return data.tests?.recentTests || []
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error("Failed to load test scores")
}

export default function Grades() {
  const [lessons, setLessons] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [testScores, setTestScores] = useState([])
  const [testScoresLoading, setTestScoresLoading] = useState(true)
  const [testScoresError, setTestScoresError] = useState("")

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError("")
    Promise.all([mockGetLessons(), mockGetQuizzes()])
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

  useEffect(() => {
    let mounted = true
    setTestScoresLoading(true)
    setTestScoresError("")

    fetchTestScores()
      .then((scores) => {
        if (!mounted) return
        setTestScores(scores)
      })
      .catch((e) => {
        if (!mounted) return
        setTestScoresError(e.message || "Failed to load test scores")
      })
      .finally(() => {
        if (mounted) setTestScoresLoading(false)
      })

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

  const lessonTitleById = useMemo(() => {
    const map = new Map()
    lessons.forEach((lesson) => map.set(lesson.id, lesson.title))
    return map
  }, [lessons])

  const summary = useMemo(() => {
    let taken = 0
    let totalScore = 0
    let totalPossible = 0
    quizzes.forEach((quiz) => {
      const grade = gradesByQuizId[quiz.id]
      if (!grade) return
      taken += 1
      totalScore += grade.score || 0
      totalPossible += grade.total || 0
    })
    const percent =
      totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0
    return { taken, totalScore, totalPossible, percent }
  }, [quizzes, gradesByQuizId])

  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>Grades</h2>
        <p className="muted">Your quiz results across all lessons.</p>

        {loading && <p className="muted">Loading grades…</p>}
        {error && <p className="muted">{error}</p>}

        {!loading && !error && (
          <div style={{ display: "grid", gap: 12 }}>
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Overall</div>
              <div className="muted">
                Taken: {summary.taken}/{quizzes.length} · Score: {summary.totalScore}/
                {summary.totalPossible} · {summary.percent}%
              </div>
            </div>

            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Test scores</div>
              {testScoresLoading && <p className="muted">Loading test scores…</p>}
              {!testScoresLoading && testScoresError && (
                <p className="muted">{testScoresError}</p>
              )}
              {!testScoresLoading && !testScoresError && testScores.length === 0 && (
                <p className="muted">No tests completed yet.</p>
              )}
              {!testScoresLoading && !testScoresError && testScores.length > 0 && (
                <div style={{ display: "grid", gap: 6 }}>
                  {testScores.map((test) => {
                    const dateLabel = test.dateTaken
                      ? new Date(test.dateTaken).toLocaleDateString()
                      : "—"
                    return (
                      <div
                        key={test.testId}
                        style={{ display: "flex", justifyContent: "space-between" }}
                      >
                        <span>
                          {test.title}{" "}
                          <span className="muted" style={{ marginLeft: 6 }}>
                            {dateLabel}
                          </span>
                        </span>
                        <span className="muted">{test.score}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {quizzes.map((quiz) => {
              const grade = gradesByQuizId[quiz.id]
              const lessonTitle = lessonTitleById.get(quiz.lessonId) || "Lesson"
              const lessonLink = quiz.lessonId
                ? `/learning/lessons/${quiz.lessonId}`
                : null
              return (
                <div className="card" key={quiz.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      {lessonLink ? (
                        <Link
                          to={lessonLink}
                          style={{
                            fontWeight: 600,
                            color: "inherit",
                            textDecoration: "none",
                          }}
                        >
                          {quiz.title}
                        </Link>
                      ) : (
                        <div style={{ fontWeight: 600 }}>{quiz.title}</div>
                      )}
                      <div className="muted" style={{ marginTop: 4 }}>
                        {lessonTitle}
                      </div>
                    </div>
                    <div className="muted" style={{ textAlign: "right", minWidth: 140 }}>
                      {grade
                        ? `Score: ${grade.score}/${grade.total} · ${grade.percent}%`
                        : "Not taken yet"}
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
