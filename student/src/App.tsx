import { Navigate, Route, Routes, BrowserRouter } from "react-router-dom";
import { useEffect, useState } from "react";
import { getToken } from "./api";
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";
import CourseViewer from "./pages/CourseViewer";
import Assessments from "./pages/Assessments";
import GradesView from "./pages/GradesView";
import Forums from "./pages/Forums";
import Messages from "./pages/Messages";
import StudentTimetable from "./pages/StudentTimetable";
import StudentAttendance from "./pages/StudentAttendance";
import Settings from "./pages/Settings";
import StudentLayout from "./pages/StudentLayout";

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<StudentLogin onLogin={() => setAuthed(true)} />} />
        <Route path="/" element={authed ? <StudentLayout onLogout={() => setAuthed(false)} /> : <Navigate to="/login" replace />}>
          <Route index element={<StudentDashboard />} />
          <Route path="course/:id" element={<CourseViewer />} />
          <Route path="assessments" element={<Assessments />} />
          <Route path="grades" element={<GradesView />} />
          <Route path="forums" element={<Forums />} />
          <Route path="messages" element={<Messages />} />
          <Route path="timetable" element={<StudentTimetable />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
