import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";

export default function Learning() {
  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>Learning</h2>
        <p className="muted">
          This will hold modules like phishing email simulations, quizzes, and completion tracking.
        </p>

        <div className="card">
          <h3>Mock modules</h3>
          <ul>
            <li>Module 1: Spot the red flags</li>
            <li>Module 2: Links & attachments</li>
            <li>Module 3: Social engineering tactics</li>
          </ul>
        </div>

        <div style={{ marginTop: "16px" }}>
          <Link className="btn" to="/learning/quizzes">Quizzes</Link>
        </div>
      </main>
    </div>
  );
}