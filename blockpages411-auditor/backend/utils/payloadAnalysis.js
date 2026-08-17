const crypto = require('crypto');
const { scanText } = require('./staticAnalysis');
const { fetchTextSafe } = require('./safeHttp');
const { analyzeDomain } = require('./domainIntel');
const { matchScriptHash } = require('./threatIntel');

async function payloadAnalysis(scriptUrls = []) {
  const unique = [...new Set(scriptUrls)].slice(0, Number(process.env.MAX_PAYLOADS || 30));
  const payloads = [];

  for (const src of unique) {
    const item = { src, finalUrl: src, sha256: null, bytes: 0, findings: [], domainFindings: [], error: null };
    try {
      const domainIntel = analyzeDomain(src);
      item.domainFindings = domainIntel.findings;
      const fetched = await fetchTextSafe(src, { timeout: 10000, maxContentLength: 1_500_000, accept: 'application/javascript,text/javascript,*/*;q=0.8' });
      const text = String(fetched.text || '');
      item.finalUrl = fetched.finalUrl;
      item.bytes = Buffer.byteLength(text);
      item.sha256 = crypto.createHash('sha256').update(text).digest('hex');
      item.findings = [...scanText(text, src), ...item.domainFindings.map((f) => ({ source: src, ...f }))];
      const hashIntel = matchScriptHash(item.sha256);
      if (hashIntel) item.findings.push({ source: src, id: 'known_bad_script_hash', label: `Known bad script hash matched: ${item.sha256}`, intel: hashIntel, weight: hashIntel.severity === 'critical' ? 10 : 9 });
    } catch (err) {
      item.error = err.message;
    }
    payloads.push(item);
  }

  const scoreWeight = payloads.flatMap((p) => p.findings).reduce((sum, f) => sum + (f.weight || 1), 0);
  return { checked: payloads.length, payloads, scoreWeight };
}

module.exports = { payloadAnalysis };
