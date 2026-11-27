const router = require('express').Router();
const db = require('../config/db');
const { wrap, need } = require('../middleware/util');

// GET /api/departments
router.get('/departments', wrap(async (req, res) => {
  const [rows] = await db.query('SELECT dept_id, dept_name FROM department ORDER BY dept_name');
  res.json(rows);
}));

// GET /api/skills
router.get('/skills', wrap(async (req, res) => {
  const [rows] = await db.query('SELECT skill_id, skill_name FROM skill ORDER BY skill_name');
  res.json(rows);
}));

// POST /api/skills   body: { skill_name }
router.post('/skills', wrap(async (req, res) => {
  need(req.body, ['skill_name']);
  const name = req.body.skill_name.trim();
  const [r] = await db.query('INSERT INTO skill (skill_name) VALUES (?)', [name]);
  res.status(201).json({ skill_id: r.insertId, skill_name: name });
}));

module.exports = router;
