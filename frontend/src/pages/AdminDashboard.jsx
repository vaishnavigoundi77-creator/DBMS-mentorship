import { useEffect, useMemo, useState } from 'react';
import api from '../api.js';
import Avatar from '../components/Avatar.jsx';
import Stars from '../components/Stars.jsx';
import { useToast } from '../components/Toast.jsx';

const EMPTY = { name: '', email: '', phone: '', graduation_year: '', current_company: '', position: '' };

export default function AdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [alumni, setAlumni] = useState([]);
  const [skills, setSkills] = useState([]);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [picked, setPicked] = useState([]);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    Promise.all([api.get('/alumni', { params: { q: '', skill_id: '' } }), api.get('/stats')])
      .then(([a, s]) => { setAlumni(a.data); setStats(s.data); })
      .catch((e) => toast(e.message, 'error'));

  useEffect(() => { load(); api.get('/skills').then((r) => setSkills(r.data)); }, []); // eslint-disable-line

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return alumni;
    return alumni.filter((a) =>
      [a.name, a.email, a.current_company, a.position, a.skills].join(' ').toLowerCase().includes(t));
  }, [alumni, q]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggleSkill = (id) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  function openAdd() { setForm(EMPTY); setPicked([]); setError(''); setAdding(true); }

  async function addAlumni(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { data } = await api.post('/alumni', form);
      const newId = data?.alumni_id ?? data?.id ?? data?.insertId;
      if (newId) {
        for (const sid of picked) {
          await api.post(`/alumni/${newId}/skills`, { skill_id: sid }).catch(() => {});
        }
      }
      toast(`${form.name} was added as a mentor`);
      setAdding(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    try {
      await api.delete(`/alumni/${toDelete.alumni_id}`);
      toast(`${toDelete.name} was removed`, 'info');
      setToDelete(null);
      await load();
    } catch (err) {
      toast(err.message, 'error');
      setToDelete(null);
    } finally {
      setBusy(false);
    }
  }

  const cards = stats && [
    { k: 'alumni', label: 'Mentors (alumni)', v: stats.alumni },
    { k: 'students', label: 'Students', v: stats.students },
    { k: 'mentorships', label: 'Active mentorships', v: stats.mentorships },
    { k: 'sessions', label: 'Sessions held', v: stats.sessions },
  ];

  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">Admin console</span>
          <h1>Manage your mentor network</h1>
          <p>Add new alumni mentors or remove them. Changes show up instantly for every student.</p>
        </div>
        <button className="hero-btn" onClick={openAdd}>+ Add alumni</button>
      </section>

      <div className="stat-grid">
        {cards ? cards.map((c) => (
          <div className={`card stat-card tone-${c.k}`} key={c.k}>
            <div className="num">{c.v}</div>
            <div className="lbl">{c.label}</div>
          </div>
        )) : <p className="empty" style={{ gridColumn: '1 / -1' }}>Loading...</p>}
      </div>

      <div className="section-bar">
        <h2 className="section-title" style={{ margin: 0 }}>
          Alumni mentors <span className="count">{shown.length}</span>
        </h2>
        <input className="search" placeholder="Search name, company, skill..."
               value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Alumni</th><th>Role</th><th>Class</th><th>Skills</th><th>Rating</th><th /></tr>
          </thead>
          <tbody>
            {shown.map((a) => (
              <tr key={a.alumni_id}>
                <td>
                  <div className="person-head">
                    <Avatar name={a.name} size="sm" />
                    <div>
                      <b>{a.name}</b>
                      <div className="role">{a.email || `ID #${a.alumni_id}`}</div>
                    </div>
                  </div>
                </td>
                <td>{a.position}<div className="role">{a.current_company}</div></td>
                <td className="date">{a.graduation_year}</td>
                <td>
                  <div className="tags">
                    {a.skills ? a.skills.split(',').slice(0, 3).map((s) => <span className="tag" key={s}>{s.trim()}</span>)
                              : <span className="role">-</span>}
                  </div>
                </td>
                <td>{a.avg_rating ? <span className="rating"><Stars value={a.avg_rating} /> {a.avg_rating}</span> : <span className="role">New</span>}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="danger" onClick={() => setToDelete(a)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <div className="empty" style={{ border: 0 }}>No alumni found.</div>}
      </div>

      {adding && (
        <div className="modal" onClick={() => !busy && setAdding(false)}>
          <form className="card wide" onClick={(e) => e.stopPropagation()} onSubmit={addAlumni}>
            <h3>Add a new alumni mentor</h3>
            <p className="sub">They can log in right away with this email.</p>
            <div className="field-pair">
              <div><label>Full name</label><input required value={form.name} onChange={set('name')} /></div>
              <div><label>Email</label><input type="email" required value={form.email} onChange={set('email')} /></div>
            </div>
            <div className="field-pair">
              <div><label>Phone</label><input value={form.phone} onChange={set('phone')} /></div>
              <div><label>Graduation year</label><input type="number" required value={form.graduation_year} onChange={set('graduation_year')} /></div>
            </div>
            <div className="field-pair">
              <div><label>Company</label><input value={form.current_company} onChange={set('current_company')} /></div>
              <div><label>Position</label><input value={form.position} onChange={set('position')} /></div>
            </div>
            {skills.length > 0 && (
              <>
                <label>Skills (optional)</label>
                <div className="pick-tags">
                  {skills.map((s) => (
                    <button type="button" key={s.skill_id}
                            className={`pick ${picked.includes(s.skill_id) ? 'on' : ''}`}
                            onClick={() => toggleSkill(s.skill_id)}>{s.skill_name}</button>
                  ))}
                </div>
              </>
            )}
            {error && <p className="error">{error}</p>}
            <div className="row">
              <button type="button" className="secondary" disabled={busy} onClick={() => setAdding(false)}>Cancel</button>
              <button type="submit" disabled={busy}>{busy ? 'Adding...' : 'Add mentor'}</button>
            </div>
          </form>
        </div>
      )}

      {toDelete && (
        <div className="modal" onClick={() => !busy && setToDelete(null)}>
          <div className="card" onClick={(e) => e.stopPropagation()}>
            <h3>Delete {toDelete.name}?</h3>
            <p className="sub">
              This removes the mentor from the network. Students will no longer see them in the directory.
            </p>
            <div className="row">
              <button className="secondary" disabled={busy} onClick={() => setToDelete(null)}>Cancel</button>
              <button className="danger solid" disabled={busy} onClick={confirmDelete}>
                {busy ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
