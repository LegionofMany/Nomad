const express = require('express');
const router = express.Router();
const { normalizeUrl, assertPublicUrl } = require('../utils/urlSafety');
const { makeAuditId, readAuditReport, listAuditSummaries } = require('../utils/auditStore');
const { enqueueAuditJob, getAuditJobStatus, getQueueStats } = require('../utils/auditQueue');

router.post('/', async (req, res) => {
  try {
    if (process.env.ENABLE_QUEUE === 'false') return res.status(503).json({ error: 'Queue API is disabled. Use POST /audit for synchronous scans.' });
    const normalizedUrl = normalizeUrl(req.body.url);
    if (process.env.ALLOW_PRIVATE_AUDIT !== 'true') await assertPublicUrl(normalizedUrl);
    const auditId = makeAuditId(normalizedUrl);
    const requestedAt = new Date().toISOString();
    const queued = await enqueueAuditJob({ auditId, url: req.body.url, normalizedUrl, requestedAt });
    return res.status(202).json({
      accepted: true,
      auditId,
      statusUrl: `/audits/${auditId}`,
      reportUrl: `/audits/${auditId}/report`,
      requestedAt,
      ...queued
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/recent', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit || 25), 100));
    const [recent, queue] = await Promise.all([listAuditSummaries(limit), getQueueStats().catch((err) => ({ error: err.message }))]);
    return res.json({ recent, queue });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:auditId/report', async (req, res) => {
  try {
    const report = await readAuditReport(req.params.auditId);
    if (!report) return res.status(404).json({ error: 'Audit report not found yet' });
    return res.json(report);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/:auditId', async (req, res) => {
  try {
    const [report, job] = await Promise.all([
      readAuditReport(req.params.auditId),
      getAuditJobStatus(req.params.auditId).catch((err) => ({ error: err.message }))
    ]);
    if (!report && !job) return res.status(404).json({ error: 'Audit not found' });
    return res.json({
      auditId: req.params.auditId,
      state: report ? 'completed' : job?.state || 'unknown',
      job,
      reportSummary: report ? {
        auditId: report.auditId,
        url: report.url,
        generatedAt: report.generatedAt,
        risk: report.risk,
        scannerVersion: report.scannerVersion
      } : null,
      report: report || null
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;
