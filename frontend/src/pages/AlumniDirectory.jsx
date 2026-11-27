import { useEffect, useState } from 'react';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import Stars from '../components/Stars.jsx';

export default function AlumniDirectory() {
  const { auth } = useAuth();
  const [alumni, setAlumni] = useState([]);
  const [skills, setSkills] = useState([]);
  const [q, setQ] = useState('');
  const [skillId, setSkillId] = useState('');
  const [target, setTarget] = useState(null);   // alumnus being requested
  const [message, setMessage] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => { api.get('/skills').then((r) => setSkills(r.data)); }, []);
  useEffect(() => {
    api.get('/alumni', { params: { q, skill_id: skillId } })
       .then((r) => setAlumni(r.data));
  }, [q, skillId]);

  async function sendRequest() {
    try {
      await api.post('/requests', {
        student_id: auth.user.id, alumni_id: target.alumni_id, message
      });
      setInfo('Request sent to ' + target.name);
      setTarget(null);
      setMessage('');
    } catch (err) {
      setInfo(err.message);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Find a Mentor</h1>
        <p>Search by name, company or role, or narrow down by skill.</p>
      </div>
      <div className="filters">
        <input placeholder="Search name / company / position"
               value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={skillId} onChange={(e) => setSkillId(e.target.value)}>
          <option value="">All skills</option>
          {skills.map((s) => <option key={s.skill_id} value={s.skill_id}>{s.skill_name}</option>)}
        </select>
      </div>
      {info && <p className="notice info">{info}</p>}

      <div className="grid">
        {alumni.map((a) => (
          <div className="card person" key={a.alumni_id}>
            <div className="person-head">
              <Avatar name={a.name} size="lg" />
              <div>
                <h3>{a.name}</h3>
                <div className="role">{a.position} at {a.current_company}</div>
                <div className="role">Class of {a.graduation_year}</div>
              </div>
            </div>
            <div className="tags">
              {a.skills
                ? a.skills.split(',').map((s) => <span className="tag" key={s}>{s.trim()}</span>)
                : <span className="role">No skills listed</span>}
            </div>
            <div className="rating">
              {a.avg_rating
                ? <><Stars value={a.avg_rating} /><b>{a.avg_rating}</b> / 5 ({a.feedback_count})</>
                : 'No feedback yet'}
            </div>
            <div className="foot">
              <small>Mentor</small>
              <button onClick={() => { setTarget(a); setInfo(''); }}>Request mentorship</button>
            </div>
          </div>
        ))}
        {alumni.length === 0 && <div className="empty" style={{ gridColumn: '1 / -1' }}>No alumni match your search.</div>}
      </div>

      {target && (
        <div className="modal">
          <div className="card">
            <h3>Request mentorship from {target.name}</h3>
            <p className="sub">{target.position} at {target.current_company}</p>
            <textarea rows="4" placeholder="Introduce yourself and say what you need help with"
                      value={message} onChange={(e) => setMessage(e.target.value)} />
            <div className="row">
              <button disabled={!message.trim()} onClick={sendRequest}>Send</button>
              <button className="secondary" onClick={() => setTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
