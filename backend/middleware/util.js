// wraps async route handlers so errors reach the error middleware
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// throws a 400 if any required field is missing/empty
function need(body, fields) {
  const missing = fields.filter(
    (f) => body[f] === undefined || body[f] === null || body[f] === ''
  );
  if (missing.length) {
    const err = new Error('Missing required field(s): ' + missing.join(', '));
    err.status = 400;
    throw err;
  }
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { wrap, need, httpError };
