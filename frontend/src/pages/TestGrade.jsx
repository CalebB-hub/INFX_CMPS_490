import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import TopNav from "../components/TopNav";
import { getLessonTestSummary } from "../services/inboxTestService";

export default function TestGrade() {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get("lessonId");

  const { lessonGrade, emailResults, answeredCount, totalEmails } = useMemo(
    () => getLessonTestSummary(lessonId),
    [lessonId]
  );

  const orderedResults = useMemo(
    () =>
      [...emailResults].sort(
        (left, right) => Number(left.emailId || 0) - Number(right.emailId || 0)
      ),
    [emailResults]
  );

  const score =
    typeof lessonGrade?.finalScore === "number"
      ? lessonGrade.finalScore
      : orderedResults.reduce(
          (sum, result) => sum + (result?.isCorrect ? 1 : 0),
          0
        );
  const grade =
    typeof lessonGrade?.finalPercent === "number"
      ? lessonGrade.finalPercent
      : answeredCount > 0
        ? Math.round((score / totalEmails) * 100)
        : 0;

  return (
    <div>
      <TopNav />
      <main className="page">
        <div className="card" style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ marginTop: 0 }}>Test Grade</h2>
          <p className="muted">
            Your final score is based on the 4 email questions in this lesson test.
          </p>

          <div style={{ fontSize: "4rem", fontWeight: 800, margin: "24px 0 8px" }}>
            {grade}%
          </div>
          <p className="muted" style={{ marginTop: 0 }}>
            {answeredCount} of {totalEmails} questions answered
          </p>
        </div>

        {orderedResults.length > 0 && (
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
                {orderedResults.map((result, index) => (
                  <div className="card" key={result.emailId || index} style={{ marginTop: 0 }}>
                    <div style={{ fontWeight: 700 }}>
                      {index + 1}. {result.subject || result.title || "Generated email"}
                    </div>
                    <div className="muted" style={{ marginTop: 8 }}>
                      Your answer: {result.selectedAnswer || "No answer selected"}
                    </div>
                    <div className="muted" style={{ marginTop: 4 }}>
                      Correct answer: {result.correctAnswer || "Not available"}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontWeight: 800,
                        color: result.isCorrect ? "#1f7a3a" : "#9b1c1c",
                      }}
                    >
                      {result.isCorrect ? "Correct" : "Incorrect"}
                    </div>
                  </div>
                ))}
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
