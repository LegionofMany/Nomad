const fs = require('fs');
const path = require('path');
const { assertSafeAuditId } = require('./auditStore');

const VALID_VERDICTS = new Set(['needs_review', 'confirmed_malicious', 'confirmed_safe', 'false_positive', 'inconclusive']);

function verdictDir() {
  return path.resolve(process.env.ADMIN_VERDICT_DIR || path.join(__dirname, '..', 'data', 'admin-verdicts'));
}

function safeVerdict(verdict) {
  const raw = String(verdict || '').trim().toLowerCase();
  if (!VALID_VERDICTS.has(raw)) throw new Error(`Invalid verdict. Use one of: ${[...VALID_VERDICTS].join(', ')}`);
  return raw;
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean))].slice(0, 30);
}

async function saveVerdict(auditId, body = {}, reviewer = 'operator') {
  const id = assertSafeAuditId(auditId);
  const dir = verdictDir();
  await fs.promises.mkdir(dir, { recursive: true });
  const record = {
    auditId: id,
    verdict: safeVerdict(body.verdict),
    reviewedAt: new Date().toISOString(),
    reviewer: String(body.reviewer || reviewer || 'operator').slice(0, 100),
    notes: String(body.notes || '').slice(0, 4000),
    tags: normalizeTags(body.tags),
    addToThreatIntel: Boolean(body.addToThreatIntel)
  };
  const filePath = path.join(dir, `${id}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(record, null, 2), 'utf8');
  return { ...record, filePath };
}

async function readVerdict(auditId) {
  const id = assertSafeAuditId(auditId);
  const filePath = path.join(verdictDir(), `${id}.json`);
  try {
    return JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function listVerdicts(limit = 100) {
  const dir = verdictDir();
  await fs.promises.mkdir(dir, { recursive: true });
  const files = await fs.promises.readdir(dir);
  const rows = [];
  for (const file of files.filter((f) => f.endsWith('.json'))) {
    try {
      const filePath = path.join(dir, file);
      const stat = await fs.promises.stat(filePath);
      const parsed = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
      rows.push({ ...parsed, mtimeMs: stat.mtimeMs });
    } catch {}
  }
  rows.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return rows.slice(0, Math.max(1, Math.min(Number(limit) || 100, 500))).map(({ mtimeMs, ...row }) => row);
}

module.exports = { VALID_VERDICTS, saveVerdict, readVerdict, listVerdicts };
