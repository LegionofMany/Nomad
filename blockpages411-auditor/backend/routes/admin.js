const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../utils/adminAuth');
const { readAuditReport, listAuditSummaries } = require('../utils/auditStore');
const { saveVerdict, readVerdict, listVerdicts } = require('../utils/verdictStore');
const { appendIntel, exportThreatIntel, normalizeDomain } = require('../utils/threatIntel');

router.use(requireAdmin);

router.get('/health', (_req, res) => res.json({ ok: true, admin: true, version: '8.0.0' }));

router.get('/audits/recent', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit || 50), 200));
    const recent = await listAuditSummaries(limit);
    const verdicts = await listVerdicts(500);
    const verdictMap = new Map(verdicts.map((v) => [v.auditId, v]));
    return res.json({ recent: recent.map((item) => ({ ...item, verdict: verdictMap.get(item.auditId) || null })) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/audits/:auditId', async (req, res) => {
  try {
    const [report, verdict] = await Promise.all([readAuditReport(req.params.auditId), readVerdict(req.params.auditId)]);
    if (!report) return res.status(404).json({ error: 'Audit report not found' });
    return res.json({ report, verdict });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});


router.get('/audits/:auditId/screenshot', async (req, res) => {
  try {
    const report = await readAuditReport(req.params.auditId);
    if (!report?.dynamicAnalysis?.screenshot?.path) return res.status(404).json({ error: 'Screenshot not found for this audit' });
    const path = require('path');
    const baseDir = path.resolve(process.env.SCREENSHOT_DIR || path.join(__dirname, '..', 'data', 'screenshots'));
    const screenshotPath = path.resolve(report.dynamicAnalysis.screenshot.path);
    if (!screenshotPath.startsWith(baseDir)) return res.status(403).json({ error: 'Screenshot path is outside allowed directory' });
    return res.sendFile(screenshotPath);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/audits/:auditId/verdict', async (req, res) => {
  try {
    const report = await readAuditReport(req.params.auditId);
    if (!report) return res.status(404).json({ error: 'Audit report not found' });
    const verdict = await saveVerdict(req.params.auditId, req.body, req.get('x-admin-reviewer') || 'operator');
    const threatIntelUpdates = [];

    if (verdict.verdict === 'confirmed_malicious' && verdict.addToThreatIntel) {
      const host = report.domainIntel?.host || normalizeDomain(report.url);
      if (host) threatIntelUpdates.push(await appendIntel('domain', [{ value: host, source: 'admin_verdict', severity: 'critical', tags: ['manual-verdict', ...(verdict.tags || [])], note: verdict.notes }]));

      const addresses = report.contractIntel?.observedAddresses || [];
      if (addresses.length) threatIntelUpdates.push(await appendIntel('address', addresses.map((address) => ({ value: address, source: 'admin_verdict', severity: 'critical', tags: ['manual-verdict', ...(verdict.tags || [])], note: `Observed in ${verdict.auditId}` }))));

      const hashes = (report.payloadAnalysis?.payloads || []).map((p) => p.sha256).filter(Boolean);
      if (hashes.length) threatIntelUpdates.push(await appendIntel('scriptHash', hashes.map((hash) => ({ value: hash, source: 'admin_verdict', severity: 'critical', tags: ['manual-verdict', ...(verdict.tags || [])], note: `Observed in ${verdict.auditId}` }))));
    }

    return res.json({ saved: true, verdict, threatIntelUpdates });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/verdicts', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit || 100), 500));
    return res.json({ verdicts: await listVerdicts(limit) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/intel/domains', async (req, res) => {
  try {
    const entries = Array.isArray(req.body.entries) ? req.body.entries : [req.body];
    return res.json(await appendIntel('domain', entries));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/intel/addresses', async (req, res) => {
  try {
    const entries = Array.isArray(req.body.entries) ? req.body.entries : [req.body];
    return res.json(await appendIntel('address', entries));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/intel/script-hashes', async (req, res) => {
  try {
    const entries = Array.isArray(req.body.entries) ? req.body.entries : [req.body];
    return res.json(await appendIntel('scriptHash', entries));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/export/threat-intel', (_req, res) => {
  res.json(exportThreatIntel());
});

module.exports = router;
