const express = require('express');
const router = express.Router();
const { performAudit } = require('../utils/auditRunner');

router.post('/', async (req, res) => {
  try {
    if (process.env.ENABLE_SYNC_AUDIT !== 'true') {
      return res.status(503).json({
        error: 'Synchronous audit endpoint is disabled. Use POST /audits for queued production scans, or set ENABLE_SYNC_AUDIT=true for local development only.'
      });
    }
    const report = await performAudit(req.body.url, { mode: 'sync' });
    return res.json(report);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;
