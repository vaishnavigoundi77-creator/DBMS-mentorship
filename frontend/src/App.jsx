import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AlumniDirectory from './pages/AlumniDirectory.jsx';
import MyRequests from './pages/MyRequests.jsx';
import IncomingRequests from './pages/IncomingRequests.jsx';
import MentorshipList from './pages/MentorshipList.jsx';
import MentorshipDetail from './pages/MentorshipDetail.jsx';
import AlumniProfile from './pages/AlumniProfile.jsx';
import Stats from './pages/Stats.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

function Protected({ role, children }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (role && auth.role !== role) return <Navigate to="/" replace />;
  return children;
}

export const homeFor = (role) =>
  role === 'admin' ? '/admin' : role === 'student' ? '/student/alumni' : '/alumni/requests';

function Home() {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  return <Navigate to={homeFor(auth.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Protected role="admin"><AdminDashboard /></Protected>} />
        <Route path="/student/alumni" element={<Protected role="student"><AlumniDirectory /></Protected>} />
        <Route path="/student/requests" element={<Protected role="student"><MyRequests /></Protected>} />
        <Route path="/alumni/requests" element={<Protected role="alumni"><IncomingRequests /></Protected>} />
        <Route path="/alumni/profile" element={<Protected role="alumni"><AlumniProfile /></Protected>} />
        <Route path="/mentorships" element={<Protected><MentorshipList /></Protected>} />
        <Route path="/mentorships/:id" element={<Protected><MentorshipDetail /></Protected>} />
        <Route path="/stats" element={<Protected><Stats /></Protected>} />
      </Route>
    </Routes>
  );
}
