import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { getToken } from "./api";
import Login from "./pages/Login";
import Layout from "./pages/Layout";
import SettingsLayout from "./pages/SettingsLayout";
import Students from "./pages/Students";
import StudentAdd from "./pages/StudentAdd";
import StudentEdit from "./pages/StudentEdit";
import Enroll from "./pages/Enroll";
import Exams from "./pages/Exams";
import Verify from "./pages/Verify";
import Catalog from "./pages/Catalog";
import AcademicSessions from "./pages/AcademicSessions";
import CourseRegistrations from "./pages/CourseRegistrations";
import Devices from "./pages/Devices";
import Reports from "./pages/Reports";
import CBTExams from "./pages/cbt/CBTExams";
import CBTDashboard from "./pages/cbt/CBTDashboard";
import CBTMarking from "./pages/cbt/CBTMarking";
import CBTQuestions from "./pages/cbt/CBTQuestions";
import Notifications from "./pages/Notifications";
import Home from "./pages/Home";
import LecturerDashboard from "./pages/lms/LecturerDashboard";
import CourseBuilder from "./pages/lms/CourseBuilder";
import QuizBuilder from "./pages/lms/QuizBuilder";
import AssignmentManager from "./pages/lms/AssignmentManager";
import GradeBook from "./pages/lms/GradeBook";
import AttendanceManager from "./pages/lms/AttendanceManager";
import AnnouncementManager from "./pages/lms/AnnouncementManager";
import ForumModeration from "./pages/lms/ForumModeration";
import TimetableViewer from "./pages/lms/TimetableViewer";
import LMSAnalytics from "./pages/lms/LMSAnalytics";

export default function App() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => { setAuthed(!!getToken()); setReady(true); }, []);
  if (!ready) return null;

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={() => setAuthed(true)} />} />
      <Route
        path="/"
        element={authed ? <Layout onLogout={() => setAuthed(false)} /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Home />} />
        <Route path="students" element={<Students />} />
        <Route path="registration" element={<StudentAdd />} />
        <Route path="students/:id/edit" element={<StudentEdit />} />
        <Route path="enroll/:studentId" element={<Enroll />} />
        <Route path="exams" element={<Exams />} />
        <Route path="cbt" element={<CBTDashboard />} />
        <Route path="cbt/manage" element={<CBTExams />} />
        <Route path="cbt/marking" element={<CBTMarking />} />
        <Route path="cbt/questions" element={<CBTQuestions />} />
        <Route path="verify" element={<Verify />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="lms" element={<LecturerDashboard />} />
        <Route path="lms/courses" element={<CourseBuilder />} />
        <Route path="lms/quizzes" element={<QuizBuilder />} />
        <Route path="lms/assignments" element={<AssignmentManager />} />
        <Route path="lms/grades" element={<GradeBook />} />
        <Route path="lms/attendance" element={<AttendanceManager />} />
        <Route path="lms/announcements" element={<AnnouncementManager />} />
        <Route path="lms/forums" element={<ForumModeration />} />
        <Route path="lms/timetable" element={<TimetableViewer />} />
        <Route path="lms/analytics" element={<LMSAnalytics />} />
        <Route path="settings" element={<SettingsLayout />}>
          <Route index element={<Navigate to="catalog" replace />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="sessions" element={<AcademicSessions />} />
          <Route path="registrations" element={<CourseRegistrations />} />
          <Route path="devices" element={<Devices />} />
        </Route>
      </Route>
    </Routes>
  );
}
