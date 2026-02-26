// Utility functions for password strength checks

export function computeChecks(password, { username = '', email = '' } = {}) {
  const minLength = password.length >= 8;
  const upper = /[A-Z]/.test(password);
  const lower = /[a-z]/.test(password);
  const number = /[0-9]/.test(password);
  const special = /[^A-Za-z0-9]/.test(password);
  // Unique: not equal to username or email, and not a common password
  const unique =
    password &&
    password !== username &&
    password !== email &&
    !["password", "12345678", "qwerty", "letmein", "admin", "welcome"].includes(password.toLowerCase());

  return {
    checks: {
      minLength,
      upper,
      lower,
      number,
      special,
      unique,
    },
  };
}
