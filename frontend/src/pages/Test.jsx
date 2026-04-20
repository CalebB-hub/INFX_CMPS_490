import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import TopNav from "../components/TopNav"
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

async function fetchTests() {
  let lastError = null

  for (const base of API_BASES) {
    try {
      const response = await fetchWithAuth(`${base}/learning/tests`)
      const raw = await response.text()
      const data = raw ? JSON.parse(raw) : {}

      if (!response.ok) {
        throw new Error(data.error || "Failed to load tests")
      }

      return Array.isArray(data.tests) ? data.tests : []
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error("Failed to load tests")
}

function parseTestDescription(description) {
  if (!description) return null
  try {
    const parsed = JSON.parse(description)
    if (parsed && typeof parsed === "object") return parsed
  } catch (e) {
    // ignore parse errors
  }
  return null
}

export default function Test() {
  const location = useLocation()
  const navigate = useNavigate()
  const [tests, setTests] = useState([])
  const [activeTestId, setActiveTestId] = useState(null)
  const [loadingTests, setLoadingTests] = useState(true)
  const [error, setError] = useState("")
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  const lessonIdParam = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const value = params.get("lessonId")
    return value ? String(value) : null
  }, [location.search])

  useEffect(() => {
    let mounted = true
    setLoadingTests(true)
    setError("")

    fetchTests()
      .then((data) => {
        if (!mounted) return
        setTests(data)
        if (lessonIdParam) {
          const matchingTest = data.find((test) => {
            const meta = parseTestDescription(test.description)
            return meta?.lessonId !== undefined && String(meta.lessonId) === lessonIdParam
          })
          setActiveTestId(matchingTest?.testId || data[0]?.testId || null)
        } else {
          setActiveTestId(data[0]?.testId || null)
        }
      })
      .catch((err) => {
        if (!mounted) return
        setError(err.message || "Failed to load tests")
      })
      .finally(() => {
        if (mounted) setLoadingTests(false)
      })

    return () => {
      mounted = false
    }
  }, [lessonIdParam])

  const activeTest = useMemo(
    () => tests.find((test) => test.testId === activeTestId) || null,
    [tests, activeTestId]
  )

  const emailParts = useMemo(() => {
    if (!activeTest) return null
    const fallback = {
      subject: activeTest.title || "Email test",
      sender: "Unknown sender",
      body: "",
    }
    if (!activeTest.description) return fallback
    const parsed = parseTestDescription(activeTest.description)
    if (parsed) {
      const hasEmailFields =
        parsed.subject || parsed.body || parsed.sender || parsed.from || parsed.content
      if (hasEmailFields) {
        return {
          subject: parsed.subject || fallback.subject,
          sender: parsed.sender || parsed.from || fallback.sender,
          body: parsed.body || parsed.content || parsed.email || "",
        }
      }
    }
    return {
      ...fallback,
      body: activeTest.description,
    }
  }, [activeTest])

  function handleSubmit(e) {
    e.preventDefault()
    if (!activeTest) {
      setStatusMessage("No test loaded.")
      return
    }
    const questions = activeTest.questions || []
    const unanswered = questions.filter((q) => !answers[q.questionId])
    if (unanswered.length > 0) {
      setStatusMessage("Answer all questions before submitting.")
      return
    }

    const correctCount = questions.reduce((acc, q) => {
      const expected = String(q.answer ?? "").toLowerCase()
      const selected = String(answers[q.questionId] ?? "").toLowerCase()
      if (!expected) return acc
      return expected === selected ? acc + 1 : acc
    }, 0)
    const total = questions.length
    const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0

    const payload = {
      testId: activeTest.testId,
      lessonId: lessonIdParam,
      title: activeTest.title,
      score: correctCount,
      total,
      percent,
      submittedAt: new Date().toISOString(),
    }

    try {
      const raw = localStorage.getItem("testGrades")
      const existing = raw ? JSON.parse(raw) : {}
      localStorage.setItem(
        "testGrades",
        JSON.stringify({ ...existing, [activeTest.testId]: payload })
      )
    } catch (e) {
      // ignore storage errors
    }

    setSubmitted(true)
    setStatusMessage("Responses saved.")
    navigate("/grades")
  }

  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>Test</h2>
        <p className="muted">Review the email and answer the questions below.</p>

        <div className="card" style={{ marginTop: 16 }}>
          {loadingTests && <div className="muted">Loading test email...</div>}
          {!loadingTests && error && <div className="muted">{error}</div>}
          {!loadingTests && !error && !activeTest && (
            <div className="muted">
              {lessonIdParam
                ? "No test available for this lesson yet."
                : "No tests available yet."}
            </div>
          )}
          {!loadingTests && !error && activeTest && emailParts && (
            <>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                Subject: {emailParts.subject || activeTest.title}
              </div>
              <div className="muted" style={{ marginBottom: 12 }}>
                From: {emailParts.sender || "Unknown sender"}
              </div>
              <div style={{ whiteSpace: "pre-line" }}>
                {Array.isArray(emailParts.body)
                  ? emailParts.body.join("\n")
                  : String(emailParts.body || "")}
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ marginTop: 16 }}>
          {!activeTest && <div className="muted">No questions available.</div>}
          {activeTest?.questions?.map((question) => (
            <div key={question.questionId} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                {question.questionText}
              </div>
              {["Phishing", "Not phishing"].map((option) => (
                <label
                  key={`${question.questionId}-${option}`}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <input
                    type="radio"
                    name={`question-${question.questionId}`}
                    value={option}
                    checked={answers[question.questionId] === option}
                    disabled={submitted}
                    onChange={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [question.questionId]: option,
                      }))
                    }
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
            <button className="btn" type="submit">
              {submitted ? "Submitted" : "Submit response"}
            </button>
            {statusMessage && <span className="muted">{statusMessage}</span>}
          </div>
        </form>
      </main>
    </div>
  )
}
