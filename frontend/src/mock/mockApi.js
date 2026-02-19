// Mock “backend” — later you’ll swap this with real Django API calls.

const HARDCODED_USER = {
  username: "student",
  password: "phishfree123",
  name: "Phish Free User",
  role: "individual", // later: admin/company_user/etc
};

export async function mockLogin(username, password) {
  // mimic network delay
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

  const err = new Error("Invalid username or password.");
  err.status = 401;
  throw err;
}
