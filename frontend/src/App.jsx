import { Routes, Route, Navigate } from "react-router-dom";
// Imports must point to the 'pages' folder
import Login from "./pages/Login";
import SignupRole from "./pages/SignupRole";
import SignupIndividual from "./pages/SignupIndividual";
import SignupCompany from "./pages/SignupCompany";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Learning from "./pages/Learning";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignupRole />} />
      <Route path="/signup/individual" element={<SignupIndividual />} />
      <Route path="/signup/company" element={<SignupCompany />} />
      
      {/* Protected Routes */}
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/learning" element={<ProtectedRoute><Learning /></ProtectedRoute>} />
      
      {/* Redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}