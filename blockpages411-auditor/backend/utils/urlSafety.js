const dns = require('dns').promises;
const net = require('net');

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata',
  '169.254.169.254'
]);

const BLOCKED_HOST_SUFFIXES = ['.local', '.internal', '.lan', '.localhost'];

function ipv4ToInt(ip) {
  const parts = String(ip).split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return null;
  return (((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
}

function inCidr(ip, base, bits) {
  const value = ipv4ToInt(ip);
  const baseValue = ipv4ToInt(base);
  if (value === null || baseValue === null) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (value & mask) === (baseValue & mask);
}

const BLOCKED_IPV4_CIDRS = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4]
];

function normalizeUrl(input) {
  if (!input || typeof input !== 'string') throw new Error('URL required');
  const trimmed = input.trim();
  if (trimmed.length > 2048) throw new Error('URL is too long');
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported');
  if (parsed.username || parsed.password) throw new Error('URLs with embedded credentials are blocked');
  if (!parsed.hostname) throw new Error('URL hostname is required');
  parsed.hash = '';
  return parsed.toString();
}

function normalizeIp(ip) {
  if (!ip) return '';
  const mapped = String(ip).match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  return mapped ? mapped[1] : String(ip).toLowerCase();
}

function isPrivateIp(ip) {
  const clean = normalizeIp(ip);
  const family = net.isIP(clean);
  if (family === 0) return true;
  if (family === 4) return BLOCKED_IPV4_CIDRS.some(([base, bits]) => inCidr(clean, base, bits));
  return (
    clean === '::1' ||
    clean === '::' ||
    clean.startsWith('fc') ||
    clean.startsWith('fd') ||
    clean.startsWith('fe80:') ||
    clean.startsWith('ff') ||
    clean.startsWith('2001:db8:')
  );
}

function isPotentiallyPrivateHostname(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!host) return true;
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  if (net.isIP(host) && isPrivateIp(host)) return true;
  return false;
}

function isBlockedPort(port, protocol) {
  if (!port) return false;
  const p = Number(port);
  const allowed = protocol === 'https:' ? [443, 8443] : [80, 8080];
  return !allowed.includes(p);
}

async function resolvePublicAddresses(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (isPotentiallyPrivateHostname(host)) throw new Error('Local/private hosts are blocked');
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error('Private IP targets are blocked');
    return [{ address: host, family: net.isIP(host) }];
  }
  const records = await dns.lookup(host, { all: true, verbatim: true });
  if (!records.length) throw new Error('Host could not be resolved');
  for (const record of records) {
    if (isPrivateIp(record.address)) throw new Error(`Host resolved to private/internal address: ${record.address}`);
  }
  return records;
}

async function assertPublicUrl(url) {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported');
  if (parsed.username || parsed.password) throw new Error('URLs with embedded credentials are blocked');
  if (isBlockedPort(parsed.port, parsed.protocol)) throw new Error('Non-standard target ports are blocked');
  await resolvePublicAddresses(parsed.hostname);
  return true;
}

async function classifyRequestUrl(rawUrl, { allowPrivate = process.env.ALLOW_PRIVATE_AUDIT === 'true' } = {}) {
  try {
    const parsed = new URL(String(rawUrl));
    if (!['http:', 'https:'].includes(parsed.protocol)) return { allowed: false, reason: `Blocked unsupported protocol: ${parsed.protocol}` };
    if (parsed.username || parsed.password) return { allowed: false, reason: 'Blocked URL with embedded credentials' };
    if (isBlockedPort(parsed.port, parsed.protocol)) return { allowed: false, reason: 'Blocked non-standard target port' };
    if (!allowPrivate) await resolvePublicAddresses(parsed.hostname);
    return { allowed: true, reason: 'Allowed public HTTP(S) request' };
  } catch (err) {
    return { allowed: false, reason: err.message || 'Blocked unsafe request URL' };
  }
}

module.exports = {
  normalizeUrl,
  assertPublicUrl,
  classifyRequestUrl,
  isPrivateIp,
  isPotentiallyPrivateHostname,
  isBlockedPort,
  resolvePublicAddresses
};
