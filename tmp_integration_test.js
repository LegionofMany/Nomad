const tryRequire = (p) => { try { return require(p); } catch (e) { return null; } };

const seedMod = tryRequire('./dist/chains/wallet-core/seed.js') || tryRequire('./dist/wallet-core/seed.js') || tryRequire('./dist/wallet-core/seed');
const encryptMod = tryRequire('./dist/chains/wallet-core/encrypt.js') || tryRequire('./dist/wallet-core/encrypt.js') || tryRequire('./dist/wallet-core/encrypt');
const clockMod = tryRequire('./dist/security/clock.js') || tryRequire('./dist/security/clock');
const SecureVaultMod = tryRequire('./dist/security/secureVault.js') || tryRequire('./dist/security/secureVault');
const LockoutMod = tryRequire('./dist/security/lockout.js') || tryRequire('./dist/security/lockout');

if (!seedMod || !encryptMod || !clockMod || !SecureVaultMod) {
  console.error('required modules not found:', { seed: !!seedMod, encrypt: !!encryptMod, clock: !!clockMod, vault: !!SecureVaultMod });
  process.exit(2);
}

const { generateMnemonic, mnemonicToSeed } = seedMod;
const { encryptSeed } = encryptMod;
const { deriveDailyUnlockSecret, getActiveUnlockSecret } = clockMod;
const SecureVault = SecureVaultMod.default || SecureVaultMod.SecureVault || SecureVaultMod;
const LockoutManager = (LockoutMod && (LockoutMod.LockoutManager || LockoutMod.default)) || null;

(async () => {
  try {
    const mnemonic = generateMnemonic();
    const seed = mnemonicToSeed(mnemonic);
    const masterSecret = 'test-master-secret-1234';
    const now = new Date();
    const cfg = { hour: now.getHours(), minute: now.getMinutes(), toleranceMinutes: 5 };

    // Derive secret for current day/time (do NOT log it)
    const derived = deriveDailyUnlockSecret(masterSecret, cfg, now);

    const blob = encryptSeed(seed, derived);

    const lockout = LockoutManager ? new (LockoutManager)() : undefined;
    const vault = new SecureVault(blob, lockout ? { lockout } : undefined);

    // 1) Correct time -> should succeed
    const ok = await vault.unlockWithClock(masterSecret, cfg, now);
    console.log('1) Correct-time unlock:', ok.success ? 'PASS' : `FAIL (${ok.reason})`);

    // 2) Not-in-window -> use a time outside tolerance on same day
    const notInWindow = new Date(now.getTime() + (cfg.toleranceMinutes + 10) * 60 * 1000);
    const out = await vault.unlockWithClock(masterSecret, cfg, notInWindow);
    console.log('2) Not-in-window behavior:', out.reason === 'not_in_window' ? 'PASS' : `EXPECTED not_in_window, GOT ${out.reason}`);

    // 3) Wrong-day (previous day) -> decrypt should fail and count as failure
    const prevDay = new Date(now.getTime() - 24 * 3600 * 1000);
    const prevRes = await vault.unlockWithClock(masterSecret, cfg, prevDay);
    console.log('3) Wrong-day decrypt fails:', prevRes.success ? 'FAIL' : `PASS (${prevRes.reason})`);

    // 4) Trigger multiple failures to cause a temporary lock
    const f1 = await vault.unlockWithSecret('wrong1');
    const f2 = await vault.unlockWithSecret('wrong2');
    const lockedNow = vault.isLocked();
    console.log('4) Multiple failures -> locked:', lockedNow ? 'PASS' : 'FAIL');

    // 5) Recovery flow: simulate permanent lock then clear via successful recovery verification
    // Build simple positions and registry, then verify by derivation
    const positions = Array.from({ length: 24 }, (_, i) => ({ hour: 0, minute: 0 }));
    const recoveryMod = require('./dist/security/recovery.js');
    const { buildRecoveryRegistry, verifyByDerivation } = recoveryMod;
    const registry = buildRecoveryRegistry(masterSecret, positions, now);
    const verify = verifyByDerivation(masterSecret, positions, registry, now);
    console.log('5a) Recovery verify (local derivation):', verify.success ? 'PASS' : 'FAIL');

    // Mark permanent lock and then clear it to simulate recovery
    vault.lock();
    const wasLocked = vault.isLocked();
    vault.clearPermanentLock();
    const cleared = !vault.isLocked();
    console.log('5b) Permanent lock cleared by recovery:', wasLocked && cleared ? 'PASS' : 'FAIL');

    process.exit(0);
  } catch (e) {
    console.error('error', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
