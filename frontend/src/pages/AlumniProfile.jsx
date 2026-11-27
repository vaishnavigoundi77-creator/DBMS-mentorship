import { useEffect, useState } from 'react';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function AlumniProfile() {
  const { auth } = useAuth();
  const id = auth.user.id;
  const [p, setP] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [pick, setPick] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => api.get(`/alumni/${id}`).then((r) => setP(r.data));
  useEffect(() => { load(); api.get('/skills').then((r) => setAllSkills(r.data)); }, []); // eslint-disable-line

  const set = (k) => (e) => setP({ ...p, [k]: e.target.value });
  async function save(e) {
    e.preventDefault();
    try { await api.put(`/alumni/${id}`, p); setMsg('Profile saved'); }
    catch (err) { setMsg(err.message); }
  }
  async function addSkill() {
    try { await api.post(`/alumni/${id}/skills`, { skill_id: pick }); setPick(''); load(); }
    catch (err) { setMsg(err.message); }
  }
  async function removeSkill(sid) { await api.delete(`/alumni/${id}/skills/${sid}`); load(); }

  if (!p) return <p className="empty">Loading...</p>;
  return (
    <>
      <div className="page-head">
        <h1>My Profile</h1>
        <p>This is what students see when they browse alumni.</p>
      </div>
      <form className="card" onSubmit={save}>
        <div className="field-pair">
          <div><label>Full name</label><input value={p.name} onChange={set('name')} required /></div>
          <div><label>Graduation year</label><input value={p.graduation_year} onChange={set('graduation_year')} required /></div>
        </div>
        <div className="field-pair">
          <div><label>Company</label><input value={p.current_company || ''} placeholder="Company" onChange={set('current_company')} /></div>
          <div><label>Position</label><input value={p.position || ''} placeholder="Position" onChange={set('position')} /></div>
        </div>
        <label>Phone</label>
        <input value={p.phone || ''} placeholder="Phone" onChange={set('phone')} />
        <button type="submit">Save changes</button>
        {msg && <p className="info" style={{ marginTop: 12 }}>{msg}</p>}
      </form>

      <div className="card">
        <h3 style={{ marginBottom: 14 }}>My skills</h3>
        {p.skills.map((s) => (
          <span key={s.skill_id} className="chip">
            {s.skill_name} <a title="Remove" onClick={() => removeSkill(s.skill_id)}>&times;</a>
          </span>
        ))}
        <div className="row">
          <select value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Add a skill...</option>
            {allSkills.filter((s) => !p.skills.some((x) => x.skill_id === s.skill_id))
              .map((s) => <option key={s.skill_id} value={s.skill_id}>{s.skill_name}</option>)}
          </select>
          <button disabled={!pick} onClick={addSkill}>Add</button>
        </div>
      </div>
    </>
  );
}
