import { useEffect, useState } from 'react';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Avatar from '../components/Avatar.jsx';

export default function IncomingRequests() {
  const { auth } = useAuth();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('Pending');
  const [error, setError] = useState('');

  const load = () =>
    api.get('/requests', { params: { alumni_id: auth.user.id, status } })
       .then((r) => setRows(r.data));
  useEffect(() => { load(); }, [status]); // eslint-disable-line

  async function respond(id, newStatus) {
    setError('');
    try {
      await api.patch(`/requests/${id}/status`, { status: newStatus });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Requests Received</h1>
        <p>Students who have asked you for mentorship.</p>
      </div>
      <div className="tabs">
        {['Pending', 'Accepted', 'Rejected'].map((s) => (
          <button key={s} className={status === s ? 'on' : ''} onClick={() => setStatus(s)}>{s}</button>
        ))}
      </div>
      {error && <p className="notice error">{error}</p>}
      <div className="grid">
        {rows.map((r) => (
          <div className="card req" key={r.request_id}>
            <div className="person-head">
              <Avatar name={r.student_name} />
              <div style={{ flex: 1 }}>
                <h3>{r.student_name}</h3>
                <div className="role" style={{ color: 'var(--muted)', fontSize: 14 }}>{r.dept_name}, Year {r.student_year}</div>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <div className="quote">{r.message}</div>
            <small>{String(r.request_date).replace('T', ' ').slice(0, 16)}</small>
            {r.status === 'Pending' && (
              <div className="row">
                <button onClick={() => respond(r.request_id, 'Accepted')}>Accept</button>
                <button className="danger" onClick={() => respond(r.request_id, 'Rejected')}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {rows.length === 0 && <div className="empty">No {status.toLowerCase()} requests.</div>}
    </>
  );
}
