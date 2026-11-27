import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import AuthShell from '../components/AuthShell.jsx';
import { homeFor } from '../App.jsx';

// Admin is handled in the frontend (the backend login has no admin role).
const ADMIN = { email: 'admin@univ.edu', password: 'admin123' };

export default function Login() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (role === 'admin') {
      if (email.trim().toLowerCase() === ADMIN.email && password === ADMIN.password) {
        login({ role: 'admin', user: { id: 0, name: 'Administrator', email: ADMIN.email } });
        nav('/admin');
      } else {
        setError('Wrong admin email or password');
      }
      return;
    }
    try {
      const { data } = await api.post('/auth/login', { role, email });
      login(data);
      nav(homeFor(role));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthShell>
      <h2>Welcome back</h2>
      <p className="sub">Sign in to continue.</p>
      <form onSubmit={submit}>
        <label>I am a</label>
        <select value={role} onChange={(e) => { setRole(e.target.value); setError(''); }}>
          <option value="student">Student</option>
          <option value="alumni">Alumni (Mentor)</option>
          <option value="admin">Admin</option>
        </select>
        <label>Email</label>
        <input type="email" required value={email}
               onChange={(e) => setEmail(e.target.value)} />
        {role === 'admin' && (
          <>
            <label>Password</label>
            <input type="password" required value={password}
                   onChange={(e) => setPassword(e.target.value)} />
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
      </form>
      {role !== 'admin' && <p className="alt">New here? <Link to="/register">Create an account</Link></p>}
    </AuthShell>
  );
}
