import { useEffect, useState } from 'react';
import api from '../api.js';

function Bars({ items, labelKey, valueKey, tone }) {
  const max = Math.max(1, ...items.map((i) => Number(i[valueKey])));
  return items.map((i) => (
    <div className="bar-row" key={i[labelKey]}>
      <span>{i[labelKey]}</span>
      <div className="bar"><i className={tone ? String(i[labelKey]).toLowerCase() : ''}
           style={{ width: `${(Number(i[valueKey]) / max) * 100}%` }} /></div>
      <span className="v">{i[valueKey]}</span>
    </div>
  ));
}

export default function Stats() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/stats').then((r) => setS(r.data)); }, []);
  if (!s) return <p className="empty">Loading...</p>;

  return (
    <>
      <div className="page-head">
        <h1>Network Overview</h1>
        <p>A snapshot of the mentorship network right now.</p>
      </div>
      <div className="stat-grid">
        {['students', 'alumni', 'mentorships', 'sessions'].map((k) => (
          <div className="card stat-card" key={k}>
            <div className="num">{s[k]}</div>
            <div className="lbl">{k}</div>
          </div>
        ))}
      </div>
      <div className="two-col" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Requests by status</h3>
          <Bars items={s.requests_by_status} labelKey="status" valueKey="count" tone />
        </div>
        <div className="card">
          <h3>Most common alumni skills</h3>
          <Bars items={s.top_skills} labelKey="skill_name" valueKey="alumni_count" />
        </div>
      </div>
    </>
  );
}
