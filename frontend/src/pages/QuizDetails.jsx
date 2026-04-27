import { useEffect, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import TopNav from "../components/TopNav"
import { fetchQuizById } from "../services/quizService"

export default function QuizDetails() {
  const navigate = useNavigate()
  const { quizId } = useParams()
  const [searchParams] = useSearchParams()
  const lessonId = searchParams.get("lessonId")
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
    fetchQuizById(quizId)
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
      lessonId,
      quizId,
      title: quiz.title,
      review: quiz.questions?.map((question, idx) => {
        const key = question.id || `${idx}`
        const selectedIndex = answers[key]
        const correctIndex = question.correctIndex
        return {
          questionId: key,
          prompt: question.prompt,
          selectedAnswer:
            selectedIndex !== undefined ? question.options?.[selectedIndex] : null,
          correctAnswer:
            correctIndex !== undefined ? question.options?.[correctIndex] : null,
          isCorrect: selectedIndex === correctIndex,
        }
      }) || [],
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
    navigate(`/quiz-grade/${quizId}`)
  }

  return (
    <div>
      <TopNav />
      <main className="page">
        <div style={{ marginBottom: 20 }}>
          <Link className="btn" to="/learning">
            Back To Learning
          </Link>
        </div>

        {loading && <p className="muted">Loading quiz...</p>}
        {error && <p className="muted">{error}</p>}

        {!loading && !error && quiz && (
          <>
            <div className="card">
              <h2 style={{ marginTop: 0 }}>{quiz.title}</h2>

              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                {quiz.questions?.map((q, idx) => {
                  const key = q.id || `${idx}`
                  const selected = answers[key]
                  const isCorrect =
                    submitted && selected !== undefined && selected === q.correctIndex
                  const correctOption =
                    q.options && q.correctIndex !== undefined
                      ? q.options[q.correctIndex]
                      : ""

                  return (
                    <div key={key} className="card" style={{ padding: 16 }}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>
                        {idx + 1}. {q.prompt}
                      </div>
                      <div style={{ display: "grid", gap: 8 }}>
                        {q.options?.map((option, optionIdx) => (
                          <label
                            key={`${key}-${optionIdx}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              fontWeight:
                                submitted && optionIdx === q.correctIndex ? 600 : 400,
                            }}
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
                      {submitted && (
                        <div className="muted" style={{ marginTop: 8 }}>
                          {isCorrect ? "Correct" : "Incorrect"}
                          {!isCorrect && correctOption
                            ? ` - Correct answer: ${correctOption}`
                            : ""}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 10,
                alignItems: "center",
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              {submitted && (
                <span style={{ fontWeight: 600 }}>
                  Score: {finalScore ?? 0}/{totalQuestions} -{" "}
                  {totalQuestions > 0
                    ? Math.round(((finalScore ?? 0) / totalQuestions) * 100)
                    : 0}
                  %
                </span>
              )}
              {submitted && (
                <Link className="btn" to="/learning">
                  Return To Lessons
                </Link>
              )}
              <button
                className="btn"
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || submitted}
              >
                Submit Quiz
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
