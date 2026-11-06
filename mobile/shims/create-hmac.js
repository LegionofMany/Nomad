/**
 * Native (Hermes) replacement for the `create-hmac` package.
 * Built on @noble/hashes. Mapped by metro.config.js on Android/iOS only.
 */
const { hmac } = require('@noble/hashes/hmac');
const { sha256 } = require('@noble/hashes/sha256');
const { sha512 } = require('@noble/hashes/sha512');
const { Buffer } = require('buffer');

const ALGORITHMS = { sha256, sha512 };

function createHmac(algorithm, key) {
  const fn = ALGORITHMS[String(algorithm).toLowerCase()];
  if (!fn) throw new Error('Unsupported HMAC algorithm: ' + algorithm);
  const keyBytes = typeof key === 'string' ? Buffer.from(key, 'utf8') : Buffer.from(key);
  const chunks = [];
  return {
    update(data, encoding) {
      chunks.push(typeof data === 'string' ? Buffer.from(data, encoding || 'utf8') : Buffer.from(data));
      return this;
    },
    digest(encoding) {
      const out = Buffer.from(hmac(fn, keyBytes, Buffer.concat(chunks)));
      return encoding ? out.toString(encoding) : out;
    },
  };
}

module.exports = createHmac;
module.exports.default = createHmac;
