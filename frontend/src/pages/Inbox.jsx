import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";
import {
  ensureInboxTests,
  parseGeneratedTestDescription,
} from "../services/inboxTestService";

export default function Inbox() {
  const location = useLocation();
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const lessonId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const value = params.get("lessonId");
    return value ? String(value) : null;
  }, [location.search]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    ensureInboxTests(lessonId)
      .then((tests) => {
        if (!mounted) return;
        const mappedEmails = tests.map((test, index) => {
          const meta = parseGeneratedTestDescription(test.description) || {};
          const previewBody = Array.isArray(meta.body)
            ? meta.body.join(" ")
            : String(meta.body || "");

          return {
            id: index + 1,
            lessonId: meta.lessonId ? String(meta.lessonId) : lessonId,
            testId: test.testId,
            from: meta.sender || "Unknown sender",
            subject: meta.subject || test.title || "Generated email",
            preview:
              previewBody.slice(0, 120) ||
              "Open this email to review the message.",
            time: test.dateTaken
              ? new Date(test.dateTaken).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "",
          };
        });
        setEmails(mappedEmails);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || "Failed to load inbox emails.");
        setEmails([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [lessonId]);

  const completedTests = useMemo(() => {
    try {
      const raw = localStorage.getItem("testGrades");
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }, []);

  const completedCount = emails.filter(
    (email) => email.testId && completedTests[email.testId]
  ).length;
  const allEmailsAnswered = emails.length > 0 && completedCount === emails.length;

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
            {loading && <p className="muted">Loading inbox emails...</p>}
            {!loading && error && <p className="muted">{error}</p>}

            {!loading &&
              !error &&
              emails.map((email) => {
                const isCompleted = Boolean(
                  email.testId && completedTests[email.testId]
                );
                const href = email.lessonId
                  ? `/test?testId=${email.testId}&lessonId=${email.lessonId}`
                  : `/test?testId=${email.testId}`;

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
