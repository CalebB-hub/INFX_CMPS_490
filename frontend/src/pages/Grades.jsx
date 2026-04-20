import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import TopNav from "../components/TopNav"
import { mockGetLessons, mockGetQuizzes } from "../mock/mockApi"

export default function Grades() {
  const [lessons, setLessons] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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

  const testGrades = useMemo(() => {
    try {
      const raw = localStorage.getItem("testGrades")
      return raw ? JSON.parse(raw) : {}
    } catch (e) {
      return {}
    }
  }, [])

  const testGradeList = useMemo(
    () =>
      Object.values(testGrades).sort(
        (a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)
      ),
    [testGrades]
  )

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
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Test Grades</div>
              {testGradeList.length === 0 ? (
                <div className="muted">No test submissions yet.</div>
              ) : (
                testGradeList.map((grade) => (
                  <div
                    key={grade.testId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{grade.title || "Test"}</div>
                      <div className="muted" style={{ marginTop: 2 }}>
                        {grade.submittedAt
                          ? new Date(grade.submittedAt).toLocaleDateString()
                          : "Submission saved"}
                      </div>
                    </div>
                    <div className="muted" style={{ minWidth: 120, textAlign: "right" }}>
                      Score: {grade.score}/{grade.total} · {grade.percent}%
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Overall</div>
              <div className="muted">
                Taken: {summary.taken}/{quizzes.length} · Score: {summary.totalScore}/
                {summary.totalPossible} · {summary.percent}%
              </div>
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
