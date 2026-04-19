import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import TopNav from "../components/TopNav"
import { getAccessToken, refreshAccessToken } from "../services/authService"
import { API_BASE } from "../services/apiConfig"

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
  const response = await fetchWithAuth(`${API_BASE}/learning/lessons/${lessonId}`)

  const raw = await response.text()
  const data = raw ? JSON.parse(raw) : {}

  if (!response.ok) {
    throw new Error(data.error || "Failed to load lesson")
  }

  return data
}

export default function LessonDetails() {
  const { lessonId } = useParams()
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError("")
    fetchLesson(lessonId)
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

  const paragraphs = useMemo(() => {
    if (!lesson?.lessonMaterial) return []
    return lesson.lessonMaterial
      .split(/\n\s*\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  }, [lesson?.lessonMaterial])

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
              Lesson ID: {lesson.lessonId}
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {paragraphs.map((p, idx) => (
                <p key={idx} style={{ margin: 0 }}>
                  {p}
                </p>
              ))}
            </div>

            {lesson.score !== null && lesson.score !== undefined && (
              <div className="muted" style={{ marginTop: 12 }}>
                Score: {lesson.score}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}