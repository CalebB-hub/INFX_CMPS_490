// Ensure these keys match exactly what is in Login.jsx
const TOKEN_KEY = "pf_auth_token";
const USER_KEY = "pf_user";

export function getUser() {
  const userJson = localStorage.getItem(USER_KEY);
  try {
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return !!localStorage.getItem(TOKEN_KEY);
}