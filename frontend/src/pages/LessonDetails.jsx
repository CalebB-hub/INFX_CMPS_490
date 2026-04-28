import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import TopNav from "../components/TopNav"
import { getAccessToken, refreshAccessToken } from "../services/authService"
import { fetchQuizzes } from "../services/quizService"

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

async function fetchLesson(lessonId) {
  let lastError = null

  for (const base of API_BASES) {
    try {
      const response = await fetchWithAuth(`${base}/learning/lessons/${lessonId}`)

      const raw = await response.text()
      const data = raw ? JSON.parse(raw) : {}

      if (!response.ok) {
        throw new Error(data.error || "Failed to load lesson")
      }

      return data
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error("Failed to load lesson")
}

export default function LessonDetails() {
  const { lessonId } = useParams()
  const [lesson, setLesson] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const quizCompletedForLesson = useMemo(() => {
    try {
      const raw = localStorage.getItem("quizGrades")
      const parsed = raw ? JSON.parse(raw) : {}
      return Object.values(parsed).find(
        (grade) => grade && String(grade.lessonId) === String(lessonId)
      )
    } catch {
      return null
    }
  }, [lessonId])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError("")
    Promise.all([fetchLesson(lessonId), fetchQuizzes()])
      .then(([data, quizzes]) => {
        if (!mounted) return
        setLesson(data)
        setQuiz(
          quizzes.find((item) => String(item.lessonId) === String(data.lessonId)) || null
        )
      })
      .catch((e) => setError(e.message || "Failed to load lesson"))
      .finally(() => setLoading(false))
    return () => {
      mounted = false
    }
  }, [lessonId])

  const contentBlocks = useMemo(() => {
    if (!lesson?.lessonMaterial) return []

    const lines = String(lesson.lessonMaterial)
      .split("\n")
      .map((line) => line.trim())

    const blocks = []
    let currentBullets = []

    const flushBullets = () => {
      if (currentBullets.length === 0) return
      blocks.push({
        type: "bullets",
        items: currentBullets,
      })
      currentBullets = []
    }

    lines.forEach((line) => {
      if (!line) {
        flushBullets()
        return
      }

      if (line.startsWith("## ")) {
        flushBullets()
        blocks.push({
          type: "header",
          text: line.slice(3).trim(),
        })
        return
      }

      if (line.startsWith("- ")) {
        currentBullets.push(line.slice(2).trim())
        return
      }

      flushBullets()
      blocks.push({
        type: "paragraph",
        text: line,
      })
    })

    flushBullets()
    return blocks
  }, [lesson?.lessonMaterial])

  return (
    <div>
      <TopNav />
      <main className="page">
        <style>
          {`
            @keyframes lesson-details-loader-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
        <div style={{ marginBottom: 20 }}>
          <Link className="btn" to="/learning">
            Back To Learning
          </Link>
        </div>

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
                  animation: "lesson-details-loader-spin 0.9s linear infinite",
                }}
              />
              <div className="muted" style={{ fontWeight: 600 }}>
                Loading Lesson...
              </div>
            </div>
          </div>
        )}
        {error && <p className="muted">{error}</p>}

        {!loading && !error && lesson && (
          <>
            <div className="card">
              <h2 style={{ marginTop: 0 }}>{lesson.title}</h2>

              <div style={{ display: "grid", gap: 12 }}>
                {contentBlocks.map((block, idx) => {
                  if (block.type === "header") {
                    return (
                      <h3 key={idx} style={{ margin: 0 }}>
                        {block.text}
                      </h3>
                    )
                  }

                  if (block.type === "bullets") {
                    return (
                      <ul key={idx} style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
                        {block.items.map((item, itemIdx) => (
                          <li key={`${idx}-${itemIdx}`}>{item}</li>
                        ))}
                      </ul>
                    )
                  }

                  return (
                    <p key={idx} style={{ margin: 0 }}>
                      {block.text}
                    </p>
                  )
                })}
              </div>

              {lesson.score !== null && lesson.score !== undefined && (
                <div className="muted" style={{ marginTop: 12 }}>
                  Score: {lesson.score}
                </div>
              )}
            </div>

            {(quiz || quizCompletedForLesson) && (
              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                {quiz && (
                  <Link className="btn" to={`/learning/quizzes/${quiz.id}?lessonId=${lesson.lessonId}`}>
                    Take Quiz
                  </Link>
                )}
                {quizCompletedForLesson && (
                  <Link className="btn" to={`/inbox?lessonId=${lesson.lessonId}`}>
                    Take Test
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
