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

  const quizGradesByLessonId = useMemo(() => {
    try {
      const raw = localStorage.getItem("quizGrades")
      const parsed = raw ? JSON.parse(raw) : {}
      return Object.values(parsed).reduce((acc, grade) => {
        if (grade?.lessonId) {
          acc.set(grade.lessonId, grade)
        }
        return acc
      }, new Map())
    } catch (e) {
      return new Map()
    }
  }, [])

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
                        const quizGrade = quizGradesByLessonId.get(lesson.id)
                        const showTestButton = Boolean(lesson.completedAt && quizGrade)
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
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Link className="btn" to={`/learning/quizzes/${quiz.id}`}>
                                  Take Quiz
                                </Link>
                                {showTestButton && (
                                  <Link
                                    className="btn topnav__profileBtn"
                                    to={`/test?lessonId=${lesson.id}`}
                                    aria-label="Go to test"
                                    style={{ display: "inline-flex", alignItems: "center" }}
                                  >
                                    <svg
                                      width="18"
                                      height="14"
                                      viewBox="0 0 18 14"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M1 2.5C1 1.67157 1.67157 1 2.5 1H15.5C16.3284 1 17 1.67157 17 2.5V11.5C17 12.3284 16.3284 13 15.5 13H2.5C1 13 1 12.3284 1 11.5V2.5Z"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M2 2.5L9 8L16 2.5"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </Link>
                                )}
                              </div>
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
