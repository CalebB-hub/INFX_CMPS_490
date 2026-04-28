import TopNav from "../components/TopNav";

export default function About() {
  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>About Phish Free</h2>

        <div className="card">
          <h3>What this app includes</h3>
            <ul>
              <li>Realistic AI generated phishing simulations</li>
              <li>Cybersecurity lessons on phishing awareness</li>
              <li>Quizzes to reinforce learning</li>
              <li>User progress tracking and profiles</li>
          </ul>
        </div>

        <div className="card">
          <h3>Our Mission</h3>
          <p>
            Phish Free’s mission is to reduce phishing attacks by educating users through realistic simulations, interactive training, and AI powered cybersecurity awareness, helping build a smarter and safer digital workforce.
          </p>
        </div>
      </main>
    </div>
  );
}

