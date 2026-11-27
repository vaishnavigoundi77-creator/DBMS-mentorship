const router = require('express').Router();
const db = require('../config/db');
const { wrap, need, httpError } = require('../middleware/util');

// POST /api/auth/login   body: { role: 'student'|'alumni', email }
router.post('/login', wrap(async (req, res) => {
  need(req.body, ['role', 'email']);
  const { role, email } = req.body;
  const sql = {
    student: 'SELECT student_id AS id, name, email FROM student WHERE email = ?',
    alumni:  'SELECT alumni_id  AS id, name, email FROM alumni  WHERE email = ?'
  }[role];
  if (!sql) throw httpError(400, "role must be 'student' or 'alumni'");

  const [rows] = await db.query(sql, [email.trim().toLowerCase()]);
  if (!rows.length) throw httpError(401, 'No account found for this email');
  res.json({ role, user: rows[0] });
}));

module.exports = router;
