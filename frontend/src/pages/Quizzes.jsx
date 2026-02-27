import TopNav from "../components/TopNav";

const MODULE_QUIZZES = [
  {
    module: "Module 1: Spot the red flags",
    quizzes: ["Red flags basics", "Urgency & fear tactics", "Sender spoofing cues"],
  },
  {
    module: "Module 2: Links & attachments",
    quizzes: ["Link inspection", "Attachment safety", "Safe preview habits"],
  },
  {
    module: "Module 3: Social engineering tactics",
    quizzes: ["Impersonation tactics", "Pretexting scenarios", "Report & respond"],
  },
];

export default function Quizzes() {
  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>Quizzes</h2>
        <p className="muted">Review all quizzes tied to each learning module.</p>

        {MODULE_QUIZZES.map((item) => (
          <div className="card" key={item.module}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h3 style={{ margin: 0 }}>{item.module}</h3>
              <button className="btn" style={{ marginLeft: "auto" }} type="button">
                Take quiz
              </button>
            </div>
            <ul>
              {item.quizzes.map((quiz) => (
                <li key={quiz}>{quiz}</li>
              ))}
            </ul>
          </div>
        ))}
      </main>
    </div>
  );
}
