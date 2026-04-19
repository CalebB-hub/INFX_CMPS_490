import { useEffect, useState } from "react"
import TopNav from "../components/TopNav"
import { API_BASE } from "../services/apiConfig"

const INBOX_STORAGE_KEY = "pf_inbox_messages"

async function fetchGeneratedEmails(token, subject) {
  const response = await fetch(`${API_BASE}/generate-test-emails/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ subject }),
  })

  const raw = await response.text()
  const data = raw ? JSON.parse(raw) : {}

  if (!response.ok) {
    throw new Error(data.error || "Failed to generate test emails")
  }

  return Array.isArray(data.emails) ? data.emails : []
}

export default function Test() {
  const [topic, setTopic] = useState("Urgency")
  const [email, setEmail] = useState(null)
  const [loadingEmail, setLoadingEmail] = useState(true)
  const [response, setResponse] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  async function generateEmail(selectedTopic = topic) {
    try {
      setLoadingEmail(true)
      setStatusMessage("")

      const token = localStorage.getItem("pf_auth_token")
      if (!token) {
        throw new Error("You are not logged in.")
      }

      const emails = await fetchGeneratedEmails(token, selectedTopic)
      if (!emails.length) {
        throw new Error("No emails were generated.")
      }

      // Pick one generated email for the current test prompt.
      setEmail(emails[Math.floor(Math.random() * emails.length)])
      setSubmitted(false)
      setResponse("")
    } catch (error) {
      setEmail(null)
      setStatusMessage(error.message || "Failed to load test email.")
    } finally {
      setLoadingEmail(false)
    }
  }

  useEffect(() => {
    generateEmail("Urgency")
  }, [])

  function saveInboxMessage() {
    const message = {
      id: `test-${Date.now()}`,
      text: "Test submitted — review your response",
      href: "/test",
      createdAt: new Date().toISOString(),
    }

    try {
      const raw = localStorage.getItem(INBOX_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      const next = Array.isArray(parsed) ? [message, ...parsed] : [message]
      localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(next))
    } catch {
      localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify([message]))
    }

    window.dispatchEvent(new Event("pf_inbox_updated"))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!email) {
      setStatusMessage("Generate a test email before submitting.")
      return
    }
    if (!response.trim()) {
      setStatusMessage("Please describe the mistakes you see in the email.")
      return
    }

    setSubmitted(true)
    setStatusMessage("Saved! Check your inbox for the test message.")
    saveInboxMessage()
  }

  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>Test</h2>
        <p className="muted">
          Review the email and identify any mistakes or red flags.
        </p>

        <div className="card" style={{ marginTop: 16 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
            Topic focus
          </label>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Payroll, Urgency, Vendor Invoice"
              style={{ flex: 1, padding: 10 }}
            />
            <button
              className="btn"
              type="button"
              onClick={() => generateEmail(topic.trim() || "Urgency")}
              disabled={loadingEmail}
            >
              {loadingEmail ? "Generating..." : "Generate email"}
            </button>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          {loadingEmail && <div className="muted">Generating test email...</div>}
          {!loadingEmail && !email && (
            <div className="muted">No email loaded. Generate a new test email.</div>
          )}
          {!loadingEmail && email && (
            <>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                Subject: {email.subject}
              </div>
              <div className="muted" style={{ marginBottom: 12 }}>
                From: {email.sender || "Unknown sender"}
              </div>
              <div style={{ whiteSpace: "pre-line" }}>
                {Array.isArray(email.body) ? email.body.join("\n") : String(email.body || "")}
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ marginTop: 16 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
            What mistakes do you see in this email?
          </label>
          <textarea
            rows={6}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="List the issues you notice (e.g., urgency, suspicious link, sender mismatch)."
            style={{ width: "100%", padding: 12, resize: "vertical" }}
          />
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
