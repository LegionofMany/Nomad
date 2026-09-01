const cheerio = require('cheerio');
const { fetchTextSafe } = require('./safeHttp');

const SUSPICIOUS_PATTERNS = [
  { id: 'eval', label: 'eval() execution', regex: /\beval\s*\(/i, weight: 2 },
  { id: 'function_ctor', label: 'Function constructor', regex: /new\s+Function\s*\(|\bFunction\s*\(/i, weight: 2 },
  { id: 'document_write', label: 'document.write injection', regex: /document\.write\s*\(/i, weight: 1 },
  { id: 'base64_decode', label: 'Base64 decode', regex: /\batob\s*\(/i, weight: 1 },
  { id: 'from_char_code', label: 'String.fromCharCode obfuscation', regex: /String\.fromCharCode\s*\(/i, weight: 1 },
  { id: 'hex_escapes', label: 'Heavy hex escape obfuscation', regex: /(\\x[a-f0-9]{2}){10,}/i, weight: 2 },
  { id: 'wallet_api', label: 'Wallet provider API use', regex: /window\.ethereum|ethereum\.request|window\.web3|solana\.connect|phantom\.solana/i, weight: 2 },
  { id: 'tx_request', label: 'Transaction/signature request method', regex: /eth_sendTransaction|eth_sign|personal_sign|eth_signTypedData|eth_signTypedData_v[34]|wallet_watchAsset/i, weight: 4 },
  { id: 'permit', label: 'Permit/approval signature keywords', regex: /Permit2|permit\(|permitBatch|EIP-2612|setApprovalForAll|isApprovedForAll|approve\(|increaseAllowance/i, weight: 4 },
  { id: 'nft_market_signature', label: 'NFT marketplace signature keywords', regex: /seaport|looksrare|blurExchange|wyvern|x2y2/i, weight: 3 },
  { id: 'claim_airdrop', label: 'Airdrop/claim language', regex: /airdrop|claim\s+(now|reward|tokens?)|free\s+mint|reward|eligibility|verify\s+wallet/i, weight: 2 },
  { id: 'wasm', label: 'WASM payload usage', regex: /WebAssembly|\.wasm/i, weight: 2 },
  { id: 'clipboard_access', label: 'Clipboard access', regex: /navigator\.clipboard|clipboardData/i, weight: 2 },
  { id: 'telegram_discord_exfil', label: 'Telegram/Discord webhook style endpoint', regex: /api\.telegram\.org|discord(?:app)?\.com\/api\/webhooks/i, weight: 4 }
];

function absoluteUrl(baseUrl, maybeUrl) {
  try { return new URL(maybeUrl, baseUrl).toString(); } catch { return null; }
}

function scanText(text, source = 'html') {
  const findings = [];
  const safeText = String(text || '');
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.regex.test(safeText)) findings.push({ source, id: pattern.id, label: pattern.label, weight: pattern.weight });
  }
  const base64Like = safeText.match(/[A-Za-z0-9+/=]{220,}/g) || [];
  if (base64Like.length) findings.push({ source, id: 'large_encoded_blob', label: 'Large encoded/obfuscated string blob', weight: 3, count: base64Like.length });
  const longLines = safeText.split('\n').filter((line) => line.length > 2000).length;
  if (longLines) findings.push({ source, id: 'minified_or_packed_code', label: 'Very long minified/packed JavaScript lines', weight: 1, count: longLines });
  return findings;
}

async function staticAnalysis(url) {
  const result = { finalUrl: url, redirects: [], htmlBytes: 0, scriptUrls: [], inlineScriptCount: 0, forms: [], iframes: [], findings: [], scoreWeight: 0, errors: [] };
  try {
    const fetched = await fetchTextSafe(url, { maxContentLength: 2_000_000 });
    const html = fetched.text;
    result.finalUrl = fetched.finalUrl;
    result.redirects = fetched.redirects;
    result.htmlBytes = Buffer.byteLength(String(html));
    result.findings.push(...scanText(String(html), 'html'));

    const $ = cheerio.load(html);
    $('script').each((_i, el) => {
      const src = $(el).attr('src');
      const body = $(el).html() || '';
      if (src) {
        const full = absoluteUrl(result.finalUrl, src);
        if (full) result.scriptUrls.push(full);
      } else if (body.trim()) {
        result.inlineScriptCount += 1;
        result.findings.push(...scanText(body, `inline-script-${result.inlineScriptCount}`));
      }
    });

    $('form').each((_i, el) => {
      const action = absoluteUrl(result.finalUrl, $(el).attr('action') || result.finalUrl);
      const text = $(el).text().trim().slice(0, 200);
      const inputs = $(el).find('input').map((_j, input) => $(input).attr('name') || $(input).attr('type') || '').get().filter(Boolean);
      result.forms.push({ action, text, inputs: inputs.slice(0, 20) });
      if (/seed|recovery|secret|private\s*key|mnemonic/i.test(`${text} ${inputs.join(' ')}`)) {
        result.findings.push({ source: 'form', id: 'seed_phrase_form', label: 'Form appears to ask for seed phrase/private key style data', weight: 8 });
      }
    });

    $('iframe').each((_i, el) => {
      const src = absoluteUrl(result.finalUrl, $(el).attr('src') || '');
      if (src) result.iframes.push(src);
    });
    if (result.iframes.length) result.findings.push({ source: 'html', id: 'iframes_present', label: 'Page embeds iframe(s); review third-party content', weight: 1, count: result.iframes.length });

    result.scriptUrls = [...new Set(result.scriptUrls)].slice(0, 50);
    result.scoreWeight = result.findings.reduce((sum, f) => sum + (f.weight || 1), 0);
    return result;
  } catch (err) {
    result.errors.push(err.message);
    return result;
  }
}

module.exports = { staticAnalysis, scanText, absoluteUrl };
