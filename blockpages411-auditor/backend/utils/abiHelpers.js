function strip0x(value) {
  const text = String(value || '');
  return text.startsWith('0x') ? text.slice(2) : text;
}

function pad32(hex) {
  return strip0x(hex).padStart(64, '0');
}

function encodeAddress(address) {
  return pad32(String(address || '').toLowerCase().replace(/^0x/, ''));
}

function encodeUint(value) {
  try { return BigInt(value).toString(16).padStart(64, '0'); } catch { return ''.padStart(64, '0'); }
}

function decodeStringReturn(hex) {
  const raw = strip0x(hex);
  if (!raw || raw.length < 64) return null;
  try {
    // Dynamic string: offset, length, data.
    if (raw.length >= 128) {
      const offset = Number(BigInt(`0x${raw.slice(0, 64)}`));
      const lenStart = offset * 2;
      const len = Number(BigInt(`0x${raw.slice(lenStart, lenStart + 64)}`));
      const data = raw.slice(lenStart + 64, lenStart + 64 + len * 2);
      return Buffer.from(data, 'hex').toString('utf8').replace(/\0+$/g, '') || null;
    }
    // bytes32 string fallback.
    return Buffer.from(raw.slice(0, 64), 'hex').toString('utf8').replace(/\0+$/g, '') || null;
  } catch {
    return null;
  }
}

function decodeUintReturn(hex) {
  try {
    const raw = strip0x(hex);
    if (!raw) return null;
    return BigInt(`0x${raw.slice(-64)}`).toString();
  } catch {
    return null;
  }
}

function hexToDecimalString(hex) {
  try { return BigInt(hex || '0x0').toString(); } catch { return null; }
}

module.exports = { strip0x, pad32, encodeAddress, encodeUint, decodeStringReturn, decodeUintReturn, hexToDecimalString };
