import { useState } from "react"
import TopNav from "../components/TopNav"

const INBOX_STORAGE_KEY = "pf_inbox_messages"

const SAMPLE_EMAIL = {
  subject: "Action Required: Update Your Payroll Details",
  from: "HR Support <hr-support@payroll-alerts.com>",
  body: [
    "Hello,",
    "",
    "We detected an issue with your payroll profile. To avoid payment delays, please verify your account information within the next 2 hours.",
    "",
    "Click the secure link below to confirm your details:",
    "http://payroll-verify.example.com/update",
    "",
    "Thank you,",
    "HR Support Team",
  ],
}

export default function Test() {
  const [response, setResponse] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

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
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            Subject: {SAMPLE_EMAIL.subject}
          </div>
          <div className="muted" style={{ marginBottom: 12 }}>
            From: {SAMPLE_EMAIL.from}
          </div>
          <div style={{ whiteSpace: "pre-line" }}>{SAMPLE_EMAIL.body.join("\n")}</div>
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
