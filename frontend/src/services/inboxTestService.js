import { getAccessToken, refreshAccessToken } from "./authService";

import { API_BASES } from '../config';
const EMAILS_PER_INBOX = 4;
const TEST_GRADES_KEY = "testGrades";

async function fetchWithAuth(url, options = {}) {
  const token = getAccessToken();
  if (!token) {
    throw new Error("You are not logged in.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (response.status !== 401) {
    return response;
  }

  const refreshedToken = await refreshAccessToken();
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshedToken}`,
      ...(options.headers || {}),
    },
  });
}

export function parseGeneratedTestDescription(description) {
  if (!description) return null;
  try {
    const parsed = JSON.parse(description);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeGeneratedEmail(email, lessonId, testId, index) {
  const sender = String(email?.sender || "Unknown sender");
  const subject = String(email?.subject || `Generated email ${index + 1}`);
  const body = Array.isArray(email?.body) ? email.body : String(email?.body || "");
  const isPhishing = Boolean(email?.isPhishing);
  const emailId = String(email?.emailId ?? index + 1);

  return {
    lessonId: lessonId ? String(lessonId) : null,
    testId: String(testId),
    emailId,
    title: subject,
    description: JSON.stringify({
      lessonId: lessonId ? String(lessonId) : null,
      sender,
      subject,
      body,
      isPhishing,
      redFlags: Array.isArray(email?.redFlags) ? email.redFlags : [],
    }),
    dateTaken: email?.dateTaken || null,
    questions: [
      {
        questionId: emailId,
        questionText: "Is this email phishing?",
        answer: isPhishing ? "Phishing" : "Phish Free",
      },
    ],
  };
}

function buildGeneratedTests(payload, lessonId) {
  const resolvedLessonId = payload?.lessonId ?? lessonId;
  const resolvedTestId = payload?.testId;
  const emails = Array.isArray(payload?.emails) ? payload.emails : [];

  if (!resolvedLessonId || !resolvedTestId || emails.length === 0) {
    return [];
  }

  return emails.slice(0, EMAILS_PER_INBOX).map((email, index) =>
    normalizeGeneratedEmail(email, resolvedLessonId, resolvedTestId, index)
  );
}

export async function ensureInboxTests(lessonId) {
  if (!lessonId) {
    throw new Error("A lesson is required before starting a test.");
  }

  let lastError = null;

  for (const base of API_BASES) {
    try {
      const response = await fetchWithAuth(`${base}/generate-test-emails/`, {
        method: "POST",
        body: JSON.stringify({ lessonId: String(lessonId) }),
      });
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate test emails");
      }

      const generatedTests = buildGeneratedTests(data, lessonId);
      if (generatedTests.length !== EMAILS_PER_INBOX) {
        throw new Error("Expected 4 generated emails for this lesson test.");
      }

      return generatedTests;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Failed to load inbox tests");
}

function readTestGrades() {
  try {
    const raw = localStorage.getItem(TEST_GRADES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeTestGrades(value) {
  localStorage.setItem(TEST_GRADES_KEY, JSON.stringify(value));
}

export function getAllLessonTestGrades() {
  return readTestGrades();
}

export function getLessonTestGrade(lessonId) {
  if (!lessonId) return null;
  const grades = readTestGrades();
  return grades[String(lessonId)] || null;
}

export function saveLessonEmailAnswer({
  lessonId,
  testId,
  emailId,
  title,
  sender,
  subject,
  selectedAnswer,
  correctAnswer,
  isCorrect,
  phishingReason,
}) {
  if (!lessonId || !testId || !emailId) {
    return null;
  }

  const key = String(lessonId);
  const grades = readTestGrades();
  const existingLesson = grades[key] || {};
  const existingEmails = existingLesson.emails || {};
  const submittedAt = new Date().toISOString();

  grades[key] = {
    lessonId: key,
    testId: String(testId),
    emails: {
      ...existingEmails,
      [String(emailId)]: {
        emailId: String(emailId),
        title: title || subject || "Generated email",
        sender: sender || "Unknown sender",
        subject: subject || title || "Generated email",
        selectedAnswer,
        correctAnswer,
        isCorrect: Boolean(isCorrect),
        phishingReason: phishingReason || "",
        submittedAt,
      },
    },
    finalScore: null,
    finalPercent: null,
    finalizedAt: null,
  };

  writeTestGrades(grades);
  return grades[key];
}

export function finalizeLessonTest(lessonId) {
  if (!lessonId) return null;
  const key = String(lessonId);
  const grades = readTestGrades();
  const lessonGrade = grades[key];
  const results = Object.values(lessonGrade?.emails || {});

  if (results.length !== EMAILS_PER_INBOX) {
    return null;
  }

  const finalScore = results.reduce(
    (sum, result) => sum + (result?.isCorrect ? 1 : 0),
    0
  );
  const finalPercent = Math.round((finalScore / EMAILS_PER_INBOX) * 100);

  grades[key] = {
    ...lessonGrade,
    finalScore,
    finalPercent,
    finalizedAt: new Date().toISOString(),
  };

  writeTestGrades(grades);
  return grades[key];
}

export function getLessonTestSummary(lessonId) {
  const lessonGrade = getLessonTestGrade(lessonId);
  const emailResults = Object.values(lessonGrade?.emails || {});
  return {
    lessonGrade,
    emailResults,
    answeredCount: emailResults.length,
    totalEmails: EMAILS_PER_INBOX,
    allAnswered: emailResults.length === EMAILS_PER_INBOX,
  };
}
