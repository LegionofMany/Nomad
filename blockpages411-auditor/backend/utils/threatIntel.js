const fs = require('fs');
const path = require('path');

function readJsonArray(filePath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function threatIntelDir() {
  return path.resolve(process.env.THREAT_INTEL_DIR || path.join(__dirname, '..', 'data', 'threat-intel'));
}

function packagedPath(fileName) {
  return path.join(__dirname, '..', 'data', fileName);
}

function customPath(fileName) {
  return path.join(threatIntelDir(), fileName);
}

function normalizeDomain(domain) {
  return String(domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').replace(/\.$/, '');
}

function normalizeAddress(address) {
  const raw = String(address || '').trim().toLowerCase();
  return /^0x[a-f0-9]{40}$/.test(raw) ? raw : null;
}

function normalizeHash(hash) {
  const raw = String(hash || '').trim().toLowerCase();
  return /^[a-f0-9]{64}$/.test(raw) ? raw : null;
}

function normalizeIntelEntry(entry, type) {
  if (typeof entry === 'string') {
    const value = type === 'domain' ? normalizeDomain(entry) : type === 'address' ? normalizeAddress(entry) : normalizeHash(entry);
    return value ? { value, source: 'list', severity: 'high', tags: [] } : null;
  }
  if (!entry || typeof entry !== 'object') return null;
  const value = type === 'domain'
    ? normalizeDomain(entry.value || entry.domain || entry.host)
    : type === 'address'
      ? normalizeAddress(entry.value || entry.address)
      : normalizeHash(entry.value || entry.sha256 || entry.hash);
  if (!value) return null;
  return {
    value,
    source: String(entry.source || 'manual'),
    severity: String(entry.severity || 'high'),
    tags: Array.isArray(entry.tags) ? entry.tags.map(String) : [],
    note: entry.note ? String(entry.note).slice(0, 1000) : '',
    addedAt: entry.addedAt || null
  };
}

function mergeIntel(base, custom, type) {
  const map = new Map();
  for (const entry of [...base, ...custom]) {
    const normalized = normalizeIntelEntry(entry, type);
    if (!normalized) continue;
    const previous = map.get(normalized.value);
    map.set(normalized.value, previous ? { ...previous, ...normalized, tags: [...new Set([...(previous.tags || []), ...(normalized.tags || [])])] } : normalized);
  }
  return [...map.values()];
}

function getDomainIntelList() {
  return mergeIntel(readJsonArray(packagedPath('knownBadDomains.json')), readJsonArray(customPath('knownBadDomains.custom.json')), 'domain');
}

function getAddressIntelList() {
  return mergeIntel(readJsonArray(packagedPath('knownBadAddresses.json')), readJsonArray(customPath('knownBadAddresses.custom.json')), 'address');
}

function getScriptHashIntelList() {
  return mergeIntel(readJsonArray(packagedPath('knownBadScriptHashes.json')), readJsonArray(customPath('knownBadScriptHashes.custom.json')), 'hash');
}

function matchDomain(hostname) {
  const host = normalizeDomain(hostname);
  return getDomainIntelList().filter((entry) => host === entry.value || host.endsWith(`.${entry.value}`));
}

function matchAddress(address) {
  const addr = normalizeAddress(address);
  if (!addr) return null;
  return getAddressIntelList().find((entry) => entry.value === addr) || null;
}

function matchScriptHash(hash) {
  const sha = normalizeHash(hash);
  if (!sha) return null;
  return getScriptHashIntelList().find((entry) => entry.value === sha) || null;
}

async function appendIntel(type, entries = []) {
  const fileByType = {
    domain: 'knownBadDomains.custom.json',
    address: 'knownBadAddresses.custom.json',
    scriptHash: 'knownBadScriptHashes.custom.json'
  };
  const fileName = fileByType[type];
  if (!fileName) throw new Error('Unsupported threat intel type');
  const dir = threatIntelDir();
  await fs.promises.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  const current = readJsonArray(filePath);
  const normalized = entries.map((entry) => normalizeIntelEntry({ ...entry, addedAt: entry.addedAt || new Date().toISOString() }, type === 'scriptHash' ? 'hash' : type)).filter(Boolean);
  const merged = mergeIntel(current, normalized, type === 'scriptHash' ? 'hash' : type);
  await fs.promises.writeFile(filePath, JSON.stringify(merged, null, 2), 'utf8');
  return { filePath, added: normalized.length, total: merged.length, entries: normalized };
}

function exportThreatIntel() {
  return {
    generatedAt: new Date().toISOString(),
    domains: getDomainIntelList(),
    addresses: getAddressIntelList(),
    scriptHashes: getScriptHashIntelList()
  };
}

module.exports = {
  threatIntelDir,
  normalizeDomain,
  normalizeAddress,
  normalizeHash,
  getDomainIntelList,
  getAddressIntelList,
  getScriptHashIntelList,
  matchDomain,
  matchAddress,
  matchScriptHash,
  appendIntel,
  exportThreatIntel
};
