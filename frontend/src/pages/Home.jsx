import TopNav from "../components/TopNav";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>Home</h2>
        <p className="muted">
          Welcome to Phish Free. This is the starting dashboard.
        </p>

        <div className="card">
          <h3>Next steps</h3>
          <ul>
            <li>Add a “Simulated Emails” module</li>
            <li>Add an assessment/quiz flow</li>
            <li>Add progress tracking UI (mocked data)</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
