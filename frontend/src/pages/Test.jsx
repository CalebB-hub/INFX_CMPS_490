import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import TopNav from "../components/TopNav"
import { getAccessToken, refreshAccessToken } from "../services/authService"

const API_BASES = ["http://localhost:8000/api", "/api"]
const MOCK_TESTS = [
  {
    testId: "mock-1",
    title: "Payroll update request",
    description: JSON.stringify({
      lessonId: "1",
      subject: "Invoice past due - action needed",
      sender: "HR Support <hr-support@payroll-alerts.com>",
      body: [
        "Hello,",
        "",
        "We detected an issue with your payroll profile. To avoid payment delays,",
        "please verify your account information within the next 2 hours.",
        "",
        "Click the secure link below to confirm your details:",
        "http://payroll-verify.example.com/update",
        "",
        "Thank you,",
        "HR Support Team",
      ],
    }),
    questions: [
      {
        questionId: "mock-1-q1",
        questionText: "Is this email phishing?",
        answer: "Phishing",
      },
      {
        questionId: "mock-1-q2",
        questionText: "Is the link safe to click?",
        answer: "Phishing",
      },
    ],
  },
  {
    testId: "mock-2",
    title: "Vendor invoice follow-up",
    description: JSON.stringify({
      lessonId: "2",
      subject: "Invoice past due - action needed",
      sender: "Accounts Payable <ap@vendor-payments.io>",
      body: [
        "Hi team,",
        "",
        "Your invoice #INV-4391 is overdue. Please review the attached statement",
        "and submit payment today to avoid late fees.",
        "",
        "Let us know if you have any questions.",
        "",
        "Accounts Payable",
      ],
    }),
    questions: [
      {
        questionId: "mock-2-q1",
        questionText: "Is this email phishing?",
        answer: "Not phishing",
      },
    ],
  },
  {
    testId: "mock-3",
    title: "Password reset notice",
    description: JSON.stringify({
      lessonId: "3",
      subject: "Password reset required",
      sender: "IT Helpdesk <helpdesk@it-support.com>",
      body: [
        "Hi,",
        "",
        "We detected unusual activity on your account. Please reset your password",
        "immediately using the secure portal below.",
        "",
        "https://it-support.example.com/reset",
        "",
        "If you did not request this, contact the help desk.",
      ],
    }),
    questions: [
      {
        questionId: "mock-3-q1",
        questionText: "Is this email phishing?",
        answer: "Phishing",
      },
    ],
  },
  {
    testId: "mock-4",
    title: "Team meeting invite",
    description: JSON.stringify({
      lessonId: "4",
      subject: "Weekly sync meeting invite",
      sender: "Project Lead <lead@company.com>",
      body: [
        "Hi team,",
        "",
        "Reminder about our weekly sync tomorrow at 10am.",
        "Agenda is attached in the calendar invite.",
        "",
        "Thanks,",
        "Project Lead",
      ],
    }),
    questions: [
      {
        questionId: "mock-4-q1",
        questionText: "Is this email phishing?",
        answer: "Not phishing",
      },
    ],
  },
]

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
      const contentType = response.headers.get("content-type") || ""
      const raw = await response.text()
      const isJson = contentType.includes("application/json")
      const data = raw && isJson ? JSON.parse(raw) : {}

      if (!response.ok) {
        if (!isJson) {
          throw new Error("Test API returned a non-JSON response.")
        }
        throw new Error(data.error || "Failed to load tests")
      }

      const tests = Array.isArray(data.tests) ? data.tests : []
      return tests.length > 0 ? tests : MOCK_TESTS
    } catch (error) {
      lastError = error
    }
  }

  if (lastError) {
    // Fallback to mock data when backend is unavailable.
    return MOCK_TESTS
  }

  throw new Error("Failed to load tests")
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
  const [verdict, setVerdict] = useState("")
  const [phishingReason, setPhishingReason] = useState("")
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

  useEffect(() => {
    if (tests.length === 0) return
    if (activeTestId) return
    setActiveTestId(tests[0]?.testId || null)
  }, [tests, activeTestId])

  const activeTest = useMemo(
    () => tests.find((test) => test.testId === activeTestId) || null,
    [tests, activeTestId]
  )

  const showFallbackTest = !loadingTests && !error && !activeTest && tests.length > 0

  const emailParts = useMemo(() => {
    const baseTest = activeTest || tests[0]
    if (!baseTest) return null
    const fallback = {
      subject: baseTest.title || "Email test",
      sender: "Unknown sender",
      body: "",
    }
    if (!baseTest.description) return fallback
    const parsed = parseTestDescription(baseTest.description)
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
      body: baseTest.description,
    }
  }, [activeTest, tests])

  const phishingReasonOptions = [
    "The message creates urgency and pushes you to act immediately.",
    "The sender and link look suspicious and do not match a trusted company domain.",
    "The email asks for sensitive account information through an untrusted link.",
    "The message uses pressure to make you ignore normal verification steps.",
    "All of the above are phishing red flags.",
  ]

  const canSubmit =
    verdict === "Not Phishing" || (verdict === "Phishing" && Boolean(phishingReason))

  function handleVerdictSelect(option) {
    if (!activeTest) {
      setStatusMessage("No test loaded.")
      return
    }
    setVerdict(option)
    setStatusMessage("")
    if (option !== "Phishing") {
      setPhishingReason("")
    }
  }

  function handleSubmit() {
    if (!activeTest) {
      setStatusMessage("No test loaded.")
      return
    }
    if (!canSubmit) {
      setStatusMessage("Select an answer before submitting.")
      return
    }

    const questions = activeTest.questions || []
    const expected = String(questions[0]?.answer ?? "").toLowerCase()
    const selected = verdict.toLowerCase()
    const isCorrect = expected ? expected === selected : false
    const correctCount = isCorrect ? 1 : 0
    const total = expected ? 1 : 0
    const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0

    const payload = {
      testId: activeTest.testId,
      lessonId: lessonIdParam,
      title: activeTest.title,
      verdict,
      phishingReason: verdict === "Phishing" ? phishingReason : "",
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
    navigate("/inbox")
  }

  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>Email</h2>
        <p className="muted">Review the email and answer the questions below.</p>

        <div className="card" style={{ marginTop: 16 }}>
          {loadingTests && <div className="muted">Loading test email...</div>}
          {!loadingTests && error && <div className="muted">{error}</div>}
          {!loadingTests && !error && !activeTest && !showFallbackTest && (
            <div className="muted">
              {lessonIdParam
                ? "No test available for this lesson yet."
                : "No tests available yet."}
            </div>
          )}
          {!loadingTests && !error && (activeTest || showFallbackTest) && emailParts && (
            <>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                Subject: {emailParts.subject || activeTest?.title || tests[0]?.title}
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

        <div className="card" style={{ marginTop: 16 }}>
          {!activeTest && <div className="muted">No questions available.</div>}
          {activeTest && !submitted && (
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "flex-start", gap: 16, flexWrap: "wrap" }}>
                {["Phishing", "Not Phishing"].map((option) => {
                  const isSelected = verdict === option
                  return (
                    <button
                      key={option}
                      type="button"
                      className="btn topnav__profileBtn"
                      disabled={submitted}
                      onClick={() => handleVerdictSelect(option)}
                      style={{
                        minWidth: 140,
                        justifyContent: "center",
                        opacity: isSelected ? 1 : 0.85,
                      }}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>

              {verdict === "Phishing" && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ fontWeight: 600 }}>
                    Why is this email phishing?
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {phishingReasonOptions.map((option) => (
                      <label
                        key={option}
                        style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
                      >
                        <input
                          type="radio"
                          name="phishing-reason"
                          checked={phishingReason === option}
                          onChange={() => setPhishingReason(option)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <button
                  type="button"
                  className="btn"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  style={{
                    minWidth: 140,
                    opacity: canSubmit ? 1 : 0.5,
                    cursor: canSubmit ? "pointer" : "not-allowed",
                  }}
                >
                  Submit
                </button>
              </div>
            </div>
          )}
          {statusMessage && (
            <div className="muted" style={{ marginTop: 12, textAlign: "center" }}>
              {statusMessage}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
