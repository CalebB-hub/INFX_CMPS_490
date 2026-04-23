import { getAccessToken, refreshAccessToken } from "./authService";

const API_BASES = ["http://localhost:8000/api", "/api"];

async function fetchWithAuth(url) {
  const token = getAccessToken();
  if (!token) {
    throw new Error("You are not logged in.");
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status !== 401) {
    return response;
  }

  const refreshedToken = await refreshAccessToken();
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${refreshedToken}`,
    },
  });
}

export async function fetchQuizzes() {
  let lastError = null;

  for (const base of API_BASES) {
    try {
      const response = await fetchWithAuth(`${base}/quizzes/`);
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : [];

      if (!response.ok) {
        throw new Error(data.error || "Failed to load quizzes");
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Failed to load quizzes");
}

export async function fetchQuizById(quizId) {
  const quizzes = await fetchQuizzes();
  const quiz = quizzes.find((item) => String(item.id) === String(quizId));

  if (!quiz) {
    throw new Error("Quiz not found");
  }

  return quiz;
}
