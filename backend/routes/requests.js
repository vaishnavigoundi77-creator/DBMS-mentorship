const router = require('express').Router();
const db = require('../config/db');
const { wrap, need, httpError } = require('../middleware/util');

// POST /api/requests   body: { student_id, alumni_id, message }
router.post('/', wrap(async (req, res) => {
  need(req.body, ['student_id', 'alumni_id', 'message']);
  const { student_id, alumni_id, message } = req.body;
  const [r] = await db.query(
    'INSERT INTO mentorship_request (message, student_id, alumni_id) VALUES (?,?,?)',
    [message.trim(), student_id, alumni_id]);   // trigger blocks duplicate pending
  res.status(201).json({ request_id: r.insertId, status: 'Pending' });
}));

// GET /api/requests?student_id=1   or   ?alumni_id=2&status=Pending
router.get('/', wrap(async (req, res) => {
  const { student_id, alumni_id, status } = req.query;
  if (!student_id && !alumni_id) throw httpError(400, 'Provide student_id or alumni_id');
  let sql = 'SELECT * FROM v_request_details WHERE 1=1';
  const params = [];
  if (student_id) { sql += ' AND student_id = ?'; params.push(student_id); }
  if (alumni_id)  { sql += ' AND alumni_id = ?';  params.push(alumni_id); }
  if (status)     { sql += ' AND status = ?';     params.push(status); }
  const [rows] = await db.query(sql + ' ORDER BY request_date DESC', params);
  res.json(rows);
}));

// PATCH /api/requests/:id/status   body: { status: 'Accepted' | 'Rejected' }
router.patch('/:id/status', wrap(async (req, res) => {
  need(req.body, ['status']);
  await db.query('CALL respond_to_request(?, ?)', [req.params.id, req.body.status]);
  res.json({ message: 'Request ' + req.body.status.toLowerCase() });
}));

module.exports = router;
