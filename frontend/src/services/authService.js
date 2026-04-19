import { API_BASE } from "./apiConfig";

const TOKEN_KEY = "pf_auth_token";
const REFRESH_TOKEN_KEY = "pf_refresh_token";
const USER_KEY = "pf_user";

export function getUser() {
  const userJson = localStorage.getItem(USER_KEY);
  try {
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function saveAccessToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return !!localStorage.getItem(TOKEN_KEY);
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("Your session has expired. Please log in again.");
  }

  const response = await fetch(`${API_BASE}/auth/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      refresh: refreshToken,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.access) {
    throw new Error("Your session has expired. Please log in again.");
  }

  saveAccessToken(data.access);
  return data.access;
}
