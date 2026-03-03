import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import TopNav from "../components/TopNav"
import { mockGetLessons, mockGetModules, mockGetQuizzes } from "../mock/mockApi"

export default function Quizzes() {
  const [modules, setModules] = useState([])
  const [lessons, setLessons] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError("")
    Promise.all([mockGetModules(), mockGetLessons(), mockGetQuizzes()])
      .then(([modulesData, lessonsData, quizzesData]) => {
        if (!mounted) return
        setModules(modulesData)
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
      if (quiz.lessonId) map.set(quiz.lessonId, quiz)
    })
    return map
  }, [quizzes])

  const lessonsByModule = useMemo(() => {
    const map = new Map()
    modules.forEach((m) => map.set(m.id, []))
    lessons.forEach((lesson) => {
      if (!map.has(lesson.moduleId)) map.set(lesson.moduleId, [])
      map.get(lesson.moduleId).push(lesson)
    })
    return map
  }, [modules, lessons])

  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>Quizzes</h2>
        <p className="muted">Review all quizzes tied to each learning module.</p>

        {loading && <p className="muted">Loading quizzes…</p>}
        {error && <p className="muted">{error}</p>}

        {!loading && !error && (
          <div style={{ display: "grid", gap: 12 }}>
            {modules.map((module) => {
              const moduleLessons = lessonsByModule.get(module.id) || []
              return (
                <div className="card" key={module.id}>
                  <h3 style={{ marginTop: 0 }}>{module.title}</h3>
                  <div className="muted" style={{ marginBottom: 8 }}>
                    {module.description}
                  </div>

                  {moduleLessons.length === 0 && (
                    <div className="muted">No lessons yet</div>
                  )}

                  {moduleLessons.length > 0 && (
                    <div style={{ display: "grid", gap: 10 }}>
                      {moduleLessons.map((lesson) => {
                        const quiz = quizByLessonId.get(lesson.id)
                        return (
                          <div
                            key={lesson.id}
                            style={{ display: "flex", alignItems: "center", gap: 12 }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600 }}>{lesson.title}</div>
                              <div className="muted" style={{ marginTop: 4 }}>
                                {quiz?.title || "Quiz coming soon"}
                              </div>
                            </div>
                            {quiz ? (
                              <Link className="btn" to={`/learning/quizzes/${quiz.id}`}>
                                Take quiz
                              </Link>
                            ) : (
                              <span className="muted">Unavailable</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
