type Cell = boolean | null;

// Version 6-H fits a Bitcoin payment URI while preserving enough recovery
// capacity for the separate Nomad mark that is overlaid by the receive screen.
const VERSION = 6;
const MODULE_COUNT = 17 + VERSION * 4;
const DATA_CODEWORDS = 60;
const DATA_CODEWORDS_PER_BLOCK = 15;
const ERROR_CODEWORDS_PER_BLOCK = 28;
const BLOCK_COUNT = 4;

function multiplyGF(a: number, b: number) {
  let result = 0;
  let x = a;
  let y = b;
  while (y > 0) {
    if (y & 1) result ^= x;
    y >>>= 1;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  return result;
}

function polynomialMultiply(left: number[], right: number[]) {
  const result = Array(left.length + right.length - 1).fill(0);
  for (let i = 0; i < left.length; i += 1) {
    for (let j = 0; j < right.length; j += 1) {
      result[i + j] ^= multiplyGF(left[i], right[j]);
    }
  }
  return result;
}

function generatorPolynomial(degree: number) {
  let polynomial = [1];
  let value = 1;
  for (let i = 0; i < degree; i += 1) {
    polynomial = polynomialMultiply(polynomial, [1, value]);
    value = multiplyGF(value, 2);
  }
  return polynomial;
}

function reedSolomon(data: number[], degree: number) {
  const generator = generatorPolynomial(degree);
  const message = [...data, ...Array(degree).fill(0)];
  for (let i = 0; i < data.length; i += 1) {
    const factor = message[i];
    if (!factor) continue;
    for (let j = 0; j < generator.length; j += 1) {
      message[i + j] ^= multiplyGF(generator[j], factor);
    }
  }
  return message.slice(data.length);
}

function appendBits(target: number[], value: number, length: number) {
  for (let bit = length - 1; bit >= 0; bit -= 1) target.push((value >>> bit) & 1);
}

function payloadBytes(payload: string) {
  return Array.from(payload).map((character) => character.charCodeAt(0) & 0xff);
}

function createCodewords(payload: string) {
  const bytes = payloadBytes(payload);
  if (bytes.length > 58) throw new Error('Nomad QR payload is too long for the high-recovery receive-code format.');

  const bits: number[] = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);
  bytes.forEach((byte) => appendBits(bits, byte, 8));

  const capacity = DATA_CODEWORDS * 8;
  appendBits(bits, 0, Math.min(4, capacity - bits.length));
  while (bits.length % 8) bits.push(0);

  const data: number[] = [];
  for (let offset = 0; offset < bits.length; offset += 8) {
    let byte = 0;
    for (let index = 0; index < 8; index += 1) byte = (byte << 1) | bits[offset + index];
    data.push(byte);
  }

  let pad = true;
  while (data.length < DATA_CODEWORDS) {
    data.push(pad ? 0xec : 0x11);
    pad = !pad;
  }

  const blocks = Array.from({ length: BLOCK_COUNT }, (_, index) =>
    data.slice(index * DATA_CODEWORDS_PER_BLOCK, (index + 1) * DATA_CODEWORDS_PER_BLOCK),
  );
  const errorBlocks = blocks.map((block) => reedSolomon(block, ERROR_CODEWORDS_PER_BLOCK));
  const interleaved: number[] = [];

  for (let index = 0; index < DATA_CODEWORDS_PER_BLOCK; index += 1) {
    blocks.forEach((block) => interleaved.push(block[index]));
  }
  for (let index = 0; index < ERROR_CODEWORDS_PER_BLOCK; index += 1) {
    errorBlocks.forEach((block) => interleaved.push(block[index]));
  }

  return interleaved;
}

function createMatrix() {
  return Array.from({ length: MODULE_COUNT }, () => Array<Cell>(MODULE_COUNT).fill(null));
}

