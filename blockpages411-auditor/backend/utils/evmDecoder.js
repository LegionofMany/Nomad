const SELECTORS = {
  '0x095ea7b3': 'ERC20 approve(address,uint256)',
  '0xa22cb465': 'ERC721/1155 setApprovalForAll(address,bool)',
  '0x23b872dd': 'transferFrom(address,address,uint256)',
  '0x42842e0e': 'safeTransferFrom(address,address,uint256)',
  '0xb88d4fde': 'safeTransferFrom(address,address,uint256,bytes)',
  '0xd505accf': 'ERC20 permit(address,address,uint256,uint256,uint8,bytes32,bytes32)',
  '0x2b67b570': 'Permit2 permitTransferFrom(...)',
  '0x30f28b7a': 'Permit2 permitBatchTransferFrom(...)',
  '0x3593564c': 'Uniswap Universal Router execute(...)',
  '0x5ae401dc': 'Multicall aggregate/multicall style execution'
};

const MAX_UINT_256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

function cleanHex(value) {
  const text = String(value || '').toLowerCase();
  return text.startsWith('0x') ? text.slice(2) : text;
}

function getSelector(data) {
  const value = String(data || '').toLowerCase();
  return value.startsWith('0x') && value.length >= 10 ? value.slice(0, 10) : null;
}

function wordAt(data, index) {
  const hex = cleanHex(data);
  const start = 8 + index * 64;
  const value = hex.slice(start, start + 64);
  return value.length === 64 ? value : null;
}

function addressFromWord(word) {
  if (!word || word.length !== 64) return null;
  return `0x${word.slice(24)}`.toLowerCase();
}

function bigintFromWord(word) {
  try { return word ? BigInt(`0x${word}`) : null; } catch { return null; }
}

function boolFromWord(word) {
  const value = bigintFromWord(word);
  if (value === null) return null;
  return value !== 0n;
}

function humanBigInt(value) {
  if (value === null || value === undefined) return null;
  const s = value.toString();
  if (s.length > 32) return `${s.slice(0, 12)}...${s.slice(-8)}`;
  return s;
}

function isMaxUint(value) {
  return value === ((1n << 256n) - 1n);
}

function decodeCallData(data) {
  const selector = getSelector(data);
  const decoded = { selector, signature: selector ? SELECTORS[selector] || null : null, args: {}, warnings: [] };
  if (!selector) return decoded;

  if (selector === '0x095ea7b3') {
    const spender = addressFromWord(wordAt(data, 0));
    const amount = bigintFromWord(wordAt(data, 1));
    decoded.args = { spender, amount: humanBigInt(amount), rawAmount: amount !== null ? `0x${amount.toString(16)}` : null, infiniteApproval: isMaxUint(amount) };
    if (isMaxUint(amount)) decoded.warnings.push('Infinite/max ERC20 approval requested');
    if (spender) decoded.warnings.push(`ERC20 spender: ${spender}`);
  }

  if (selector === '0xa22cb465') {
    const operator = addressFromWord(wordAt(data, 0));
    const approved = boolFromWord(wordAt(data, 1));
    decoded.args = { operator, approved };
    if (approved) decoded.warnings.push('NFT setApprovalForAll grants an operator access to all tokens in a collection');
    if (operator) decoded.warnings.push(`NFT operator: ${operator}`);
  }

  if (selector === '0x23b872dd' || selector === '0x42842e0e') {
    const from = addressFromWord(wordAt(data, 0));
    const to = addressFromWord(wordAt(data, 1));
    const tokenIdOrAmount = bigintFromWord(wordAt(data, 2));
    decoded.args = { from, to, tokenIdOrAmount: humanBigInt(tokenIdOrAmount) };
    decoded.warnings.push('TransferFrom-style function observed');
  }

  if (selector === '0xb88d4fde') {
    const from = addressFromWord(wordAt(data, 0));
    const to = addressFromWord(wordAt(data, 1));
    const tokenId = bigintFromWord(wordAt(data, 2));
    decoded.args = { from, to, tokenId: humanBigInt(tokenId) };
    decoded.warnings.push('safeTransferFrom with extra bytes observed');
  }

  if (selector === '0xd505accf') {
    const owner = addressFromWord(wordAt(data, 0));
    const spender = addressFromWord(wordAt(data, 1));
    const value = bigintFromWord(wordAt(data, 2));
    const deadline = bigintFromWord(wordAt(data, 3));
    decoded.args = { owner, spender, value: humanBigInt(value), deadline: humanBigInt(deadline), infiniteApproval: isMaxUint(value) };
    decoded.warnings.push('EIP-2612 permit call detected');
    if (isMaxUint(value)) decoded.warnings.push('Permit grants infinite/max allowance');
  }

  if (selector === '0x2b67b570' || selector === '0x30f28b7a') {
    decoded.warnings.push('Permit2 transfer function observed; requires manual review of encoded permit payload');
  }

  if (selector === '0x3593564c' || selector === '0x5ae401dc') {
    decoded.warnings.push('Router/multicall-style execution can hide nested transfers or approvals');
  }

  return decoded;
}

function inspectTypedDataPayload(params = []) {
  const out = { parsed: null, warnings: [], addresses: [] };
  const candidates = Array.isArray(params) ? params : [params];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const trimmed = candidate.trim();
    if (!trimmed.startsWith('{')) continue;
    try {
      const parsed = JSON.parse(trimmed);
      out.parsed = parsed;
      const text = JSON.stringify(parsed).toLowerCase();
      const addresses = text.match(/0x[a-f0-9]{40}/g) || [];
      out.addresses.push(...addresses);
      if (/permit2|permit|allowance|spender|operator|approval|seaport|blur|looksrare/.test(text)) out.warnings.push('Typed-data signature contains permit/approval/marketplace terms');
      if (/0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff/.test(text)) out.warnings.push('Typed-data signature references max uint / infinite approval value');
      if (parsed?.domain?.verifyingContract) out.warnings.push(`Typed-data verifying contract: ${String(parsed.domain.verifyingContract).toLowerCase()}`);
    } catch {}
  }
  out.addresses = [...new Set(out.addresses.map((a) => a.toLowerCase()))];
  return out;
}

module.exports = { SELECTORS, MAX_UINT_256, getSelector, decodeCallData, inspectTypedDataPayload };
