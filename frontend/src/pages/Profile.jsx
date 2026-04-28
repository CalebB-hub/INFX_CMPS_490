import { useEffect, useMemo, useState } from "react";
import TopNav from "../components/TopNav";
import { getAccessToken, getUser, refreshAccessToken } from "../services/authService";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8000/api";
const USER_KEY = "pf_user";

async function fetchProfile(token) {
  const response = await fetch(`${API_BASE}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load profile.");
  }

  return data;
}

async function patchProfile(token, payload) {
  const response = await fetch(`${API_BASE}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to update profile.");
  }

  return data;
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  useEffect(() => {
    let mounted = true;

    async function loadProfileData() {
      let token = getAccessToken();

      if (!token) {
        if (mounted) {
          setError("You are not logged in.");
          setLoading(false);
        }
        return;
      }

      try {
        let profileData;

        try {
          profileData = await fetchProfile(token);
        } catch (err) {
          if (
            err.message === "Authentication credentials were not provided." ||
            err.message.includes("Given token not valid") ||
            err.message.includes("Token is invalid or expired")
          ) {
            token = await refreshAccessToken();
            profileData = await fetchProfile(token);
          } else {
            throw err;
          }
        }

        if (!mounted) return;

        setUser(profileData);
        setForm({
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || "",
          email: profileData.email || "",
        });
        localStorage.setItem(USER_KEY, JSON.stringify(profileData));
        setError("");
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Failed to load profile.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfileData();
    return () => {
      mounted = false;
    };
  }, []);

  const displayName = useMemo(
    () => [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Name unavailable",
    [user]
  );
  const memberSinceText = useMemo(() => {
    if (!user?.memberSince) return "Not available";
    const parsed = new Date(user.memberSince);
    if (Number.isNaN(parsed.getTime())) {
      return "Not available";
    }
    return parsed.toLocaleDateString();
  }, [user?.memberSince]);
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.trim() || "ME";

  function resetFormFromUser(profileUser) {
    setForm({
      firstName: profileUser?.firstName || "",
      lastName: profileUser?.lastName || "",
      email: profileUser?.email || "",
    });
  }

  async function handleSave() {
    let token = getAccessToken();
    if (!token) {
      setError("You are not logged in.");
      return;
    }

    setSaving(true);
    setError("");
    setSaveMessage("");

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
    };

    try {
      let updatedProfile;

      try {
        updatedProfile = await patchProfile(token, payload);
      } catch (err) {
        if (
          err.message === "Authentication credentials were not provided." ||
          err.message.includes("Given token not valid") ||
          err.message.includes("Token is invalid or expired")
        ) {
          token = await refreshAccessToken();
          updatedProfile = await patchProfile(token, payload);
        } else {
          throw err;
        }
      }

      setUser(updatedProfile);
      resetFormFromUser(updatedProfile);
      localStorage.setItem(USER_KEY, JSON.stringify(updatedProfile));
      setEditingSection(null);
      setSaveMessage("Profile updated.");
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    resetFormFromUser(user);
    setEditingSection(null);
    setError("");
    setSaveMessage("");
  }

  return (
    <div>
      <TopNav />
      <main className="page">
        <style>
          {`
            @keyframes profile-loader-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
        <h2>Profile</h2>

        {loading && (
          <div className="card" style={{ minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "3px solid rgba(0,0,0,0.12)",
                  borderTopColor: "var(--accent)",
                  animation: "profile-loader-spin 0.9s linear infinite",
                }}
              />
              <div className="muted" style={{ fontWeight: 600 }}>
                Loading Profile...
              </div>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {error && <div className="alert alert--error">{error}</div>}
            {saveMessage && (
              <div className="card" style={{ marginTop: 16 }}>
                <div className="muted" style={{ fontWeight: 600 }}>
                  {saveMessage}
                </div>
              </div>
            )}

            <section style={{ marginTop: 16 }}>
              <div
                className="card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 18,
                  padding: 24,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0 }}>
                  <div
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      background: "#f0d870",
                      color: "#2b2414",
                      fontSize: "2rem",
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: "2rem", lineHeight: 1.1 }}>
                      {displayName}
                    </h3>
                  </div>
                </div>

                <div
                  style={{
                    padding: "10px 18px",
                    borderRadius: 999,
                    border: "1px solid rgba(0,0,0,0.18)",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  Member
                </div>
              </div>
            </section>

            <section style={{ marginTop: 16 }}>
              <div className="card">
                <h3 style={{ marginTop: 0, marginBottom: 18 }}>Contact Details</h3>

                <div style={{ display: "grid", gap: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 16,
                      padding: "14px 0",
                      borderTop: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="muted" style={{ fontSize: ".9rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
                        Full Name
                      </div>
                      {editingSection === "name" ? (
                        <div style={{ display: "grid", gap: 10, marginTop: 12, maxWidth: 360 }}>
                          <input
                            type="text"
                            value={form.firstName}
                            onChange={(event) =>
                              setForm((current) => ({ ...current, firstName: event.target.value }))
                            }
                            placeholder="First name"
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: 10,
                              border: "1px solid rgba(0,0,0,0.12)",
                              font: "inherit",
                            }}
                          />
                          <input
                            type="text"
                            value={form.lastName}
                            onChange={(event) =>
                              setForm((current) => ({ ...current, lastName: event.target.value }))
                            }
                            placeholder="Last name"
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: 10,
                              border: "1px solid rgba(0,0,0,0.12)",
                              font: "inherit",
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{ fontWeight: 700, marginTop: 12 }}>
                          {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Name unavailable"}
                        </div>
                      )}
                    </div>

                    {editingSection === null && (
                      <button
                        className="btn"
                        type="button"
                        onClick={() => {
                          resetFormFromUser(user);
                          setEditingSection("name");
                          setSaveMessage("");
                        }}
                      >
                        Edit name
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 16,
                      padding: "14px 0",
                      borderTop: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="muted" style={{ fontSize: ".9rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
                        Email
                      </div>
                      {editingSection === "email" ? (
                        <input
                          type="email"
                          value={form.email}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, email: event.target.value }))
                          }
                          style={{
                            width: "min(360px, 100%)",
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "1px solid rgba(0,0,0,0.12)",
                            font: "inherit",
                            marginTop: 12,
                          }}
                        />
                      ) : (
                        <div style={{ fontWeight: 700, wordBreak: "break-word", marginTop: 12 }}>
                          {user?.email || "-"}
                        </div>
                      )}
                    </div>

                    {editingSection === null && (
                      <button
                        className="btn"
                        type="button"
                        onClick={() => {
                          resetFormFromUser(user);
                          setEditingSection("email");
                          setSaveMessage("");
                        }}
                      >
                        Edit email
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 16,
                      padding: "14px 0",
                      borderTop: "1px solid rgba(0,0,0,0.08)",
                      borderBottom: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div className="muted" style={{ fontSize: ".9rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
                        Member Since
                      </div>
                      <div style={{ fontWeight: 700, marginTop: 12 }}>{memberSinceText}</div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent: "flex-end",
                    flexWrap: "wrap",
                    marginTop: 16,
                  }}
                >
                  {editingSection ? (
                    <>
                      <button
                        className="btn"
                        type="button"
                        onClick={handleCancel}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn"
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn"
                        type="button"
                        onClick={() => navigate("/reset-password")}
                      >
                        Change Password
                      </button>
                    </>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
