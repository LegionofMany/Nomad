const crypto = require('crypto');

const WEAK_ADMIN_KEYS = new Set([
  'change-me-before-production',
  'replace-with-strong-secret',
  'admin',
  'password',
  'test',
  'secret',
  'changeme'
]);

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function isWeakSecret(value) {
  const text = String(value || '').trim();
  if (!text) return true;
  if (WEAK_ADMIN_KEYS.has(text.toLowerCase())) return true;
  if (text.length < 32) return true;
  return false;
}

function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function assertStartupSecurity({ service = 'backend' } = {}) {
  const warnings = [];
  const errors = [];

  const adminKey = process.env.ADMIN_API_KEY;
  if (isWeakSecret(adminKey)) {
    const message = 'ADMIN_API_KEY must be a strong non-default secret of at least 32 characters.';
    if (isProduction()) errors.push(message);
    else warnings.push(message);
  }

  if (process.env.ALLOW_PRIVATE_AUDIT === 'true') {
    const message = 'ALLOW_PRIVATE_AUDIT=true allows scanning private/internal hosts. Keep false outside local fixture testing.';
    if (isProduction()) errors.push(message);
    else warnings.push(message);
  }

  if (process.env.ALLOW_PRIVATE_RPC === 'true') {
    const message = 'ALLOW_PRIVATE_RPC=true allows private/internal RPC URLs. Keep false outside controlled local testing.';
    if (isProduction()) errors.push(message);
    else warnings.push(message);
  }

  if (isProduction() && process.env.ENABLE_SYNC_AUDIT === 'true') {
    warnings.push('ENABLE_SYNC_AUDIT=true exposes synchronous scans in production. Prefer queued scans only.');
  }

  if (isProduction() && (!process.env.ALLOWED_ORIGIN || process.env.ALLOWED_ORIGIN === '*')) {
    errors.push('ALLOWED_ORIGIN must be set to the live Blockpages411 frontend origin in production.');
  }

  if (errors.length) {
    const details = errors.map((e) => `- ${e}`).join('\n');
    throw new Error(`Refusing to start ${service} because production security checks failed:\n${details}`);
  }

  for (const warning of warnings) console.warn(`[security-warning] ${warning}`);
  return { ok: true, warnings };
}

function getSafePublicConfig() {
  return {
    service: 'blockpages411-auditor',
    version: '8.0.0',
    queueEnabled: process.env.ENABLE_QUEUE !== 'false',
    syncAuditEnabled: process.env.ENABLE_SYNC_AUDIT === 'true',
    chainSimulationEnabled: process.env.ENABLE_CHAIN_SIMULATION === 'true',
    screenshotsEnabled: process.env.CAPTURE_SCREENSHOTS === 'true',
    adminConfigured: !isWeakSecret(process.env.ADMIN_API_KEY)
  };
}

module.exports = {
  WEAK_ADMIN_KEYS,
  isProduction,
  isWeakSecret,
  timingSafeEqualString,
  assertStartupSecurity,
  getSafePublicConfig
};
