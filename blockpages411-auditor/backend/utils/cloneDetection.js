const crypto = require('crypto');
const { fetchTextSafe } = require('./safeHttp');
const { hostnameOf } = require('./domainIntel');

function normalizeHtmlStructure(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/data-[a-z0-9_-]+="[^"]*"/gi, '')
    .replace(/https?:\/\/[^"'<>\s]+/gi, '')
    .replace(/[a-f0-9]{16,}/gi, '')
    .replace(/\s+/g, '')
    .slice(0, 500000);
}

async function getSiteFingerprint(url) {
  try {
    const { text, finalUrl } = await fetchTextSafe(url, { maxContentLength: 2_000_000 });
    const normalized = normalizeHtmlStructure(text);
    return { hash: crypto.createHash('sha256').update(normalized).digest('hex'), finalUrl };
  } catch {
    return { hash: null, finalUrl: url };
  }
}

function isClone(targetUrl, fingerprintResult, knownFingerprints = []) {
  const hash = typeof fingerprintResult === 'string' ? fingerprintResult : fingerprintResult?.hash;
  if (!hash) return { clonedSite: false, matched: null };
  const targetHost = hostnameOf(targetUrl);
  for (const entry of knownFingerprints) {
    const normalized = typeof entry === 'string' ? { hash: entry, domains: [] } : entry;
    if (normalized.hash !== hash) continue;
    const domains = (normalized.domains || [normalized.domain]).filter(Boolean).map((d) => d.toLowerCase().replace(/^www\./, ''));
    const isOfficialHost = domains.some((d) => targetHost === d || targetHost.endsWith(`.${d}`));
    if (!isOfficialHost) return { clonedSite: true, matched: normalized };
    return { clonedSite: false, matched: normalized, officialMatch: true };
  }
  return { clonedSite: false, matched: null };
}

module.exports = { getSiteFingerprint, isClone, normalizeHtmlStructure };
