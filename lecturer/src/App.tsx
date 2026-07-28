import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { isLoggedIn, logout, getUser } from "./api";
import Layout from "./Layout";
import { useTheme } from "./Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CourseBuilder from "./pages/CourseBuilder";
import QuizBuilder from "./pages/QuizBuilder";
import AssignmentManager from "./pages/AssignmentManager";
import GradeBook from "./pages/GradeBook";
import AttendanceManager from "./pages/AttendanceManager";
import AnnouncementManager from "./pages/AnnouncementManager";
import ForumModeration from "./pages/ForumModeration";
import TimetableViewer from "./pages/TimetableViewer";
import LMSAnalytics from "./pages/LMSAnalytics";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [theme, setTheme] = useTheme();

  function onLogin() { setLoggedIn(true); }
  function onLogout() { logout(); setLoggedIn(false); }

  if (!loggedIn) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login onLogin={onLogin} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Layout onLogout={onLogout} theme={theme} setTheme={setTheme}>
        <Routes>
          <Route path="/" element={<Navigate to="/lms" replace />} />
          <Route path="/lms" element={<Dashboard />} />
          <Route path="/lms/courses" element={<CourseBuilder />} />
          <Route path="/lms/quizzes" element={<QuizBuilder />} />
          <Route path="/lms/assignments" element={<AssignmentManager />} />
          <Route path="/lms/grades" element={<GradeBook />} />
          <Route path="/lms/attendance" element={<AttendanceManager />} />
          <Route path="/lms/announcements" element={<AnnouncementManager />} />
          <Route path="/lms/forums" element={<ForumModeration />} />
          <Route path="/lms/timetable" element={<TimetableViewer />} />
          <Route path="/lms/analytics" element={<LMSAnalytics />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
