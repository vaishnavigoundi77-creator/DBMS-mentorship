const router = require('express').Router();
const db = require('../config/db');
const { wrap, need, httpError } = require('../middleware/util');

// POST /api/students   (register)
router.post('/', wrap(async (req, res) => {
  need(req.body, ['name', 'email', 'year', 'dept_id']);
  const { name, email, year, phone = null, dept_id } = req.body;
  const [r] = await db.query(
    'INSERT INTO student (name, email, `year`, phone, dept_id) VALUES (?,?,?,?,?)',
    [name.trim(), email.trim().toLowerCase(), year, phone, dept_id]);
  res.status(201).json({ student_id: r.insertId });
}));

// GET /api/students/:id
router.get('/:id', wrap(async (req, res) => {
  const [rows] = await db.query(
    `SELECT s.student_id, s.name, s.email, s.\`year\`, s.phone, s.dept_id, d.dept_name
       FROM student s JOIN department d ON d.dept_id = s.dept_id
      WHERE s.student_id = ?`, [req.params.id]);
  if (!rows.length) throw httpError(404, 'Student not found');
  res.json(rows[0]);
}));

// PUT /api/students/:id
router.put('/:id', wrap(async (req, res) => {
  need(req.body, ['name', 'year', 'dept_id']);
  const { name, year, phone = null, dept_id } = req.body;
  const [r] = await db.query(
    'UPDATE student SET name=?, `year`=?, phone=?, dept_id=? WHERE student_id=?',
    [name, year, phone, dept_id, req.params.id]);
  if (!r.affectedRows) throw httpError(404, 'Student not found');
  res.json({ message: 'Student updated' });
}));

module.exports = router;
