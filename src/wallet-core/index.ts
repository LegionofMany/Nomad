/**
 * wallet-core `index.ts` (moved into repo `src/wallet-core`)
 * Re-exports wallet-core modules for use within the monorepo root.
 */

export * from "./seed";
export { deriveBtcAccount } from "./derive";
export { deriveEvmAccount } from "./deriveEvm";
export * from "./encrypt";
