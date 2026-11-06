/**
 * Runtime setup for the wallet engine on native. Import this FIRST in index.ts.
 * Hermes has no global Buffer; the Bitcoin libraries expect one.
 */
import { Buffer } from 'buffer';

const g = globalThis as unknown as { Buffer?: typeof Buffer };
if (typeof g.Buffer === 'undefined') {
  g.Buffer = Buffer;
}