function setFinder(matrix: Cell[][], row: number, column: number) {
  for (let dy = -1; dy <= 7; dy += 1) {
    for (let dx = -1; dx <= 7; dx += 1) {
      const y = row + dy;
      const x = column + dx;
      if (y < 0 || y >= MODULE_COUNT || x < 0 || x >= MODULE_COUNT) continue;
      const inside = dy >= 0 && dy <= 6 && dx >= 0 && dx <= 6;
      const black = inside && (dy === 0 || dy === 6 || dx === 0 || dx === 6 || (dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4));
      matrix[y][x] = black;
    }
  }
}

function setAlignment(matrix: Cell[][], centerRow: number, centerColumn: number) {
  if (matrix[centerRow][centerColumn] !== null) return;
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      matrix[centerRow + dy][centerColumn + dx] = Math.max(Math.abs(dx), Math.abs(dy)) !== 1;
    }
  }
}

function reserveFormat(matrix: Cell[][]) {
  for (let index = 0; index < 9; index += 1) {
    if (matrix[8][index] === null) matrix[8][index] = false;
    if (matrix[index][8] === null) matrix[index][8] = false;
  }
  for (let index = 0; index < 8; index += 1) {
    if (matrix[MODULE_COUNT - 1 - index][8] === null) matrix[MODULE_COUNT - 1 - index][8] = false;
    if (matrix[8][MODULE_COUNT - 1 - index] === null) matrix[8][MODULE_COUNT - 1 - index] = false;
  }
}

function formatBits(maskPattern: number) {
  // QR format-level bits: H = 10.
  const formatData = (0b10 << 3) | maskPattern;
  let value = formatData << 10;
  const generator = 0x537;
  const bitLength = (input: number) => {
    let length = 0;
    let next = input;
    while (next) {
      length += 1;
      next >>>= 1;
    }
    return length;
  };
  while (bitLength(value) >= bitLength(generator)) {
    value ^= generator << (bitLength(value) - bitLength(generator));
  }
  return ((formatData << 10) | value) ^ 0x5412;
}

function writeFormat(matrix: Cell[][], maskPattern: number) {
  const bits = formatBits(maskPattern);
  const get = (index: number) => ((bits >>> index) & 1) === 1;

  for (let index = 0; index < 15; index += 1) {
    const verticalRow = index < 6 ? index : index < 8 ? index + 1 : MODULE_COUNT - 15 + index;
    matrix[verticalRow][8] = get(index);

    const horizontalColumn = index < 8 ? MODULE_COUNT - index - 1 : index < 9 ? 15 - index : 14 - index;
    matrix[8][horizontalColumn] = get(index);
  }
  matrix[MODULE_COUNT - 8][8] = true;
}

function maskZero(row: number, column: number) {
  return (row + column) % 2 === 0;
}

function mapData(matrix: Cell[][], codewords: number[]) {
  const bits: number[] = [];
  codewords.forEach((byte) => appendBits(bits, byte, 8));
  let bitIndex = 0;
  let upward = true;

  for (let right = MODULE_COUNT - 1; right > 0; right -= 2) {
    if (right === 6) right -= 1;
    for (let step = 0; step < MODULE_COUNT; step += 1) {
      const row = upward ? MODULE_COUNT - 1 - step : step;
      for (let offset = 0; offset < 2; offset += 1) {
        const column = right - offset;
        if (matrix[row][column] !== null) continue;
        const source = bitIndex < bits.length ? bits[bitIndex] === 1 : false;
        matrix[row][column] = maskZero(row, column) ? !source : source;
        bitIndex += 1;
      }
    }
    upward = !upward;
  }
}

export function encodeNomadQRMatrix(payload: string) {
  const matrix = createMatrix();
  setFinder(matrix, 0, 0);
  setFinder(matrix, 0, MODULE_COUNT - 7);
  setFinder(matrix, MODULE_COUNT - 7, 0);

  for (let index = 8; index < MODULE_COUNT - 8; index += 1) {
    if (matrix[6][index] === null) matrix[6][index] = index % 2 === 0;
    if (matrix[index][6] === null) matrix[index][6] = index % 2 === 0;
  }

  [6, 34].forEach((row) => [6, 34].forEach((column) => setAlignment(matrix, row, column)));
  reserveFormat(matrix);
  mapData(matrix, createCodewords(payload));
  writeFormat(matrix, 0);
  return matrix as boolean[][];
}
