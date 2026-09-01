const { getChainConfig } = require('./chainRegistry');
const { normalizeUrl, assertPublicUrl } = require('./urlSafety');

let requestId = 1;

async function rpcCall(chainId, method, params = [], options = {}) {
  const chain = getChainConfig(chainId);
  if (!chain.rpcUrl) {
    return { ok: false, skipped: true, reason: `No RPC URL configured for ${chain.name}`, chain };
  }

  let rpcUrl;
  try {
    rpcUrl = normalizeUrl(chain.rpcUrl);
    if (process.env.ALLOW_PRIVATE_RPC !== 'true') await assertPublicUrl(rpcUrl);
  } catch (err) {
    return { ok: false, skipped: true, reason: `RPC URL failed safety validation: ${err.message}`, chain };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(options.timeoutMs || process.env.RPC_TIMEOUT_MS || 8000));
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': 'Blockpages411Auditor/8.0' },
      body: JSON.stringify({ jsonrpc: '2.0', id: requestId++, method, params }),
      signal: controller.signal
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    if (!res.ok) return { ok: false, status: res.status, error: `RPC HTTP ${res.status}`, bodyPreview: text.slice(0, 500), chain };
    if (json?.error) return { ok: false, error: json.error, chain };
    return { ok: true, result: json?.result, chain };
  } catch (err) {
    return { ok: false, error: err.name === 'AbortError' ? 'RPC request timed out' : err.message, chain };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { rpcCall };
