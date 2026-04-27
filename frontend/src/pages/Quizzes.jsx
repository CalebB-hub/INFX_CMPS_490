import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import TopNav from "../components/TopNav"
import { fetchQuizzes } from "../services/quizService"

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError("")
    fetchQuizzes()
      .then((quizzesData) => {
        if (!mounted) return
        setQuizzes(quizzesData)
      })
      .catch((e) => setError(e.message || "Failed to load quizzes"))
      .finally(() => setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>Quizzes</h2>
        <p className="muted">Review all quizzes pulled from the test table.</p>

        {loading && <p className="muted">Loading quizzes...</p>}
        {error && <p className="muted">{error}</p>}

        {!loading && !error && (
          <div style={{ display: "grid", gap: 12 }}>
            {quizzes.map((quiz) => {
              const lessonId = quiz.lessonId ? String(quiz.lessonId) : null
              return (
                <div className="card" key={quiz.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{quiz.title || "Untitled Quiz"}</div>
                      <div className="muted" style={{ marginTop: 4 }}>
                        {lessonId ? `Lesson ${lessonId}` : "No lesson assigned"}
                      </div>
                    </div>
                    <Link
                      className="btn"
                      to={
                        lessonId
                          ? `/learning/quizzes/${quiz.id}?lessonId=${lessonId}`
                          : `/learning/quizzes/${quiz.id}`
                      }
                    >
                      Take Quiz
                    </Link>
                  </div>
                </div>
              )
            })}
            {quizzes.length === 0 && (
              <div className="card">
                <div className="muted">No quizzes were found in the test table.</div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
