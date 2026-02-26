// Mock “backend” — try calling real Django API endpoints first, fallback to mock behavior.

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const HARDCODED_USER = {
  username: "student",
  password: "phishfree123",
  name: "Phish Free User",
  role: "individual", // later: admin/company_user/etc
};

const MOCK_RESET_TOKENS = new Map();

export async function mockLogin(username, password) {
  // try backend first
  try {
    const res = await fetch(`${API_BASE}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) return res.json();
    // server returned error -> throw to be caught below and fall back
    throw new Error('Server rejected credentials');
  } catch (err) {
    // fallback to local mock
    await new Promise((r) => setTimeout(r, 400));

    if (username === HARDCODED_USER.username && password === HARDCODED_USER.password) {
      return {
        token: "mock-token-123",
        user: {
          username: HARDCODED_USER.username,
          name: HARDCODED_USER.name,
          role: HARDCODED_USER.role,
        },
      };
    }

    const e = new Error("Invalid username or password.");
    e.status = 401;
    throw e;
  }
}

/** * NEW: mockSignup function 
 * This lets your Signup page "submit" without crashing the app.
 */
export async function mockSignup(userData) {
  // try backend first
  try {
    const res = await fetch(`${API_BASE}/api/auth/signup/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (res.ok) return res.json();
    throw new Error('Server rejected signup');
  } catch (err) {
    await new Promise((r) => setTimeout(r, 600));
    console.log("Mock Signup Received:", userData);
    return { success: true, message: "Account created successfully! Please log in with the student credentials." };
  }
}

export async function mockForgotPassword(emailOrUsername) {
  // try backend first
  try {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailOrUsername, username: emailOrUsername }),
    });
    if (res.ok) return res.json();
    throw new Error('Server error');
  } catch (err) {
    await new Promise((r) => setTimeout(r, 400));
    const token = `mock-reset-${Math.random().toString(36).slice(2, 9)}`;
    MOCK_RESET_TOKENS.set(token, HARDCODED_USER.username);
    console.log("Mock forgot password for:", emailOrUsername, "token:", token);
    return { success: true, message: `Reset link sent (token: ${token})`, token };
  }
}

export async function mockResetPassword(token, newPassword) {
  // try backend first
  try {
    const res = await fetch(`${API_BASE}/api/auth/reset-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: newPassword }),
    });
    if (res.ok) return res.json();
    throw new Error('Server error');
  } catch (err) {
    await new Promise((r) => setTimeout(r, 400));
    if (!token || !MOCK_RESET_TOKENS.has(token)) {
      const e = new Error("Invalid or expired reset token.");
      e.status = 400;
      throw e;
    }
    const username = MOCK_RESET_TOKENS.get(token);
    if (username === HARDCODED_USER.username) {
      HARDCODED_USER.password = newPassword;
      MOCK_RESET_TOKENS.delete(token);
      return { success: true, message: "Password updated." };
    }
    const e = new Error("User not found for token.");
    e.status = 404;
    throw e;
  }
}