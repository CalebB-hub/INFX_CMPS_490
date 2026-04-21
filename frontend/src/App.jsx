import { Routes, Route, Navigate } from "react-router-dom";
// Imports must point to the 'pages' folder
import Login from "./pages/Login";
import SignupIndividual from "./pages/SignupIndividual";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Learning from "./pages/Learning";
import Quizzes from "./pages/Quizzes";
import QuizDetails from "./pages/QuizDetails";
import Grades from "./pages/Grades";
import About from "./pages/About";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import LessonDetails from "./pages/LessonDetails";
import Lessons from "./pages/Lessons";
import ProfileRouter from "./pages/ProfileRouter";
import Test from "./pages/Test";
import Inbox from "./pages/Inbox";


export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignupIndividual />} />
      <Route path="/signup/individual" element={<SignupIndividual />} />
      <Route path="/signup/company" element={<Navigate to="/signup/individual" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/inbox" element={<Inbox />} />
      
      {/* Protected Routes */}
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfileRouter /></ProtectedRoute>} />
      <Route path="/profile/me" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/learning" element={<ProtectedRoute><Learning /></ProtectedRoute>} />
      <Route path="/learning/lessons" element={<ProtectedRoute><Lessons /></ProtectedRoute>} />
      <Route path="/learning/quizzes" element={<ProtectedRoute><Quizzes /></ProtectedRoute>} />
      <Route path="/learning/quizzes/:quizId" element={<ProtectedRoute><QuizDetails /></ProtectedRoute>} />
      <Route path="/test" element={<ProtectedRoute><Test /></ProtectedRoute>} />
      <Route path="/grades" element={<ProtectedRoute><Grades /></ProtectedRoute>} />
      <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/learning/lessons/:lessonId" element={<ProtectedRoute><LessonDetails /></ProtectedRoute>} />

      
      {/* Redirects if Route is Not Known*/}
      <Route path="/" element={<Navigate to="/signup" replace />} />
      <Route path="*" element={<Navigate to="/signup" replace />} />
    </Routes>
  );
}
