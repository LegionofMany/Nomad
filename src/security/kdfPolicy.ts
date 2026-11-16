/**
 * Key-stretching policy.
 *
 * Normal builds always use the full iteration counts. A TESTNET-ONLY fast mode exists so the
 * app can be tried in Expo Go, where key stretching runs in slow plain JavaScript. It is
 * switched on only by mobile/polyfills.ts when EXPO_PUBLIC_NOMAD_TESTNET_FAST_KDF=1.
 * Wallets made in fast mode store their low iteration count, and a normal build refuses
 * to open them (fail closed). Never ship a release build with this switched on.
 */
export const TESTNET_FAST_KDF_ITERATIONS = 3_000;
export const TESTNET_FAST_KDF_MINIMUM = 1_000;

let fastMode = false;

export function enableTestnetFastKdf(): void {
  fastMode = true;
}

export function isTestnetFastKdf(): boolean {
  return fastMode;
}

/** Iterations to use when creating something new. */
export function kdfIterations(normal: number): number {
  return fastMode ? TESTNET_FAST_KDF_ITERATIONS : normal;
}

/** Lowest iteration count accepted when opening something stored. */
export function kdfMinAccepted(normal: number): number {
  return fastMode ? TESTNET_FAST_KDF_MINIMUM : normal;
}
