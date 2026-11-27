import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api.js';
import AuthShell from '../components/AuthShell.jsx';

export default function Register() {
  const [role, setRole] = useState('student');
  const [depts, setDepts] = useState([]);
  const [f, setF] = useState({});
  const [error, setError] = useState('');
  const nav = useNavigate();

  useEffect(() => { api.get('/departments').then((r) => setDepts(r.data)); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post(role === 'student' ? '/students' : '/alumni', f);
      alert('Registered! Please login.');
      nav('/login');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthShell>
      <h2>Create your account</h2>
      <p className="sub">Takes under a minute.</p>
      <form onSubmit={submit}>
        <label>I am a</label>
        <select value={role} onChange={(e) => { setRole(e.target.value); setF({}); }}>
          <option value="student">Student</option>
          <option value="alumni">Alumni</option>
        </select>
        <input placeholder="Full name" required onChange={set('name')} />
        <input type="email" placeholder="Email" required onChange={set('email')} />
        <input placeholder="Phone" onChange={set('phone')} />
        {role === 'student' ? (
          <>
            <input type="number" min="1" max="6" placeholder="Sem (1-7)" required onChange={set('year')} />
            <select required defaultValue="" onChange={set('dept_id')}>
              <option value="" disabled>Select department</option>
              {depts.map((d) => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
            </select>
          </>
        ) : (
          <>
            <input type="number" placeholder="Graduation year" required onChange={set('graduation_year')} />
            <input placeholder="Current company" onChange={set('current_company')} />
            <input placeholder="Position" onChange={set('position')} />
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button type="submit">Register</button>
      </form>
      <p className="alt">Already registered? <Link to="/login">Login</Link></p>
    </AuthShell>
  );
}
