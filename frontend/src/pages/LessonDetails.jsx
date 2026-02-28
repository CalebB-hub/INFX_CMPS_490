import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import TopNav from "../components/TopNav"
import { mockGetLessonById } from "../mock/mockApi"

export default function LessonDetails() {
  const { lessonId } = useParams()
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError("")
    mockGetLessonById(lessonId)
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
              Lesson ID: {lesson.id}
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {lesson.body?.map((p, idx) => (
                <p key={idx} style={{ margin: 0 }}>
                  {p}
                </p>
              ))}
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <Link className="btn" to={`/learning/quizzes/${lesson.quizId}`}>
                Start quiz →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}