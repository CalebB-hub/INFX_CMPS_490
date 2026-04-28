import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";

function getTestResults() {
  try {
    const raw = localStorage.getItem("testGrades");
    const parsed = raw ? JSON.parse(raw) : {};
    return Object.values(parsed).filter(Boolean);
  } catch {
    return [];
  }
}

export default function TestGrade() {
  const [reviewOpen, setReviewOpen] = useState(false);
  const results = useMemo(() => getTestResults(), []);
  const answeredCount = results.length;
  const average =
    answeredCount > 0
      ? results.reduce((sum, result) => sum + (Number(result.percent) || 0), 0) /
        answeredCount
      : 0;
  const grade = Math.round(average);

  return (
    <div>
      <TopNav />
      <main className="page">
        <div className="card" style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ marginTop: 0 }}>Test Grade</h2>
          <p className="muted">
            Your final score is based on the average of all answered email questions.
          </p>

          <div style={{ fontSize: "4rem", fontWeight: 800, margin: "24px 0 8px" }}>
            {grade}%
          </div>
          <p className="muted" style={{ marginTop: 0 }}>
            {answeredCount} of 4 questions answered
          </p>
        </div>

        {results.length > 0 && (
          <div className="card" style={{ maxWidth: 720, margin: "16px auto 0" }}>
            <button
              type="button"
              onClick={() => setReviewOpen((open) => !open)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "transparent",
                border: "none",
                color: "inherit",
                padding: 0,
                cursor: "pointer",
                font: "inherit",
                fontWeight: 800,
              }}
            >
              <span>Review Test</span>
              <span aria-hidden="true" style={{ fontSize: "1.25rem" }}>
                {reviewOpen ? "^" : "v"}
              </span>
            </button>

            {reviewOpen && (
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {results.map((result, index) => {
                  const reviewItem = Array.isArray(result.review) ? result.review[0] : null;
                  const isCorrect = Boolean(reviewItem?.isCorrect);
                  return (
                    <div className="card" key={result.testId || index} style={{ marginTop: 0 }}>
                      <div style={{ fontWeight: 700 }}>
                        {index + 1}. {result.title || "Generated email"}
                      </div>
                      <div className="muted" style={{ marginTop: 8 }}>
                        Your answer: {reviewItem?.selectedAnswer || result.verdict || "No answer selected"}
                      </div>
                      <div className="muted" style={{ marginTop: 4 }}>
                        Correct answer: {reviewItem?.correctAnswer || "Not available"}
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          fontWeight: 800,
                          color: isCorrect ? "#1f7a3a" : "#9b1c1c",
                        }}
                      >
                        {isCorrect ? "Correct" : "Incorrect"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div style={{ maxWidth: 720, margin: "16px auto 0", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ marginTop: 24 }}>
            <Link className="btn" to="/learning">
              Return To Learning
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
