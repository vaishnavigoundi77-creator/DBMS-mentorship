import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import Avatar from './Avatar.jsx';

export default function Layout() {
  const { auth, logout } = useAuth();
  const nav = useNavigate();
  const isStudent = auth?.role === 'student';
  const isAdmin = auth?.role === 'admin';

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand"><span className="brand-mark">A</span>Alumni Mentorship</Link>
          {auth && (
            <>
              <nav className="nav">
                {isAdmin ? (
                  <NavLink to="/admin">Dashboard</NavLink>
                ) : isStudent ? (
                  <>
                    <NavLink to="/student/alumni">Find Alumni</NavLink>
                    <NavLink to="/student/requests">My Requests</NavLink>
                  </>
                ) : (
                  <>
                    <NavLink to="/alumni/requests">Requests</NavLink>
                    <NavLink to="/alumni/profile">My Profile</NavLink>
                  </>
                )}
                {!isAdmin && <NavLink to="/mentorships">Mentorships</NavLink>}
                <NavLink to="/stats">Stats</NavLink>
              </nav>
              <span className="spacer" />
              <div className="user-pill">
                <div className="who">{auth.user.name}<small>{auth.role}</small></div>
                <Avatar name={auth.user.name} size="sm" />
                <button className="ghost" onClick={() => { logout(); nav('/login'); }}>Logout</button>
              </div>
            </>
          )}
        </div>
      </header>
      <main className="container"><Outlet /></main>
    </>
  );
}
