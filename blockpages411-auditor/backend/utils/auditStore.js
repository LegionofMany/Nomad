const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function makeAuditId(url) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = crypto.createHash('sha256').update(`${url}:${Date.now()}:${Math.random()}`).digest('hex').slice(0, 12);
  return `bp411-${date}-${suffix}`;
}

function assertSafeAuditId(auditId) {
  const id = String(auditId || '');
  if (!/^bp411-[0-9]{8}-[a-f0-9]{12}$/i.test(id)) throw new Error('Invalid audit ID');
  return id;
}

function getReportDir() {
  return path.resolve(process.env.AUDIT_REPORT_DIR || path.join(__dirname, '..', 'data', 'audit-reports'));
}

function buildAuditRecord(report) {
  return {
    auditId: report.auditId,
    url: report.url,
    generatedAt: report.generatedAt,
    scannerVersion: report.scannerVersion,
    workflow: report.workflow || null,
    risk: report.risk,
    domainHost: report.domainIntel?.host || null,
    clonedSite: Boolean(report.cloneDetection?.clonedSite),
    staticFindingCount: report.staticAnalysis?.findings?.length || 0,
    payloadFindingCount: (report.payloadAnalysis?.payloads || []).reduce((sum, p) => sum + (p.findings?.length || 0), 0),
    walletRequestCount: report.dynamicAnalysis?.walletRequests?.length || 0,
    blockedRequestCount: report.dynamicAnalysis?.blockedRequests?.length || 0,
    contractFindingCount: report.contractIntel?.findings?.length || 0,
    screenshotCaptured: Boolean(report.dynamicAnalysis?.screenshot),
    report
  };
}

function buildAuditSummary(report) {
  return {
    auditId: report.auditId,
    url: report.url,
    generatedAt: report.generatedAt,
    scannerVersion: report.scannerVersion,
    risk: report.risk,
    workflow: report.workflow || null,
    clonedSite: Boolean(report.cloneDetection?.clonedSite),
    host: report.domainIntel?.host || null,
    counts: {
      domainFindings: report.domainIntel?.findings?.length || 0,
      staticFindings: report.staticAnalysis?.findings?.length || 0,
      payloadsChecked: report.payloadAnalysis?.checked || 0,
      walletRequests: report.dynamicAnalysis?.walletRequests?.length || 0,
      blockedRequests: report.dynamicAnalysis?.blockedRequests?.length || 0,
      contractFindings: report.contractIntel?.findings?.length || 0,
      screenshotCaptured: Boolean(report.dynamicAnalysis?.screenshot)
    }
  };
}

async function saveAuditReport(report, options = {}) {
  const appendJsonl = options.appendJsonl !== false;
  const record = buildAuditRecord(report);
  const reportDir = getReportDir();
  await fs.promises.mkdir(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `${assertSafeAuditId(report.auditId)}.json`);
  await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

  const logPath = process.env.AUDIT_LOG_PATH;
  if (logPath && appendJsonl) {
    const resolved = path.resolve(logPath);
    await fs.promises.mkdir(path.dirname(resolved), { recursive: true });
    await fs.promises.appendFile(resolved, `${JSON.stringify(record)}\n`, 'utf8');
    return { persisted: true, reportPath, jsonlPath: resolved };
  }

  return { persisted: true, reportPath, jsonlPath: null };
}

async function readAuditReport(auditId) {
  const reportPath = path.join(getReportDir(), `${assertSafeAuditId(auditId)}.json`);
  try {
    return JSON.parse(await fs.promises.readFile(reportPath, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function listAuditSummaries(limit = 25) {
  const reportDir = getReportDir();
  try {
    await fs.promises.mkdir(reportDir, { recursive: true });
    const files = await fs.promises.readdir(reportDir);
    const candidates = [];
    for (const file of files.filter((f) => f.endsWith('.json'))) {
      const fullPath = path.join(reportDir, file);
      const stat = await fs.promises.stat(fullPath);
      candidates.push({ file, fullPath, mtimeMs: stat.mtimeMs });
    }
    candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
    const out = [];
    for (const item of candidates.slice(0, Math.max(1, Math.min(Number(limit) || 25, 100)))) {
      try {
        const report = JSON.parse(await fs.promises.readFile(item.fullPath, 'utf8'));
        out.push(buildAuditSummary(report));
      } catch {}
    }
    return out;
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

module.exports = { makeAuditId, assertSafeAuditId, buildAuditRecord, buildAuditSummary, saveAuditReport, readAuditReport, listAuditSummaries };
