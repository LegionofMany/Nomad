const { matchDomain } = require('./threatIntel');

const SUSPICIOUS_TLDS = new Set(['zip', 'mov', 'click', 'top', 'xyz', 'quest', 'cam', 'rest', 'mom', 'lol']);
const BRAND_WORDS = ['metamask', 'opensea', 'blur', 'coinbase', 'binance', 'uniswap', 'pancakeswap', 'aave', 'compound', 'ledger', 'trezor', 'phantom'];

function hostnameOf(url) {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; }
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

function analyzeDomain(url) {
  const host = hostnameOf(url);
  const labels = host.split('.').filter(Boolean);
  const tld = labels.at(-1) || '';
  const secondLevel = labels.at(-2) || labels[0] || '';
  const findings = [];

  const domainMatches = matchDomain(host);
  for (const match of domainMatches) {
    findings.push({ id: 'known_bad_domain', label: `Known bad domain matched: ${match.value}`, intel: match, weight: match.severity === 'critical' ? 10 : 8 });
  }
  if (SUSPICIOUS_TLDS.has(tld)) findings.push({ id: 'suspicious_tld', label: `Suspicious/high-abuse TLD observed: .${tld}`, weight: 1 });
  if (labels.length >= 4) findings.push({ id: 'many_subdomains', label: 'Excessive subdomain depth can indicate phishing infrastructure', weight: 1 });
  if (/-{2,}|\d{3,}/.test(host)) findings.push({ id: 'odd_domain_pattern', label: 'Unusual domain punctuation or number pattern', weight: 1 });

  for (const brand of BRAND_WORDS) {
    if (secondLevel !== brand && (secondLevel.includes(brand) || levenshtein(secondLevel, brand) <= 2)) {
      findings.push({ id: 'brand_impersonation', label: `Possible brand impersonation/typosquat near: ${brand}`, brand, weight: 4 });
    }
  }

  return { host, findings, scoreWeight: findings.reduce((sum, f) => sum + f.weight, 0) };
}

module.exports = { analyzeDomain, hostnameOf };
