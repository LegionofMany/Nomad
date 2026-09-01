const { matchAddress } = require('./threatIntel');
const { SELECTORS, MAX_UINT_256, getSelector, decodeCallData, inspectTypedDataPayload } = require('./evmDecoder');

const ADDRESS_REGEX = /0x[a-fA-F0-9]{40}/g;
const HIGH_RISK_METHODS = [
  'eth_sendTransaction',
  'eth_sign',
  'personal_sign',
  'eth_signTypedData',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'wallet_watchAsset'
];
const PERMIT_KEYWORDS = ['permit', 'permit2', 'setapprovalforall', 'isapprovedforall', 'approve', 'increaseallowance', 'transferfrom', 'seaport', 'blur', 'looksrare', 'wyvern', 'universalrouter'];

function extractAddressesFromText(text) {
  return [...new Set(String(text || '').match(ADDRESS_REGEX) || [])].map((a) => a.toLowerCase());
}

function hasMaxApproval(data) {
  return String(data || '').toLowerCase().includes(MAX_UINT_256.slice(2));
}

function inspectTransactionParams(req) {
  const findings = [];
  const params = Array.isArray(req.params) ? req.params : [];
  const tx = params.find((p) => p && typeof p === 'object' && (p.to || p.data || p.value || p.input)) || {};
  const data = tx.data || tx.input || '';
  const selector = getSelector(data);
  const decoded = decodeCallData(data);

  if (tx.to) findings.push({ id: 'transaction_target', label: `Transaction target observed: ${String(tx.to).toLowerCase()}`, address: String(tx.to).toLowerCase(), weight: 1 });
  if (selector && SELECTORS[selector]) findings.push({ id: 'dangerous_function_selector', label: `Dangerous contract function selector: ${SELECTORS[selector]}`, selector, decoded, weight: selector === '0x095ea7b3' || selector === '0xa22cb465' ? 7 : 5 });
  if (decoded?.warnings?.length) findings.push({ id: 'decoded_transaction_warning', label: decoded.warnings.join('; '), selector, decoded, weight: decoded.warnings.some((w) => /infinite|max|setApprovalForAll/i.test(w)) ? 8 : 4 });
  if (hasMaxApproval(data)) findings.push({ id: 'infinite_approval', label: 'Possible infinite/max token approval detected', decoded, weight: 8 });
  if (tx.value && !['0x0', '0', 0].includes(tx.value)) findings.push({ id: 'native_value_transfer', label: `Native asset value transfer requested: ${tx.value}`, weight: 4 });
  return findings;
}

function inspectSignatureParams(req) {
  const method = String(req.method || '');
  const findings = [];
  if (!/sign/i.test(method)) return findings;

  const typed = inspectTypedDataPayload(req.params || []);
  if (typed.addresses.length) findings.push({ id: 'signature_addresses', label: `Signature payload referenced ${typed.addresses.length} address(es)`, addresses: typed.addresses, weight: 2 });
  for (const warning of typed.warnings) findings.push({ id: 'typed_data_warning', label: warning, parsedPreview: typed.parsed ? JSON.stringify(typed.parsed).slice(0, 1200) : null, weight: /permit|approval|max|spender|operator/i.test(warning) ? 8 : 4 });

  const serialized = JSON.stringify(req.params || '').toLowerCase();
  if (/login|nonce|statement|sign in/i.test(serialized) && !/permit|approval|spender|operator|seaport|blur|looksrare/.test(serialized)) {
    findings.push({ id: 'possible_login_signature', label: 'Signature may be a login/nonce message, but still requires user review', weight: 1 });
  }
  return findings;
}

function analyzeWalletRequests(walletRequests = [], textSources = []) {
  const findings = [];
  const addresses = new Set();

  for (const req of walletRequests) {
    const method = String(req.method || '').trim();
    const serialized = JSON.stringify(req).toLowerCase();
    extractAddressesFromText(serialized).forEach((a) => addresses.add(a));

    if (HIGH_RISK_METHODS.includes(method)) {
      const weight = /signtypeddata|sign/i.test(method) ? 6 : method === 'eth_sendTransaction' ? 7 : 4;
      findings.push({ id: 'high_risk_wallet_method', label: `High-risk wallet method requested: ${method}`, method, weight });
    }
    if (PERMIT_KEYWORDS.some((k) => serialized.includes(k))) {
      findings.push({ id: 'permit_or_approval_signature', label: 'Permit/approval-style signature or call detected', method, weight: 7 });
    }
    if (method === 'eth_sendTransaction') findings.push(...inspectTransactionParams(req));
    findings.push(...inspectSignatureParams(req));
  }

  for (const src of textSources) {
    const text = typeof src === 'string' ? src : JSON.stringify(src);
    extractAddressesFromText(text).forEach((a) => addresses.add(a));
    const low = text.toLowerCase();
    if (PERMIT_KEYWORDS.some((k) => low.includes(k))) findings.push({ id: 'permit_keyword_in_payload', label: 'Permit/approval keyword found in payload or logs', weight: 4 });
    for (const [selector, label] of Object.entries(SELECTORS)) {
      if (low.includes(selector)) findings.push({ id: 'selector_in_payload', label: `High-risk selector found in payload: ${label}`, selector, weight: 5 });
    }
  }

  for (const addr of [...addresses]) {
    const intel = matchAddress(addr);
    if (intel) findings.push({ id: 'known_bad_address', label: `Known bad address observed: ${addr}`, address: addr, intel, weight: intel.severity === 'critical' ? 10 : 9 });
  }

  const deduped = [];
  const seen = new Set();
  for (const finding of findings) {
    const key = `${finding.id}:${finding.method || ''}:${finding.selector || ''}:${finding.address || ''}:${finding.label}`;
    if (!seen.has(key)) { seen.add(key); deduped.push(finding); }
  }

  const decodedTransactions = deduped.filter((f) => f.decoded).map((f) => f.decoded);
  const scoreWeight = deduped.reduce((sum, f) => sum + (f.weight || 1), 0);
  return { observedAddresses: [...addresses], decodedTransactions, findings: deduped, scoreWeight };
}

module.exports = { analyzeWalletRequests, extractAddressesFromText, inspectTransactionParams };
