/* The phone uses small @noble/hashes shims instead of create-hash / create-hmac.
   They must give byte-identical results to the real libraries. */
/* eslint-disable @typescript-eslint/no-var-requires */
const realHash = require('create-hash');
const realHmac = require('create-hmac');
const shimHash = require('../../../mobile/shims/create-hash');
const shimHmac = require('../../../mobile/shims/create-hmac');

const inputs = [Buffer.alloc(0), Buffer.from('abc'), Buffer.alloc(1000, 7), Buffer.from('héllo wörld', 'utf8')];

describe('native hashing shims match the real libraries', () => {
  for (const alg of ['sha1', 'sha256', 'sha512', 'ripemd160']) {
    test(`create-hash ${alg}`, () => {
      for (const data of inputs) {
        expect(shimHash(alg).update(data).digest('hex')).toBe(realHash(alg).update(data).digest('hex'));
      }
    });
  }

  test('create-hash supports chunked update, string input and Buffer output', () => {
    const a = shimHash('sha256').update('he').update('llo').digest();
    const b = realHash('sha256').update('hello').digest();
    expect(Buffer.isBuffer(a)).toBe(true);
    expect(a.equals(b)).toBe(true);
    expect(shimHash('sha256').update('68656c6c6f', 'hex').digest('hex')).toBe(realHash('sha256').update('hello').digest('hex'));
  });

  for (const alg of ['sha256', 'sha512']) {
    test(`create-hmac ${alg}`, () => {
      for (const data of inputs) {
        for (const key of [Buffer.from('key'), Buffer.alloc(200, 1)]) {
          expect(shimHmac(alg, key).update(data).digest('hex')).toBe(realHmac(alg, key).update(data).digest('hex'));
        }
      }
    });
  }

  test('unknown algorithms are rejected', () => {
    expect(() => shimHash('md5')).toThrow();
    expect(() => shimHmac('md5', 'k')).toThrow();
  });
});
