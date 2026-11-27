import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import Stars from '../components/Stars.jsx';
import { useToast } from '../components/Toast.jsx';

const fmt = (d) => String(d).replace('T', ' ').slice(0, 16);
const toInput = (d) => String(d).replace(' ', 'T').slice(0, 16);      // value for <input datetime-local>
const toApi = (v) => v.replace('T', ' ') + ':00';                      // same format addSession already sends
const isUpcoming = (d) => new Date(toInput(d)) > new Date();

export default function MentorshipDetail() {
  const { id } = useParams();
  const { auth } = useAuth();
  const toast = useToast();
  const isAlumni = auth.role === 'alumni';

  const [m, setM] = useState(null);
  const [error, setError] = useState('');
  const [sess, setSess] = useState({ session_date: '', topic: '', notes: '' });
  const [fb, setFb] = useState({});                 // { [session_id]: { rating, comments } }
  const [resched, setResched] = useState(null);     // session being rescheduled
  const [newDate, setNewDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(null);         // session_id highlighted after a change
  const prev = useRef(null);                        // last seen { session_id: date }

  const load = () =>
    api.get(`/mentorships/${id}`).then((r) => {
      const data = r.data;
      const now = Object.fromEntries(data.sessions.map((s) => [s.session_id, fmt(s.session_date)]));
      // Mentee side: tell them when the mentor changes or adds a session
      if (prev.current && !isAlumni) {
        for (const s of data.sessions) {
          const old = prev.current[s.session_id];
          if (old && old !== now[s.session_id]) {
            toast(`"${s.topic}" was rescheduled to ${now[s.session_id]}`, 'info');
            setFlash(s.session_id);
          } else if (!old) {
            toast(`New session scheduled: "${s.topic}"`, 'info');
            setFlash(s.session_id);
          }
        }
      }
      prev.current = now;
      setM(data);
    });

  useEffect(() => {
    prev.current = null;
    load().catch((e) => setError(e.message));
    // live sync: both sides re-fetch every 5s and when the tab regains focus
    const tick = () => load().catch(() => {});
    const t = setInterval(tick, 5000);
    window.addEventListener('focus', tick);
    return () => { clearInterval(t); window.removeEventListener('focus', tick); };
  }, [id]); // eslint-disable-line

  useEffect(() => {
    if (flash == null) return;
    const t = setTimeout(() => setFlash(null), 6000);
    return () => clearTimeout(t);
  }, [flash]);

  const run = async (fn) => {
    setError('');
    try { await fn(); await load(); } catch (e) { setError(e.message); }
  };

  const addSession = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post(`/mentorships/${id}/sessions`, { ...sess, session_date: toApi(sess.session_date) });
      setSess({ session_date: '', topic: '', notes: '' });
      toast('Session added');
    });
  };
  const sendFeedback = (sid) => run(() => api.post(`/sessions/${sid}/feedback`, fb[sid]));

  const openResched = (s) => { setResched(s); setNewDate(toInput(s.session_date)); };
  async function saveResched() {
    setSaving(true);
    try {
      await api.patch(`/sessions/${resched.session_id}`, { session_date: toApi(newDate) });
      toast(`Rescheduled to ${newDate.replace('T', ' ')}. Your mentee sees it automatically.`);
      setFlash(resched.session_id);
      setResched(null);
      await load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!m) return <p className="empty">{error || 'Loading...'}</p>;

  return (
    <>
      <div className="page-head">
        <div className="pair">
          <Avatar name={m.student_name} size="lg" />
          <span className="arrow">&rarr;</span>
          <Avatar name={m.alumni_name} size="lg" />
          <span className="live"><i /> Live</span>
        </div>
        <h1 style={{ marginTop: 14 }}>{m.student_name} &amp; {m.alumni_name}</h1>
        <div className="meta">
          <span>Started <b>{String(m.start_date).slice(0, 10)}</b></span>
          <span>Mode <b>{m.mode}</b></span>
          <span><b>{m.end_date ? `Ended ${String(m.end_date).slice(0, 10)}` : 'Ongoing'}</b></span>
        </div>
      </div>
      {error && <p className="notice error">{error}</p>}

      {isAlumni && (
        <div className="card">
          <h3>Mentorship settings</h3>
          <div className="row">
            <select value={m.mode}
                    onChange={(e) => run(() => api.patch(`/mentorships/${id}`, { mode: e.target.value }))}>
              <option>Online</option><option>Offline</option><option>Hybrid</option>
            </select>
            <input type="date" onChange={(e) => e.target.value &&
                   run(() => api.patch(`/mentorships/${id}`, { end_date: e.target.value }))} />
            <small style={{ color: 'var(--muted)' }}>Pick a date to end the mentorship</small>
          </div>
        </div>
      )}

      <h2 className="section-title">Sessions</h2>
      {m.sessions.map((s) => {
        const up = isUpcoming(s.session_date);
        return (
          <div className={`card session ${flash === s.session_id ? 'flash' : ''}`} key={s.session_id}>
            <div className="session-top">
              <div className="when">{fmt(s.session_date)}</div>
              <span className={`chip-state ${up ? 'up' : 'done'}`}>{up ? 'Upcoming' : 'Completed'}</span>
              {flash === s.session_id && <span className="chip-state updated">Updated</span>}
              {isAlumni && up && (
                <button className="ghost small" style={{ marginLeft: 'auto' }} onClick={() => openResched(s)}>
                  Reschedule
                </button>
              )}
            </div>
            <h3>{s.topic}</h3>
            {s.notes && <p style={{ marginTop: 6 }}>{s.notes}</p>}
            {s.feedback.map((f) => (
              <div key={f.feedback_id} className="feedback-line">
                <Stars value={f.rating} /><span>{f.comments}</span>
              </div>
            ))}
            {!isAlumni && (
              <div className="row rate-row">
                <select onChange={(e) => setFb({ ...fb, [s.session_id]: { ...fb[s.session_id], rating: e.target.value } })}>
                  <option value="">Rating</option>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}
                </select>
                <input placeholder="Comments"
                       onChange={(e) => setFb({ ...fb, [s.session_id]: { ...fb[s.session_id], comments: e.target.value } })} />
                <button disabled={!fb[s.session_id]?.rating} onClick={() => sendFeedback(s.session_id)}>
                  Submit feedback
                </button>
              </div>
            )}
          </div>
        );
      })}
      {m.sessions.length === 0 && <div className="empty">No sessions logged yet.</div>}

      {isAlumni && (
        <form className="card" onSubmit={addSession} style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 14 }}>Log a new session</h3>
          <label>Date and time</label>
          <input type="datetime-local" required value={sess.session_date}
                 onChange={(e) => setSess({ ...sess, session_date: e.target.value })} />
          <label>Topic</label>
          <input placeholder="Topic" required value={sess.topic}
                 onChange={(e) => setSess({ ...sess, topic: e.target.value })} />
          <label>Notes</label>
          <textarea placeholder="Notes" value={sess.notes}
                    onChange={(e) => setSess({ ...sess, notes: e.target.value })} />
          <button type="submit">Add session</button>
        </form>
      )}

      {resched && (
        <div className="modal" onClick={() => !saving && setResched(null)}>
          <div className="card" onClick={(e) => e.stopPropagation()}>
            <h3>Reschedule session</h3>
            <p className="sub">{resched.topic} &middot; currently {fmt(resched.session_date)}</p>
            <label>New date and time</label>
            <input type="datetime-local" value={newDate}
                   min={toInput(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString())}
                   onChange={(e) => setNewDate(e.target.value)} />
            <div className="row">
              <button className="secondary" disabled={saving} onClick={() => setResched(null)}>Cancel</button>
              <button disabled={saving || !newDate || newDate === toInput(resched.session_date)} onClick={saveResched}>
                {saving ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
