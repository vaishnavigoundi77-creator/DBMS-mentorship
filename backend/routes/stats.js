const router = require('express').Router();
const db = require('../config/db');
const { wrap } = require('../middleware/util');

// GET /api/stats   (dashboard numbers)
router.get('/', wrap(async (req, res) => {
  const [[totals]] = await db.query(
    `SELECT (SELECT COUNT(*) FROM student)   AS students,
            (SELECT COUNT(*) FROM alumni)    AS alumni,
            (SELECT COUNT(*) FROM mentorship) AS mentorships,
            (SELECT COUNT(*) FROM mentorship_session) AS sessions`);
  const [byStatus] = await db.query(
    'SELECT status, COUNT(*) AS count FROM mentorship_request GROUP BY status');
  const [topSkills] = await db.query(
    `SELECT s.skill_name, COUNT(*) AS alumni_count
       FROM alumni_skill x JOIN skill s ON s.skill_id = x.skill_id
      GROUP BY s.skill_id ORDER BY alumni_count DESC LIMIT 5`);
  res.json({ ...totals, requests_by_status: byStatus, top_skills: topSkills });
}));

module.exports = router;
