import { generateMnemonic, mnemonicToSeed } from '../../wallet-core/seed';
import { deriveEvmAccount } from '../../wallet-core/deriveEvm';
import { deriveEvmKey, deriveBitcoinTestnetKey } from '../derive';
import { approvalGate, subscribeApprovals } from '../../../mobile/services/approvalBroker';
import type { PendingApproval } from '../../../mobile/services/approvalBroker';
import { clearSessionSeed, getSessionSeedCopy, holdSessionSeed, isSessionUnlocked } from '../../../mobile/services/sessionVault';
import type { TransactionReview } from '../types';

const review: TransactionReview = {
  chainId: 'bitcoin-testnet',
  fromAddress: 'tb1qfrom',
  toAddress: 'tb1qto',
  amount: '0.00030000',
  assetSymbol: 'tBTC',
  feeEstimate: '0.00000700',
  feeAssetSymbol: 'tBTC',
};

describe('engine matches the app existing wallet code', () => {
  test('same Ethereum address as wallet-core for fresh wallets', () => {
    for (let i = 0; i < 3; i++) {
      const mnemonic = generateMnemonic();
      const seed = mnemonicToSeed(mnemonic);
      expect(seed.length).toBe(64);
      expect(deriveEvmKey(seed, 0).address).toBe(deriveEvmAccount(mnemonic, 0).address);
    }
  });

  test('Bitcoin testnet address is deterministic for a seed', () => {
    const seed = mnemonicToSeed(generateMnemonic());
    expect(deriveBitcoinTestnetKey(seed, 0).address).toBe(deriveBitcoinTestnetKey(seed, 0).address);
    expect(deriveBitcoinTestnetKey(seed, 0).address.startsWith('tb1q')).toBe(true);
  });
});

describe('approval broker fails closed', () => {
  test('declines when no dialog is mounted', async () => {
    expect(await approvalGate.requestApproval(review)).toBe(false);
  });

  test('approves only when the dialog approves', async () => {
    let open: PendingApproval | null = null;
    const unsubscribe = subscribeApprovals((p) => {
      open = p;
    });
    const promise = approvalGate.requestApproval(review);
    expect(open!.review).toEqual(review);
    open!.resolve(true);
    expect(await promise).toBe(true);
    unsubscribe();
  });

  test('a second request while one is open is declined', async () => {
    let open: PendingApproval | null = null;
    const unsubscribe = subscribeApprovals((p) => {
      open = p;
    });
    const first = approvalGate.requestApproval(review);
    expect(await approvalGate.requestApproval(review)).toBe(false);
    open!.resolve(false);
    expect(await first).toBe(false);
    unsubscribe();
  });

  test('unmounting the dialog declines an open request', async () => {
    const unsubscribe = subscribeApprovals(() => undefined);
    const promise = approvalGate.requestApproval(review);
    unsubscribe();
    expect(await promise).toBe(false);
  });
});

describe('session vault keeps the seed in memory only while unlocked', () => {
  afterEach(() => clearSessionSeed());

  test('locked by default and refuses to hand out a seed', () => {
    expect(isSessionUnlocked()).toBe(false);
    expect(() => getSessionSeedCopy()).toThrow(/locked/i);
  });

  test('holds a private copy, wipes the caller array, and hands out independent copies', () => {
    const original = new Uint8Array([1, 2, 3, 4]);
    holdSessionSeed(original);
    expect(Array.from(original)).toEqual([0, 0, 0, 0]);
    expect(isSessionUnlocked()).toBe(true);
    const copy = getSessionSeedCopy();
    expect(Array.from(copy)).toEqual([1, 2, 3, 4]);
    copy.fill(9);
    expect(Array.from(getSessionSeedCopy())).toEqual([1, 2, 3, 4]);
  });

  test('clearing wipes and locks', () => {
    holdSessionSeed(new Uint8Array([5, 6]));
    clearSessionSeed();
    expect(isSessionUnlocked()).toBe(false);
    expect(() => getSessionSeedCopy()).toThrow();
  });
});
