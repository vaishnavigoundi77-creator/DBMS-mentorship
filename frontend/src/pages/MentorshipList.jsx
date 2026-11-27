import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';

export default function MentorshipList() {
  const { auth } = useAuth();
  const [rows, setRows] = useState([]);
  const key = auth.role === 'student' ? 'student_id' : 'alumni_id';

  useEffect(() => {
    api.get('/mentorships', { params: { [key]: auth.user.id } })
       .then((r) => setRows(r.data));
  }, [auth.user.id, key]);

  return (
    <>
      <div className="page-head">
        <h1>My Mentorships</h1>
        <p>Accepted requests turn into mentorships you can log sessions against.</p>
      </div>
      <div className="grid">
        {rows.map((m) => (
          <div className="card person" key={m.mentorship_id}>
            <div className="person-head">
              <Avatar name={auth.role === 'student' ? m.alumni_name : m.student_name} size="lg" />
              <div>
                <h3>{auth.role === 'student' ? m.alumni_name : m.student_name}</h3>
                <div className="role">{m.end_date ? `Ended ${String(m.end_date).slice(0, 10)}` : 'Ongoing'}</div>
              </div>
            </div>
            <div className="meta">
              <span>Started <b>{String(m.start_date).slice(0, 10)}</b></span>
              <span><b>{m.mode}</b></span>
              <span><b>{m.session_count}</b> session(s)</span>
            </div>
            <div className="foot">
              <small>Mentorship #{m.mentorship_id}</small>
              <Link className="btn-link" to={`/mentorships/${m.mentorship_id}`}>Open</Link>
            </div>
          </div>
        ))}
      </div>
      {rows.length === 0 && <div className="empty">No active mentorships yet.</div>}
    </>
  );
}
