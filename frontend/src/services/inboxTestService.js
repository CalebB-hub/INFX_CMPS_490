import { getAccessToken, refreshAccessToken } from "./authService";

const API_BASES = ["http://localhost:8000/api", "/api"];
const EMAILS_PER_INBOX = 4;

function getStorageKey(lessonId) {
  return lessonId ? `generatedInboxTests:${lessonId}` : "generatedInboxTests:default";
}

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

export function getStoredInboxTests(lessonId) {
  try {
    const raw = localStorage.getItem(getStorageKey(lessonId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function storeInboxTests(lessonId, tests) {
  localStorage.setItem(getStorageKey(lessonId), JSON.stringify(tests));
}

function buildGeneratedTests(emails, lessonId) {
  const scope = lessonId || "default";
  const timestamp = new Date().toISOString();

  return emails.slice(0, EMAILS_PER_INBOX).map((email, index) => {
    const sender = String(email?.sender || "Unknown sender");
    const subject = String(email?.subject || `Generated email ${index + 1}`);
    const body = Array.isArray(email?.body) ? email.body : String(email?.body || "");
    const isPhishing = Boolean(email?.is_phishing);

    return {
      testId: `generated-${scope}-${index + 1}`,
      title: subject,
      description: JSON.stringify({
        lessonId: lessonId || null,
        sender,
        subject,
        body,
        isPhishing,
        redFlags: Array.isArray(email?.red_flags) ? email.red_flags : [],
      }),
      dateTaken: timestamp,
      questions: [
        {
          questionId: `generated-${scope}-${index + 1}-q1`,
          questionText: "Is this email phishing?",
          answer: isPhishing ? "Phishing" : "Not Phishing",
        },
      ],
    };
  });
}

export async function ensureInboxTests(lessonId) {
  const stored = getStoredInboxTests(lessonId);
  if (stored.length >= EMAILS_PER_INBOX) {
    return stored.slice(0, EMAILS_PER_INBOX);
  }

  let lastError = null;
  const subject = lessonId ? `Lesson ${lessonId} phishing email test` : "Phishing email test";

  for (const base of API_BASES) {
    try {
      const response = await fetchWithAuth(`${base}/generate-test-emails/`, {
        method: "POST",
        body: JSON.stringify({ subject }),
      });
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate test emails");
      }

      const emails = Array.isArray(data.emails) ? data.emails : [];
      if (emails.length === 0) {
        throw new Error("No emails were generated.");
      }

      const generatedTests = buildGeneratedTests(emails, lessonId);
      storeInboxTests(lessonId, generatedTests);
      return generatedTests;
    } catch (error) {
      lastError = error;
    }
  }

  if (stored.length > 0) {
    return stored.slice(0, EMAILS_PER_INBOX);
  }

  throw lastError || new Error("Failed to generate inbox tests");
}
