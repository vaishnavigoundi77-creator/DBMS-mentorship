const router = require('express').Router();
const db = require('../config/db');
const { wrap, need, httpError } = require('../middleware/util');

// GET /api/mentorships?student_id=1   or   ?alumni_id=2
router.get('/', wrap(async (req, res) => {
  const { student_id, alumni_id } = req.query;
  if (!student_id && !alumni_id) throw httpError(400, 'Provide student_id or alumni_id');
  const col = student_id ? 'student_id' : 'alumni_id';
  const [rows] = await db.query(
    `SELECT * FROM v_mentorship_details WHERE ${col} = ? ORDER BY start_date DESC`,
    [student_id || alumni_id]);
  res.json(rows);
}));

// GET /api/mentorships/:id   (details + sessions[] each with feedback[])
router.get('/:id', wrap(async (req, res) => {
  const [m] = await db.query('SELECT * FROM v_mentorship_details WHERE mentorship_id = ?', [req.params.id]);
  if (!m.length) throw httpError(404, 'Mentorship not found');
  const [sessions] = await db.query(
    'SELECT * FROM mentorship_session WHERE mentorship_id = ? ORDER BY session_date', [req.params.id]);
  const [fb] = await db.query(
    `SELECT f.* FROM feedback f JOIN mentorship_session s ON s.session_id = f.session_id
      WHERE s.mentorship_id = ?`, [req.params.id]);
  sessions.forEach((s) => { s.feedback = fb.filter((f) => f.session_id === s.session_id); });
  res.json({ ...m[0], sessions });
}));

// PATCH /api/mentorships/:id   body: { mode?, end_date? }
router.patch('/:id', wrap(async (req, res) => {
  const { mode, end_date } = req.body;
  const [r] = await db.query(
    'UPDATE mentorship SET `mode` = COALESCE(?, `mode`), end_date = COALESCE(?, end_date) WHERE mentorship_id = ?',
    [mode || null, end_date || null, req.params.id]);
  if (!r.affectedRows) throw httpError(404, 'Mentorship not found');
  res.json({ message: 'Mentorship updated' });
}));

// POST /api/mentorships/:id/sessions   body: { session_date, topic, notes? }
router.post('/:id/sessions', wrap(async (req, res) => {
  need(req.body, ['session_date', 'topic']);
  const { session_date, topic, notes = null } = req.body;
  const [r] = await db.query(
    'INSERT INTO mentorship_session (session_date, topic, notes, mentorship_id) VALUES (?,?,?,?)',
    [session_date, topic.trim(), notes, req.params.id]);
  res.status(201).json({ session_id: r.insertId });
}));

module.exports = router;
