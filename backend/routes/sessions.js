const router = require('express').Router();
const db = require('../config/db');
const { wrap, need, httpError } = require('../middleware/util');

// POST /api/sessions/:id/feedback   body: { rating (1-5), comments? }
router.post('/:id/feedback', wrap(async (req, res) => {
  need(req.body, ['rating']);
  const [r] = await db.query(
    'INSERT INTO feedback (rating, comments, session_id) VALUES (?,?,?)',
    [req.body.rating, req.body.comments || null, req.params.id]);
  res.status(201).json({ feedback_id: r.insertId });
}));

// PATCH /api/sessions/:id   body: { session_date: 'YYYY-MM-DD HH:MM:SS' }   (reschedule)
router.patch('/:id', wrap(async (req, res) => {
  need(req.body, ['session_date']);
  const date = String(req.body.session_date).replace('T', ' ');
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(date)) {
    throw httpError(400, 'session_date must look like YYYY-MM-DD HH:MM[:SS]');
  }
  const [r] = await db.query(
    'UPDATE mentorship_session SET session_date = ? WHERE session_id = ?',
    [date, req.params.id]);
  if (!r.affectedRows) throw httpError(404, 'Session not found');
  const [rows] = await db.query(
    'SELECT * FROM mentorship_session WHERE session_id = ?', [req.params.id]);
  res.json({ message: 'Session rescheduled', session: rows[0] });
}));

module.exports = router;
