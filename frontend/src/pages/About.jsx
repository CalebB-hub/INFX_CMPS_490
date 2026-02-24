import TopNav from "../components/TopNav";

export default function About() {
  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>About Phish Free</h2>
        <p className="muted">
          Phish Free helps teams build phishing awareness through guided learning, simulations, and
          progress tracking.
        </p>

        <div className="card">
          <h3>What this app includes</h3>
          <ul>
            <li>Interactive learning modules for spotting red flags</li>
            <li>Simulated phishing scenarios with safe practice</li>
            <li>Simple progress tracking and user profiles</li>
          </ul>
        </div>

        <div className="card">
          <h3>Our mission</h3>
          <p>
            Make security training approachable, practical, and consistent so people can recognize
            threats before they click. 
          </p>
        </div>
      </main>
    </div>
  );
}

