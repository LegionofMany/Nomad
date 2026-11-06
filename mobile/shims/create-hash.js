/**
 * Native (Hermes) replacement for the `create-hash` package, which needs Node's
 * `stream` module. Built on audited @noble/hashes (already used by ethers).
 * Metro maps `create-hash` here on Android/iOS only; see metro.config.js.
 */
const { sha1 } = require('@noble/hashes/sha1');
const { sha256 } = require('@noble/hashes/sha256');
const { sha512 } = require('@noble/hashes/sha512');
const { ripemd160 } = require('@noble/hashes/ripemd160');
const { Buffer } = require('buffer');

const ALGORITHMS = { sha1, sha256, sha512, ripemd160, rmd160: ripemd160 };

function createHash(algorithm) {
  const fn = ALGORITHMS[String(algorithm).toLowerCase()];
  if (!fn) throw new Error('Unsupported hash algorithm: ' + algorithm);
  const chunks = [];
  return {
    update(data, encoding) {
      chunks.push(typeof data === 'string' ? Buffer.from(data, encoding || 'utf8') : Buffer.from(data));
      return this;
    },
    digest(encoding) {
      const out = Buffer.from(fn(Buffer.concat(chunks)));
      return encoding ? out.toString(encoding) : out;
    },
  };
}

module.exports = createHash;
module.exports.default = createHash;
