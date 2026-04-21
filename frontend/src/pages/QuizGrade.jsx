import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import TopNav from "../components/TopNav";

function getQuizGrade(quizId) {
  try {
    const raw = localStorage.getItem("quizGrades");
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed?.[quizId] || null;
  } catch {
    return null;
  }
}

export default function QuizGrade() {
  const { quizId } = useParams();
  const [reviewOpen, setReviewOpen] = useState(false);
  const grade = useMemo(() => getQuizGrade(quizId), [quizId]);
  const review = Array.isArray(grade?.review) ? grade.review : [];
  const percent = grade ? Math.round(Number(grade.percent) || 0) : 0;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (percent / 100) * circumference;

  return (
    <div>
      <TopNav />
      <main className="page">
        <div className="card" style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ marginTop: 0 }}>Quiz Grade</h2>
          <p className="muted">{grade?.title || "Your quiz result"}</p>

          <div
            style={{
              width: 160,
              height: 160,
              margin: "24px auto 12px",
              position: "relative",
            }}
          >
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="14"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                transform="rotate(-90 80 80)"
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                fontSize: "2rem",
                fontWeight: 900,
              }}
            >
              {grade ? `${percent}%` : "--"}
            </div>
          </div>

          <p className="muted" style={{ marginTop: 0 }}>
            {grade ? `${grade.score}/${grade.total} correct` : "No quiz submission found."}
          </p>
        </div>

        {review.length > 0 && (
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
              <span>Review Quiz</span>
              <span aria-hidden="true" style={{ fontSize: "1.25rem" }}>
                {reviewOpen ? "▲" : "▼"}
              </span>
            </button>

            {reviewOpen && (
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {review.map((item, index) => (
                  <div className="card" key={item.questionId || index} style={{ marginTop: 0 }}>
                    <div style={{ fontWeight: 700 }}>
                      {index + 1}. {item.prompt}
                    </div>
                    <div className="muted" style={{ marginTop: 8 }}>
                      Your answer: {item.selectedAnswer || "No answer selected"}
                    </div>
                    <div className="muted" style={{ marginTop: 4 }}>
                      Correct answer: {item.correctAnswer || "Not available"}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontWeight: 800,
                        color: item.isCorrect ? "#1f7a3a" : "#9b1c1c",
                      }}
                    >
                      {item.isCorrect ? "Correct" : "Incorrect"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ maxWidth: 720, margin: "16px auto 0", display: "flex", justifyContent: "flex-end" }}>
          <Link className="btn" to="/learning">
            Return To Learning
          </Link>
        </div>
      </main>
    </div>
  );
}
