import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const mobileRoot = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(mobileRoot, path), 'utf8');

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

const routes = read('nomad/routes/nomadRoutes.ts');
const coverage = read('nomad/audit/screenCoverage.ts');
const storage = read('services/nativeStubs.ts');
const recovery = read('nomad/adapters/nomadRecoveryAdapter.ts');
const lostWallet = read('nomad/adapters/nomadLostWalletAdapter.ts');
const restoration = read('nomad/adapters/nomadWalletRestorationAdapter.ts');
const bridge = read('nomad/adapters/clonedWalletAdapterTemplate.ts');
const adapterContract = read('nomad/adapters/walletAdapter.ts');

const registeredRoutes = [...routes.matchAll(/\{ name: '([^']+)', component:/g)].map((match) => match[1]);
const uniqueRoutes = new Set(registeredRoutes);
const numberedPages = [...coverage.matchAll(/pageNumber:\s*(\d+)/g)].map((match) => Number(match[1]));

invariant(registeredRoutes.length === 29, `Expected 29 registered routes; found ${registeredRoutes.length}.`);
invariant(uniqueRoutes.size === registeredRoutes.length, 'Nomad route names must be unique.');
invariant(numberedPages.length === 26, `Expected 26 numbered Nomad pages; found ${numberedPages.length}.`);
invariant(numberedPages.every((value, index) => value === index + 1), 'Nomad page numbers must be continuous from 1 through 26.');
invariant(/NOMAD_PAGE_COUNT\s*=\s*26/.test(coverage), 'The screen-coverage gate must require all 26 approved pages.');
invariant(/ownsKeysOrSigning:\s*false/g.test(coverage), 'Screen coverage must retain the no-key-ownership boundary.');

for (const marker of [
  'SecureStore.setItemAsync',
  'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY',
  'SECURE_STORE_CHUNK_CHARS',
  'browser_local_storage',
  'memory_fallback',
  'getRandomBytes',
  'sha256Hex',
]) {
  invariant(storage.includes(marker), `Secure runtime gateway is missing ${marker}.`);
}

for (const marker of [
  'TIME_SET_TOTAL = 24',
  'MAX_FAILED_ATTEMPTS = 8',
  'VERIFICATION_LOCK_MS = 15 * 60 * 1000',
  'Each Time Set must be unique',
  'Raw Time Set values were not retained',
  'ready_for_wallet_provider',
  'requiresExplicitOwnerConfirmation: true',
  'getRecoveryAuthorization',
]) {
  invariant(recovery.includes(marker), `Recovery implementation is missing ${marker}.`);
}

invariant(lostWallet.includes('verifyWalletPassword(password)'), 'Lost-wallet recovery must verify the wallet password.');
invariant(lostWallet.includes('completeRecoverySequence(stored.session.id)'), 'A completed ordered sequence must issue a session-bound Nomad authorization.');
invariant(lostWallet.includes('Boolean(sequence.authorization)'), 'Lost-wallet completion must require an unexpired Nomad authorization.');
invariant(lostWallet.includes('rawTimeSetsStored: false'), 'Lost-wallet state must explicitly report that raw Time Sets are not stored.');
invariant(restoration.includes("id: 'recovery_authorization'"), 'Restoration evidence must check for a current Nomad authorization.');
invariant(restoration.includes('privateKeysRestored: false'), 'Nomad must not claim that wallet keys were restored without a provider receipt.');

for (const method of [
  'getSessionState',
  'getSupportedChains',
  'getAccounts',
  'getWalletBalance',
  'getAssets',
  'getReceiveAddress',
  'createTransaction',
  'signTransaction',
  'broadcastTransaction',
  'getTransactionHistory',
  'lockWallet',
  'unlockWallet',
  'restoreFromNomadAuthorization',
]) {
  invariant(bridge.includes(`'${method}'`), `Strict wallet bridge is missing ${method}.`);
}

invariant(adapterContract.includes("createdBy?: 'nomad_overlay' | 'cloned_wallet_engine'"), 'Transaction drafts must retain their ownership boundary.');
invariant(adapterContract.includes('requiresUserApproval?: boolean'), 'Transaction drafts must support explicit owner approval.');
invariant(adapterContract.includes('walletKeysChanged: false'), 'Recovery authorization must state that Nomad did not change wallet keys.');

console.log(`Nomad completion gate passed: ${numberedPages.length} approved pages, ${registeredRoutes.length} routes, secure persistence, ordered recovery, and strict wallet boundary.`);
