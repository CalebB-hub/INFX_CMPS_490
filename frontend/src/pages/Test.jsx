import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";
import {
  ensureInboxTests,
  getLessonTestGrade,
  parseGeneratedTestDescription,
  saveLessonEmailAnswer,
} from "../services/inboxTestService";

export default function Test() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [error, setError] = useState("");
  const [verdict, setVerdict] = useState("");
  const [phishingReason, setPhishingReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const lessonIdParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const value = params.get("lessonId");
    return value ? String(value) : null;
  }, [location.search]);

  const testIdParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const value = params.get("testId");
    return value ? String(value) : null;
  }, [location.search]);

  const emailIdParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const value = params.get("emailId");
    return value ? String(value) : null;
  }, [location.search]);

  useEffect(() => {
    let mounted = true;
    setLoadingTests(true);
    setError("");

    ensureInboxTests(lessonIdParam)
      .then((data) => {
        if (!mounted) return;
        setTests(data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || "Failed to load tests");
      })
      .finally(() => {
        if (mounted) setLoadingTests(false);
      });

    return () => {
      mounted = false;
    };
  }, [lessonIdParam]);

  const activeTest = useMemo(() => {
    return (
      tests.find(
        (test) =>
          String(test.testId) === String(testIdParam) &&
          String(test.emailId || test.questions?.[0]?.questionId) === String(emailIdParam)
      ) || null
    );
  }, [emailIdParam, testIdParam, tests]);

  const emailParts = useMemo(() => {
    if (!activeTest) return null;
    const fallback = {
      subject: activeTest.title || "Email test",
      sender: "Unknown sender",
      body: "",
    };
    if (!activeTest.description) return fallback;
    const parsed = parseGeneratedTestDescription(activeTest.description);
    if (parsed) {
      return {
        subject: parsed.subject || fallback.subject,
        sender: parsed.sender || parsed.from || fallback.sender,
        body: parsed.body || parsed.content || parsed.email || "",
      };
    }
    return {
      ...fallback,
      body: activeTest.description,
    };
  }, [activeTest]);

  useEffect(() => {
    if (!lessonIdParam || !activeTest) return;
    const lessonGrade = getLessonTestGrade(lessonIdParam);
    const savedAnswer =
      lessonGrade?.emails?.[
        String(activeTest.emailId || activeTest.questions?.[0]?.questionId)
      ];

    if (!savedAnswer) {
      setVerdict("");
      setPhishingReason("");
      setSubmitted(false);
      setStatusMessage("");
      return;
    }

    setVerdict(savedAnswer.selectedAnswer || "");
    setPhishingReason(savedAnswer.phishingReason || "");
    setSubmitted(false);
    setStatusMessage("Saved answer loaded.");
  }, [activeTest, lessonIdParam]);

  const phishingReasonOptions = [
    "The message creates urgency and pushes you to act immediately.",
    "The sender and link look suspicious and do not match a trusted company domain.",
    "The email asks for sensitive account information through an untrusted link.",
    "The message uses pressure to make you ignore normal verification steps.",
    "All of the above are phishing red flags.",
  ];

  const canSubmit =
    verdict === "Phish Free" || (verdict === "Phishing" && Boolean(phishingReason));

  function handleVerdictSelect(option) {
    if (!activeTest) {
      setStatusMessage("No test loaded.");
      return;
    }
    setVerdict(option);
    setStatusMessage("");
    if (option !== "Phishing") {
      setPhishingReason("");
    }
  }

  function handleSubmit() {
    if (!activeTest || !lessonIdParam) {
      setStatusMessage("No test loaded.");
      return;
    }
    if (!canSubmit) {
      setStatusMessage("Select an answer before submitting.");
      return;
    }

    const questions = activeTest.questions || [];
    const correctAnswer = String(questions[0]?.answer ?? "");
    const selectedAnswer = verdict;
    const isCorrect =
      correctAnswer.trim().toLowerCase() === selectedAnswer.trim().toLowerCase();

    saveLessonEmailAnswer({
      lessonId: lessonIdParam,
      testId: activeTest.testId,
      emailId: activeTest.emailId || questions[0]?.questionId,
      title: activeTest.title,
      sender: emailParts?.sender,
      subject: emailParts?.subject,
      selectedAnswer,
      correctAnswer,
      isCorrect,
      phishingReason: selectedAnswer === "Phishing" ? phishingReason : "",
    });

    setSubmitted(true);
    setStatusMessage("Response saved.");
    navigate(`/inbox?lessonId=${lessonIdParam}`);
  }

  return (
    <div>
      <TopNav />
      <main className="page">
        <div style={{ marginBottom: 20 }}>
          <Link className="btn" to={lessonIdParam ? `/inbox?lessonId=${lessonIdParam}` : "/inbox"}>
            Back To Inbox
          </Link>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Test Email</h2>
          <div style={{ marginTop: 16 }}>
            {loadingTests && <div className="muted">Loading test email...</div>}
            {!loadingTests && error && <div className="muted">{error}</div>}
            {!loadingTests && !error && !activeTest && (
              <div className="muted">No test email was found for this lesson.</div>
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
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          {!activeTest && <div className="muted">No questions available.</div>}
          {activeTest && !submitted && (
            <div style={{ display: "grid", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                {["Phishing", "Phish Free"].map((option) => {
                  const isSelected = verdict === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      className="btn topnav__profileBtn"
                      onClick={() => handleVerdictSelect(option)}
                      style={{
                        minWidth: 140,
                        justifyContent: "center",
                        opacity: isSelected ? 1 : 0.85,
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {verdict === "Phishing" && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ fontWeight: 600 }}>Why is this email phishing?</div>
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
  );
}
