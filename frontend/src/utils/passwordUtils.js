// Utility functions for password strength checks

export function computeChecks(password, { username = '', email = '' } = {}) {
  const minLength = password.length >= 8;
  const upper = /[A-Z]/.test(password);
  const lower = /[a-z]/.test(password);
  const number = /[0-9]/.test(password);
  const special = /[^A-Za-z0-9]/.test(password);

  const lowerPwd = password.toLowerCase();
  const emailPrefix = email ? email.split('@')[0].toLowerCase() : '';
  const nameParts = [
    ...username.toLowerCase().split(/[\s._-]+/),
    ...emailPrefix.split(/[._-]+/),
  ].filter(p => p.length >= 3);
  const containsPersonalInfo = password.length > 0 && nameParts.some(part => lowerPwd.includes(part));

  return {
    checks: {
      minLength,
      upper,
      lower,
      number,
      special,
    },
    containsPersonalInfo,
  };
}
