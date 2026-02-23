import Login from "../pages/Login";
import Signup from "../pages/SignupRole"; 
import Home from "../pages/Home";
import Profile from "../pages/Profile"; // Ensure this points to /pages/
import Learning from "../pages/Learning"; // Ensure this points to /pages/

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Routes: If these don't appear, check ProtectedRoute logic */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/learning"
        element={
          <ProtectedRoute>
            <Learning />
          </ProtectedRoute>
        }

      />

            <Route
        path="/signup"
        element={
          <ProtectedRoute>
            <Signup />
          </ProtectedRoute>
        }
        
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}