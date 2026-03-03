import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import TopNav from "../components/TopNav"
import { mockGetQuizById } from "../mock/mockApi"

export default function QuizDetails() {
  const { quizId } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [finalScore, setFinalScore] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError("")
    mockGetQuizById(quizId)
      .then((data) => {
        if (!mounted) return
        setQuiz(data)
        setAnswers({})
        setSubmitted(false)
        setFinalScore(null)
      })
      .catch((e) => setError(e.message || "Failed to load quiz"))
      .finally(() => setLoading(false))
    return () => {
      mounted = false
    }
  }, [quizId])

  const totalQuestions = quiz?.questions?.length || 0
  const answeredCount = Object.keys(answers).length
  const canSubmit = totalQuestions > 0 && answeredCount === totalQuestions

  const computeScore = () =>
    quiz?.questions?.reduce((acc, q, idx) => {
      const key = q.id || `${idx}`
      return acc + (answers[key] === q.correctIndex ? 1 : 0)
    }, 0) || 0

  const handleSubmit = () => {
    if (!canSubmit || submitted) return
    const score = computeScore()
    setFinalScore(score)
    setSubmitted(true)
    const payload = {
      score,
      total: totalQuestions,
      percent: totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0,
      submittedAt: new Date().toISOString(),
    }
    try {
      const raw = localStorage.getItem("quizGrades")
      const existing = raw ? JSON.parse(raw) : {}
      localStorage.setItem(
        "quizGrades",
        JSON.stringify({ ...existing, [quizId]: payload })
      )
    } catch (e) {
      // ignore storage errors
    }
  }

  return (
    <div>
      <TopNav />
      <main className="page">
        <div style={{ marginBottom: 20 }}>
          <Link className="btn" to="/learning">
            ← Back to Learning
          </Link>
        </div>

        {loading && <p className="muted">Loading quiz…</p>}
        {error && <p className="muted">{error}</p>}

        {!loading && !error && quiz && (
          <div className="card">
            <h2 style={{ marginTop: 0 }}>{quiz.title}</h2>

            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              {quiz.questions?.map((q, idx) => {
                const key = q.id || `${idx}`
                const selected = answers[key]
                return (
                  <div key={key} className="card" style={{ padding: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>
                      {idx + 1}. {q.prompt}
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {q.options?.map((option, optionIdx) => (
                        <label
                          key={`${key}-${optionIdx}`}
                          style={{ display: "flex", alignItems: "center", gap: 8 }}
                        >
                          <input
                            type="radio"
                            name={`question-${key}`}
                            checked={selected === optionIdx}
                            disabled={submitted}
                            onChange={() =>
                              setAnswers((prev) => ({ ...prev, [key]: optionIdx }))
                            }
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
              <button
                className="btn"
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || submitted}
              >
                Submit quiz
              </button>
              {!submitted && totalQuestions > 0 && answeredCount < totalQuestions && (
                <span className="muted">
                  Answer {totalQuestions - answeredCount} more to submit
                </span>
              )}
              {submitted && (
                <span style={{ fontWeight: 600 }}>
                  Score: {finalScore ?? 0}/{totalQuestions}
                </span>
              )}
            </div>

            {quiz.lessonId && (
              <div style={{ marginTop: 16 }}>
                <Link className="btn" to={`/learning/lessons/${quiz.lessonId}`}>
                  Back to lesson
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
