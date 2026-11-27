const router = require('express').Router();
const db = require('../config/db');
const { wrap, need, httpError } = require('../middleware/util');

// Deletes rows of `table` where `col` IN (values), first deleting every row in
// any other table that references them (found through information_schema), so it
// works whatever ON DELETE rules the schema uses (mentorships, sessions, feedback ...).
async function purge(conn, table, col, values, depth = 0) {
  if (!values.length || depth > 8) return;
  const [refs] = await conn.query(
    `SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_COLUMN_NAME
       FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = ?`, [table]);
  for (const r of refs) {
    if (r.TABLE_NAME === table) continue;
    const [rows] = await conn.query(
      'SELECT DISTINCT ?? AS v FROM ?? WHERE ?? IN (?)',
      [r.REFERENCED_COLUMN_NAME, table, col, values]);
    await purge(conn, r.TABLE_NAME, r.COLUMN_NAME,
                rows.map((x) => x.v).filter((v) => v !== null), depth + 1);
  }
  await conn.query('DELETE FROM ?? WHERE ?? IN (?)', [table, col, values]);
}

// GET /api/alumni?q=google&skill_id=3      (both optional)
router.get('/', wrap(async (req, res) => {
  const { q, skill_id } = req.query;
  let sql = `SELECT d.*, a.email AS email, r.avg_rating, r.feedback_count
               FROM v_alumni_directory d
               JOIN alumni a ON a.alumni_id = d.alumni_id
               LEFT JOIN v_alumni_rating r ON r.alumni_id = d.alumni_id
              WHERE 1=1`;
  const params = [];
  if (q) {
    sql += ' AND (d.name LIKE ? OR d.current_company LIKE ? OR d.`position` LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (skill_id) {
    sql += ' AND d.alumni_id IN (SELECT alumni_id FROM alumni_skill WHERE skill_id = ?)';
    params.push(skill_id);
  }
  const [rows] = await db.query(sql + ' ORDER BY d.name', params);
  res.json(rows);
}));

// GET /api/alumni/:id   (profile + skills[])
router.get('/:id', wrap(async (req, res) => {
  const [rows] = await db.query(
    `SELECT a.*, r.avg_rating, r.feedback_count
       FROM alumni a LEFT JOIN v_alumni_rating r ON r.alumni_id = a.alumni_id
      WHERE a.alumni_id = ?`, [req.params.id]);
  if (!rows.length) throw httpError(404, 'Alumni not found');
  const [skills] = await db.query(
    `SELECT s.skill_id, s.skill_name FROM alumni_skill x
       JOIN skill s ON s.skill_id = x.skill_id WHERE x.alumni_id = ?`, [req.params.id]);
  res.json({ ...rows[0], skills });
}));

// POST /api/alumni   (register)
router.post('/', wrap(async (req, res) => {
  need(req.body, ['name', 'email', 'graduation_year']);
  const { name, email, graduation_year, current_company = null, position = null, phone = null } = req.body;
  const [r] = await db.query(
    `INSERT INTO alumni (name, email, graduation_year, current_company, \`position\`, phone)
     VALUES (?,?,?,?,?,?)`,
    [name.trim(), email.trim().toLowerCase(), graduation_year, current_company, position, phone]);
  res.status(201).json({ alumni_id: r.insertId });
}));

// PUT /api/alumni/:id
router.put('/:id', wrap(async (req, res) => {
  need(req.body, ['name', 'graduation_year']);
  const { name, graduation_year, current_company = null, position = null, phone = null } = req.body;
  const [r] = await db.query(
    `UPDATE alumni SET name=?, graduation_year=?, current_company=?, \`position\`=?, phone=?
      WHERE alumni_id=?`,
    [name, graduation_year, current_company, position, phone, req.params.id]);
  if (!r.affectedRows) throw httpError(404, 'Alumni not found');
  res.json({ message: 'Alumni updated' });
}));

// POST /api/alumni/:id/skills   body: { skill_id }
router.post('/:id/skills', wrap(async (req, res) => {
  need(req.body, ['skill_id']);
  await db.query('INSERT INTO alumni_skill (alumni_id, skill_id) VALUES (?,?)',
                 [req.params.id, req.body.skill_id]);
  res.status(201).json({ message: 'Skill added' });
}));

// DELETE /api/alumni/:id/skills/:skillId
router.delete('/:id/skills/:skillId', wrap(async (req, res) => {
  await db.query('DELETE FROM alumni_skill WHERE alumni_id=? AND skill_id=?',
                 [req.params.id, req.params.skillId]);
  res.json({ message: 'Skill removed' });
}));

// DELETE /api/alumni/:id   (admin: removes the mentor and everything tied to them)
router.delete('/:id', wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw httpError(400, 'Invalid alumni id');
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [found] = await conn.query('SELECT alumni_id FROM alumni WHERE alumni_id = ?', [id]);
    if (!found.length) throw httpError(404, 'Alumni not found');
    await purge(conn, 'alumni', 'alumni_id', [id]);
    await conn.commit();
    res.json({ message: 'Alumni deleted' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

module.exports = router;
