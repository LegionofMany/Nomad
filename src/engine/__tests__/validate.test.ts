import {
  assertBitcoinTestnetAddress,
  assertEvmAddress,
  parseBtcAmountToSats,
  parseEthAmountToWei,
} from '../validate';

describe('engine input validation', () => {
  test('BTC amounts parse exactly, with no floating point error', () => {
    expect(parseBtcAmountToSats('1')).toBe(100_000_000n);
    expect(parseBtcAmountToSats('0.1')).toBe(10_000_000n);
    expect(parseBtcAmountToSats('0.00000001')).toBe(1n);
    expect(parseBtcAmountToSats('0.29')).toBe(29_000_000n);
  });

  test.each(['', '0', '0.0', '-1', '1e3', '0.123456789', 'abc', '1.', '.5', '21000000.00000001', ' '])(
    'rejects invalid BTC amount %p',
    (bad) => {
      expect(() => parseBtcAmountToSats(bad)).toThrow();
    },
  );

  test('ETH amounts parse to wei and reject more than 18 decimals', () => {
    expect(parseEthAmountToWei('1')).toBe(1_000_000_000_000_000_000n);
    expect(parseEthAmountToWei('0.000000000000000001')).toBe(1n);
    expect(() => parseEthAmountToWei('0.0000000000000000001')).toThrow();
    expect(() => parseEthAmountToWei('0')).toThrow();
    expect(() => parseEthAmountToWei('-1')).toThrow();
  });

  test('accepts a Bitcoin testnet address and rejects a mainnet one', () => {
    expect(assertBitcoinTestnetAddress('tb1q6rz28mcfaxtmd6v789l9rrlrusdprr9pqcpvkl')).toBeTruthy();
    expect(() => assertBitcoinTestnetAddress('bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu')).toThrow(/testnet/i);
    expect(() => assertBitcoinTestnetAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toThrow();
    expect(() => assertBitcoinTestnetAddress('')).toThrow();
    expect(() => assertBitcoinTestnetAddress('not-an-address')).toThrow();
  });

  test('EVM addresses: checksum enforced when mixed case, lowercase accepted and normalised', () => {
    const good = '0x9858EfFD232B4033E47d90003D41EC34EcaEda94';
    expect(assertEvmAddress(good)).toBe(good);
    expect(assertEvmAddress(good.toLowerCase())).toBe(good);
    const badChecksum = '0x9858efFD232B4033E47d90003D41EC34EcaEda94'; // one letter case flipped
    expect(() => assertEvmAddress(badChecksum)).toThrow();
    expect(() => assertEvmAddress('0x123')).toThrow();
    expect(() => assertEvmAddress('')).toThrow();
  });
});
