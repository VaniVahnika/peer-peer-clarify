import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Contexts
import { UserProvider } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import { AlertProvider } from './context/AlertContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import Navbar from './components/layout/Navbar';
import Login from './pages/common/Login';
import Register from './pages/common/Register';
import LandingPage from './pages/common/LandingPage';
import Settings from './pages/common/Settings';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentFeed from './pages/student/Feed';
import CreateDoubt from './pages/student/CreateDoubt';
import LiveSession from './pages/student/LiveSession';
import SessionFeedback from './pages/student/SessionFeedback';
import Roadmap from './pages/student/Roadmap';

// Instructor Pages
import InstructorDashboard from './pages/instructor/Dashboard';
import SessionRequests from './pages/instructor/SessionRequests';
import InstructorLiveSession from './pages/instructor/LiveSession';
import InstructorFeedback from './pages/instructor/SessionFeedback';
import InstructorCreatePost from './pages/instructor/CreatePost';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import Verification from './pages/admin/Verification';
import Moderation from './pages/admin/Moderation';
import ManageInstructors from './pages/admin/ManageInstructors';
const AppLayout = ({ role }) => {
  return (
    <>
      <Navbar role={role} />
      <main className="container" style={{ padding: '2rem 1rem' }}>
        <Outlet />
      </main>
    </>
  );
};

// ... PlaceHolder component ...

// ... other imports
// ... other imports
import WelcomeManager from './components/common/WelcomeManager';
import { useState, useEffect } from 'react';

function App() {
  return (
    <UserProvider>
      <ThemeProvider>
        <AlertProvider>
          <NotificationProvider>
            <Router>
              <WelcomeManager />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<LandingPage />} />

                <Route path="/settings" element={
                  <>
                    <Navbar />
                    <main className="container" style={{ padding: '2rem 1rem' }}>
                      <Settings />
                    </main>
                  </>
                } />

                {/* Student Routes */}
                <Route path="/student" element={<AppLayout role="student" />}>
                  <Route index element={<StudentDashboard />} />
                  <Route path="feed" element={<StudentFeed />} />
                  <Route path="create-doubt" element={<CreateDoubt />} />
                  <Route path="session/:sessionId" element={<LiveSession />} />
                  <Route path="feedback" element={<SessionFeedback />} />
                  <Route path="roadmap" element={<Roadmap />} />
                </Route>

                {/* Instructor Routes */}
                <Route path="/instructor" element={<AppLayout role="instructor" />}>
                  <Route index element={<InstructorDashboard />} />
                  <Route path="feed" element={<StudentFeed role="instructor" />} />
                  <Route path="requests" element={<SessionRequests />} />
                  <Route path="sessions" element={<InstructorLiveSession />} />
                  <Route path="session/:sessionId" element={<InstructorLiveSession />} />
                  <Route path="feedback" element={<InstructorFeedback />} />
                  <Route path="create-post" element={<InstructorCreatePost />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin" element={<AppLayout role="admin" />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="verification" element={<Verification />} />
                  <Route path="instructors" element={<ManageInstructors />} />
                  <Route path="moderation" element={<Moderation />} />
                </Route>
              </Routes>
            </Router>
          </NotificationProvider>
        </AlertProvider>
      </ThemeProvider>
    </UserProvider>
  );
}

export default App;
