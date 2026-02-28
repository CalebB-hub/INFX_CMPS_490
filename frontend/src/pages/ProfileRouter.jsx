import { Navigate, useLocation } from "react-router-dom";
import { getUser } from "../services/authService";

export default function ProfileRouter() {
  const location = useLocation();
  const user = getUser();

  // If user object is missing for some reason, send them to login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // ✅ Decide what counts as "admin"
  // Adjust this based on what you store in localStorage:
  // Examples: "admin", "organization", "org_admin", etc.
  const role = (user.role || "").toLowerCase();

  const isAdmin =
    role === "admin" ||
    role === "organization" || // <-- you already use this in TopNav styling
    role === "org_admin";

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/profile/me" replace />;
}