export async function mockResetPassword(token, password) {
  // mimic network delay
  await new Promise((r) => setTimeout(r, 400));
  // Always succeed for mock
  return { message: "Password reset successful." };
}
export async function mockForgotPassword(email) {
  // mimic network delay
  await new Promise((r) => setTimeout(r, 400));
  // Always succeed for mock
  return { message: "Reset email sent.", token: "mock-reset-token" };
}
// Mock “backend” — later you’ll swap this with real Django API calls.

const USERS = [
  {
    email: "student@example.com",
    password: "phishfree123",
    name: "Phish Free User",
    role: "individual",
  },
  {
    email: "admin@example.com",
    password: "phishfree123",
    name: "Phish Free Admin",
    role: "admin",
  },
];

export async function mockLogin(email, password) {
  await new Promise((r) => setTimeout(r, 400));

  const found = USERS.find((u) => u.email === email && u.password === password);
  if (found) {
    return {
      token: "mock-token-123",
      user: { email: found.email, name: found.name, role: found.role },
    };
  }

  const err = new Error("Invalid email or password.");
  err.status = 401;
  throw err;
}

/** * NEW: mockSignup function 
 * This lets your Signup page "submit" without crashing the app.
 */
export async function mockSignup(userData) {
  // mimic network delay
  await new Promise((r) => setTimeout(r, 600));

  // Since we are using a hardcoded user for now, 
  // we just return success to simulate a successful registration.
  console.log("Mock Signup Received:", userData);
  
  return {
    success: true,
    message: "Account created successfully! Please log in with the student credentials."
  };
}

// ----- Mock "DB" -----
const mockModules = [
  {
    id: "m1",
    title: "Spot the red flags",
    description: "Learn common phishing indicators.",
    lessonIds: ["l1"],
  },
  {
    id: "m2",
    title: "Links & attachments",
    description: "Safer ways to inspect links and files.",
    lessonIds: ["l2"],
  },
  {
    id: "m3",
    title: "Social engineering tactics",
    description: "How attackers manipulate trust and urgency.",
    lessonIds: ["l3"],
  },
]

const mockLessons = [
  {
    id: "l1",
    moduleId: "m1",
    title: "Lesson 1: Spot the red flags",
    body: [
      "Phishing emails often create urgency (e.g., 'Act now').",
      "Look for mismatched sender domains and suspicious wording.",
      "Be cautious with unexpected attachments and requests.",
    ],
    quizId: "q1",
  },
  {
    id: "l2",
    moduleId: "m2",
    title: "Lesson 2: Links & attachments",
    body: [
      "Hover links to preview the real destination.",
      "Use corporate tools/sandboxes when available.",
      "When unsure, verify via a trusted channel.",
    ],
    quizId: "q2",
  },
  {
    id: "l3",
    moduleId: "m3",
    title: "Lesson 3: Social engineering tactics",
    body: [
      "Attackers exploit authority, fear, curiosity, and urgency.",
      "They may impersonate coworkers or vendors.",
      "Slow down and verify before acting.",
    ],
    quizId: "q3",
  },
]

const mockQuizzes = [
  {
    id: "q1",
    lessonId: "l1",
    title: "Quiz: Spot the red flags",
    questions: [
      {
        id: "q1-1",
        prompt: "Which is a common phishing red flag?",
        options: ["Clear contact info", "Urgent tone demanding action", "Proper grammar"],
        correctIndex: 1,
      },
      {
        id: "q1-2",
        prompt: "What should you verify first?",
        options: ["Sender domain", "Font choice", "Email background color"],
        correctIndex: 0,
      },
    ],
  },
  {
    id: "q2",
    lessonId: "l2",
    title: "Quiz: Links & attachments",
    questions: [
      {
        id: "q2-1",
        prompt: "Best first step before clicking a link?",
        options: ["Click quickly", "Hover to preview URL", "Forward to everyone"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "q3",
    lessonId: "l3",
    title: "Quiz: Social engineering",
    questions: [
      {
        id: "q3-1",
        prompt: "A common tactic is:",
        options: ["Asking you to slow down", "Building urgency and pressure", "Encouraging verification"],
        correctIndex: 1,
      },
    ],
  },
]

// ----- Helpers -----
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// ----- Mock API -----
export async function mockGetModules() {
  await sleep(150)
  return mockModules
}

export async function mockGetLessonById(lessonId) {
  await sleep(150)
  const lesson = mockLessons.find((l) => l.id === lessonId)
  if (!lesson) throw new Error("Lesson not found")
  return lesson
}

export async function mockGetQuizById(quizId) {
  await sleep(150)
  const quiz = mockQuizzes.find((q) => q.id === quizId)
  if (!quiz) throw new Error("Quiz not found")
  return quiz
}