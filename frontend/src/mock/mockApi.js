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

const HARDCODED_USER = {
  username: "student",
  email: "student@example.com",
  password: "phishfree123",
  name: "Phish Free User",
  role: "individual", // later: admin/company_user/etc
};

export async function mockLogin(emailOrUsername, password) {
  // mimic network delay
  await new Promise((r) => setTimeout(r, 400));

  const isMatchingUser =
    emailOrUsername === HARDCODED_USER.email ||
    emailOrUsername === HARDCODED_USER.username;

  if (isMatchingUser && password === HARDCODED_USER.password) {
    return {
      token: "mock-token-123",
      user: {
        username: HARDCODED_USER.username,
        email: HARDCODED_USER.email,
        name: HARDCODED_USER.name,
        role: HARDCODED_USER.role,
      },
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