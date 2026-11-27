import { useEffect, useState } from 'react';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function MyRequests() {
  const { auth } = useAuth();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/requests', { params: { student_id: auth.user.id } })
       .then((r) => setRows(r.data));
  }, [auth.user.id]);

  return (
    <>
      <div className="page-head">
        <h1>My Mentorship Requests</h1>
        <p>Everything you have sent, and where it stands.</p>
      </div>
      {rows.length > 0 && <div className="table-wrap"><table>
        <thead><tr><th>Date</th><th>Alumni</th><th>Company</th><th>Message</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.request_id}>
              <td className="date">{r.request_date.slice(0, 10)}</td>
              <td>{r.alumni_name}</td>
              <td>{r.current_company}</td>
              <td>{r.message}</td>
              <td><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table></div>}
      {rows.length === 0 && <div className="empty">You have not sent any requests yet.</div>}
    </>
  );
}
