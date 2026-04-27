import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";

const TEST_IDS = ["mock-1", "mock-2", "mock-3", "mock-4"];

function getTestResults() {
  try {
    const raw = localStorage.getItem("testGrades");
    const parsed = raw ? JSON.parse(raw) : {};
    return TEST_IDS.map((testId) => parsed?.[testId]).filter(Boolean);
  } catch {
    return [];
  }
}

export default function TestGrade() {
  const results = getTestResults();
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
            {answeredCount} of {TEST_IDS.length} questions answered
          </p>

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
