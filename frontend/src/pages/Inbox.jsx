import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";

const emails = [
  {
    id: 1,
    lessonId: "1",
    testId: "mock-1",
    from: "IT Support <it-support@phishfree.local>",
    subject: "Action Required: Update Your Payroll Details",
    preview:
      "The system will briefly be unavailable from 11:00 PM to 11:30 PM while scheduled updates are applied.",
    time: "8:12 AM",
  },
  {
    id: 2,
    lessonId: "2",
    testId: "mock-2",
    from: "Payroll Team <payroll-update@secure-payroll-alerts.net>",
    subject: "Invoice past due - action needed",
    preview:
      "Your payment profile has been suspended. Verify your banking details immediately to avoid a delay.",
    time: "8:26 AM",
  },
  {
    id: 3,
    lessonId: "3",
    testId: "mock-3",
    from: "HR Department <hr@phishfree.local>",
    subject: "Password reset required",
    preview:
      "Open enrollment closes Friday. Review your selections in the employee portal before 5:00 PM.",
    time: "8:41 AM",
  },
  {
    id: 4,
    lessonId: "4",
    testId: "mock-4",
    from: "Microsoft 365 Security <security-team@micr0soft-mail.com>",
    subject: "Weekly sync meeting invite",
    preview:
      "We noticed suspicious activity on your account. Confirm your identity with the secure link below.",
    time: "9:03 AM",
  },
];

export default function Inbox() {
  const navigate = useNavigate();
  const completedTests = useMemo(() => {
    try {
      const raw = localStorage.getItem("testGrades");
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }, []);
  const completedCount = emails.filter((email) => email.testId && completedTests[email.testId]).length;
  const allEmailsAnswered = completedCount === emails.length;

  return (
    <div>
      <TopNav />
      <main className="page inbox-page">
        <section className="inbox-hero">
          <div>
            <h1>Inbox</h1>
            <p className="muted inbox-subtitle">
              Click on an email, read through it, and figure out whether it is phishing or phish free.
            </p>
          </div>
        </section>

        <section className="card inbox-card">
          <div className="inbox-toolbar">
            <div>
              <h2>Primary Mailbox</h2>
            </div>
            <span className="inbox-count">
              Answered {completedCount} of {emails.length} email questions
            </span>
          </div>

          <div className="inbox-list" role="list" aria-label="Inbox email list">
            {emails.map((email) => {
              const isCompleted = Boolean(email.testId && completedTests[email.testId]);
              const href = email.lessonId ? `/test?lessonId=${email.lessonId}` : "/test";

              return (
                <article
                  key={email.id}
                  className="inbox-message"
                  role="listitem"
                  onClick={() => navigate(href)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(href);
                    }
                  }}
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                >
                  <div className="inbox-message__main">
                    <p className="inbox-message__from">{email.from}</p>
                    <h3>{email.subject}</h3>
                    <p className="muted">{email.preview}</p>
                  </div>
                  <div className="inbox-message__meta">
                    {isCompleted && (
                      <div className="muted" style={{ fontWeight: 600, marginBottom: 6 }}>
                        Completed
                      </div>
                    )}
                    <time className="inbox-message__time">{email.time}</time>
                    <span className="inbox-message__arrow" aria-hidden="true">
                      →
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {allEmailsAnswered && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 16,
            }}
          >
            <button
              className="btn"
              type="button"
              onClick={() => navigate("/test-grade")}
            >
              Submit Test
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
