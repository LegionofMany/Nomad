const { isWeakSecret, timingSafeEqualString } = require('./securityConfig');

function requireAdmin(req, res, next) {
  const configured = process.env.ADMIN_API_KEY;
  if (isWeakSecret(configured)) {
    return res.status(503).json({ error: 'Admin API is disabled until ADMIN_API_KEY is configured with a strong non-default secret.' });
  }
  const provided = req.get('x-admin-api-key') || req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!provided || !timingSafeEqualString(provided, configured)) return res.status(401).json({ error: 'Admin API key required.' });
  return next();
}

module.exports = { requireAdmin };
