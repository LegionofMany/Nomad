import { Mnemonic, Wallet, getBytes } from 'ethers';
import { NomadWalletEngine } from '../../engine/NomadWalletEngine';
import type { ApprovalGate, EvmChainProvider, SessionAuthority, TransactionReview } from '../../engine/types';
import {
  NomadConnect,
  buildAttestationMessage,
  buildCallbackUrl,
  createMemoryAttestationStore,
  decodeConnectLink,
  encodeConnectLink,
  verifyPresentation,
  verifySignIn,
} from '../index';
import type { ConnectRegistry, ConnectReview, ConnectResponse, SignedAttestation } from '../index';

const PHRASE = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const KNOWN_EVM_ADDR = '0x9858EfFD232B4033E47d90003D41EC34EcaEda94';
const OTHER_EVM = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const NOW = new Date('2026-11-22T10:00:00.000Z');
const iso = (offsetMs: number) => new Date(NOW.getTime() + offsetMs).toISOString();

const ZONYCS = 'http://localhost:3001';
const issuerKey = Wallet.createRandom();

const registry: ConnectRegistry = {
  apps: [
    { id: 'zonycs', name: 'Zonycs', origins: [ZONYCS], allowedKinds: ['signin', 'pay', 'read', 'prove'], callbackPath: '/nomad/callback' },
    { id: 'syaxio', name: 'Syaxio', origins: ['http://localhost:3003'], allowedKinds: ['signin'], callbackPath: '/nomad/callback' },
  ],
  issuers: [{ id: 'reqrium', name: 'Reqrium', address: issuerKey.address }],
};

let counter = 0;
const token = (p: string) => `${p}${String(++counter).padStart(20, '0')}`;

const request = (over: Record<string, unknown> = {}) => ({
  v: 1,
  id: token('req'),
  nonce: token('non'),
  kind: 'signin',
  app: { id: 'zonycs', origin: ZONYCS },
  issuedAt: iso(-1000),
  expiresAt: iso(5 * 60 * 1000),
  ...over,
});

function setup(opts: { unlocked?: boolean; connectYes?: boolean; payYes?: boolean } = {}) {
  const state = {
    unlocked: opts.unlocked ?? true,
    connectYes: opts.connectYes ?? true,
    payYes: opts.payYes ?? true,
    signCalls: 0,
    reviews: [] as ConnectReview[],
    payReviews: [] as TransactionReview[],
  };
  const session: SessionAuthority = {
    hasWallet: async () => true,
    isUnlocked: async () => state.unlocked,
    getSeed: async () => getBytes(Mnemonic.fromPhrase(PHRASE).computeSeed()),
    lock: async () => {
      state.unlocked = false;
    },
  };
  const approval: ApprovalGate = {
    requestApproval: async (r) => {
      state.payReviews.push(r);
      return state.payYes;
    },
  };
  const evm: EvmChainProvider = {
    getBalance: async () => 10n ** 18n,
    getNonce: async () => 1,
    getFeeData: async () => ({ maxFeePerGas: 20_000_000_000n, maxPriorityFeePerGas: 1_000_000_000n }),
    estimateGas: async () => 21_000n,
    broadcast: async () => '0x' + 'ab'.repeat(32),
  };
  const engine = new NomadWalletEngine({ session, approval, evm });
  const original = engine.signConnectMessage.bind(engine);
  engine.signConnectMessage = async (m: string) => {
    state.signCalls++;
    return original(m);
  };
  const connect = new NomadConnect({
    wallet: engine,
    registry,
    now: () => NOW,
    store: createMemoryAttestationStore(),
    gate: {
      request: async (r) => {
        state.reviews.push(r);
        return state.connectYes;
      },
    },
  });
  return { state, engine, connect };
}

const error = (r: ConnectResponse) => (r.status === 'error' ? r.code : 'approved');

describe('sign in', () => {
  test('signs a message the app backend can verify', async () => {
    const { connect } = setup();
    const req = request();
    const res = await connect.handle(req);
    expect(res.status).toBe('approved');
    if (res.status !== 'approved' || res.kind !== 'signin') throw new Error('unexpected');
    expect(res.address).toBe(KNOWN_EVM_ADDR);
    expect(res.id).toBe(req.id);
    expect(res.nonce).toBe(req.nonce);
    expect(verifySignIn(res.message, res.signature, res.address)).toBe(true);
    expect(res.message).toContain(`Nonce: ${req.nonce}`);
    expect(res.message).toContain(ZONYCS);
  });

  test('a signature for another wallet or message does not verify', async () => {
    const { connect } = setup();
    const res = await connect.handle(request());
    if (res.status !== 'approved' || res.kind !== 'signin') throw new Error('unexpected');
    expect(verifySignIn(res.message, res.signature, OTHER_EVM)).toBe(false);
    expect(verifySignIn(res.message + ' ', res.signature, res.address)).toBe(false);
  });

  test('declining signs nothing', async () => {
    const { connect, state } = setup({ connectYes: false });
    const res = await connect.handle(request());
    expect(error(res)).toBe('declined');
    expect(state.signCalls).toBe(0);
  });

  test('the owner sees which app is asking', async () => {
    const { connect, state } = setup();
    await connect.handle(request());
    expect(state.reviews[0]).toMatchObject({ appName: 'Zonycs', origin: ZONYCS, kind: 'signin' });
  });

  test('a locked wallet answers wallet_locked and signs nothing', async () => {
    const { connect, state } = setup({ unlocked: false });
    expect(error(await connect.handle(request()))).toBe('wallet_locked');
    expect(state.signCalls).toBe(0);
  });
});

describe('who may ask', () => {
  test('unknown app is refused before the owner is asked', async () => {
    const { connect, state } = setup();
    const res = await connect.handle(request({ app: { id: 'evilshop', origin: 'https://evil.example' } }));
    expect(error(res)).toBe('unknown_app');
    expect(state.reviews).toHaveLength(0);
  });

  test('a look-alike origin using a real app name is refused', async () => {
    const { connect, state } = setup();
    const res = await connect.handle(request({ app: { id: 'zonycs', origin: 'https://zonycs-login.example' } }));
    expect(error(res)).toBe('origin_mismatch');
    expect(state.reviews).toHaveLength(0);
  });

  test('plain http is refused except for localhost', async () => {
    const { connect } = setup();
    const res = await connect.handle(request({ app: { id: 'zonycs', origin: 'http://zonycs.example' } }));
    expect(error(res)).toBe('origin_mismatch');
  });

  test('an app cannot make a kind of request it is not allowed to make', async () => {
    const { connect } = setup();
    const res = await connect.handle(
      request({ kind: 'pay', app: { id: 'syaxio', origin: 'http://localhost:3003' }, chainId: 'evm-sepolia', assetSymbol: 'SepoliaETH', toAddress: OTHER_EVM, amount: '0.01' })
    );
    expect(error(res)).toBe('kind_not_allowed');
  });

  test('the same request cannot be used twice', async () => {
    const { connect } = setup();
    const req = request();
    expect((await connect.handle(req)).status).toBe('approved');
    expect(error(await connect.handle(req))).toBe('replayed');
  });
});

describe('request checks', () => {
  test.each([
    ['expired', { issuedAt: iso(-600_000), expiresAt: iso(-1000) }, 'expired'],
    ['valid for too long', { issuedAt: iso(0), expiresAt: iso(11 * 60 * 1000) }, 'invalid_request'],
    ['dated in the future', { issuedAt: iso(5 * 60 * 1000), expiresAt: iso(8 * 60 * 1000) }, 'invalid_request'],
    ['ends before it starts', { issuedAt: iso(0), expiresAt: iso(-5000) }, 'invalid_request'],
    ['wrong version', { v: 2 }, 'invalid_request'],
    ['unknown kind', { kind: 'drain' }, 'invalid_request'],
    ['short nonce', { nonce: 'abc' }, 'invalid_request'],
    ['hidden text direction characters', { statement: 'Hello ‮ evil' }, 'invalid_request'],
    ['non-ISO time', { issuedAt: 'yesterday' }, 'invalid_request'],
  ])('%s is refused', async (_name, over, code) => {
    const { connect, state } = setup();
    expect(error(await connect.handle(request(over)))).toBe(code);
    expect(state.reviews).toHaveLength(0);
  });

  test('garbage and oversized input never throw', async () => {
    const { connect } = setup();
    for (const input of [null, undefined, 42, 'not json', '{}', [], 'x'.repeat(10_000)]) {
      expect(error(await connect.handle(input))).toBe('invalid_request');
    }
  });

  test('pay amounts must be positive plain numbers', async () => {
    const { connect } = setup();
    const base = { kind: 'pay', chainId: 'evm-sepolia', assetSymbol: 'SepoliaETH', toAddress: OTHER_EVM };
    for (const amount of ['-1', '0', '1e18', 'abc', '']) {
      expect(error(await connect.handle(request({ ...base, amount })))).toBe('invalid_request');
    }
  });
});

describe('pay', () => {
  const pay = (over: Record<string, unknown> = {}) =>
    request({ kind: 'pay', chainId: 'evm-sepolia', assetSymbol: 'SepoliaETH', toAddress: OTHER_EVM, amount: '0.01', orderRef: 'ORDER-17', ...over });

  test('goes through the engine approval screen and names the app in the memo', async () => {
    const { connect, state } = setup();
    const res = await connect.handle(pay());
    expect(res.status).toBe('approved');
    if (res.status !== 'approved' || res.kind !== 'pay') throw new Error('unexpected');
    expect(res.txHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(state.payReviews[0]).toMatchObject({ toAddress: OTHER_EVM, amount: '0.01' });
    expect(state.payReviews[0].memo).toContain('Zonycs');
    expect(state.payReviews[0].memo).toContain('ORDER-17');
  });

  test('declining the payment screen sends nothing', async () => {
    const { connect } = setup({ payYes: false });
    expect(error(await connect.handle(pay()))).toBe('declined');
  });

  test('mainnet is refused by the engine', async () => {
    const { connect } = setup();
    const res = await connect.handle(pay({ chainId: 'ethereum' }));
    expect(error(res)).toBe('failed');
  });
});

describe('prove (Reqrium verification)', () => {
  const attest = async (over: Partial<SignedAttestation['attestation']> = {}, signer: { signMessage(m: string): Promise<string> } = issuerKey): Promise<SignedAttestation> => {
    const attestation = { v: 1 as const, issuer: 'reqrium', subject: KNOWN_EVM_ADDR, claim: 'verified_person' as const, issuedAt: iso(-86_400_000), expiresAt: iso(86_400_000), ...over };
    return { attestation, signature: await signer.signMessage(buildAttestationMessage(attestation)) };
  };
  const proveReq = (over: Record<string, unknown> = {}) => request({ kind: 'prove', claim: 'verified_person', ...over });

  test('presents a claim the app can verify, with no documents in the answer', async () => {
    const { connect } = setup();
    await connect.addAttestation(await attest());
    const req = proveReq();
    const res = await connect.handle(req);
    if (res.status !== 'approved' || res.kind !== 'prove') throw new Error(JSON.stringify(res));
    expect(
      verifyPresentation({ signed: res.attestation, presentation: res.presentation, origin: ZONYCS, nonce: req.nonce, requestId: req.id, issuerAddress: issuerKey.address, now: NOW })
    ).toBe(true);
    expect(Object.keys(res.attestation.attestation).sort()).toEqual(['claim', 'expiresAt', 'issuedAt', 'issuer', 'subject', 'v']);
  });

  test('a presentation cannot be replayed to a different app or request', async () => {
    const { connect } = setup();
    await connect.addAttestation(await attest());
    const req = proveReq();
    const res = await connect.handle(req);
    if (res.status !== 'approved' || res.kind !== 'prove') throw new Error('unexpected');
    const base = { signed: res.attestation, presentation: res.presentation, issuerAddress: issuerKey.address, now: NOW };
    expect(verifyPresentation({ ...base, origin: 'https://other.example', nonce: req.nonce, requestId: req.id })).toBe(false);
    expect(verifyPresentation({ ...base, origin: ZONYCS, nonce: token('non'), requestId: req.id })).toBe(false);
  });

  test('refuses an attestation signed by someone other than Reqrium', async () => {
    const { connect } = setup();
    await expect(connect.addAttestation(await attest({}, Wallet.createRandom()))).rejects.toThrow();
  });

  test('refuses an attestation about a different wallet', async () => {
    const { connect } = setup();
    await expect(connect.addAttestation(await attest({ subject: OTHER_EVM }))).rejects.toThrow(/different wallet/);
  });

  test('refuses an expired attestation', async () => {
    const { connect } = setup();
    await expect(connect.addAttestation(await attest({ expiresAt: iso(-1000) }))).rejects.toThrow();
  });

  test('answers no_attestation when the wallet holds nothing', async () => {
    const { connect, state } = setup();
    expect(error(await connect.handle(proveReq()))).toBe('no_attestation');
    expect(state.reviews).toHaveLength(0);
  });

  test('declining shares nothing', async () => {
    const { connect, state } = setup({ connectYes: false });
    await connect.addAttestation(await attest());
    expect(error(await connect.handle(proveReq()))).toBe('declined');
    expect(state.signCalls).toBe(0);
  });
});

describe('read', () => {
  test('shares public addresses only', async () => {
    const { connect } = setup();
    const res = await connect.handle(request({ kind: 'read', scopes: ['addresses'] }));
    if (res.status !== 'approved' || res.kind !== 'read') throw new Error('unexpected');
    expect(res.addresses.find((a) => a.chainId === 'evm-sepolia')?.address).toBe(KNOWN_EVM_ADDR);
    const text = JSON.stringify(res).toLowerCase();
    expect(text).not.toContain('privatekey');
    expect(text).not.toContain('seed');
  });

  test('other scopes are refused', async () => {
    const { connect } = setup();
    expect(error(await connect.handle(request({ kind: 'read', scopes: ['addresses', 'keys'] })))).toBe('invalid_request');
  });

  test('declining shares nothing', async () => {
    const { connect } = setup({ connectYes: false });
    expect(error(await connect.handle(request({ kind: 'read', scopes: ['addresses'] })))).toBe('declined');
  });
});

describe('links and callbacks', () => {
  test('a request survives a round trip through a nomad:// link', () => {
    const req = request();
    const link = encodeConnectLink(req as any);
    expect(link.startsWith('nomad://connect?r=')).toBe(true);
    expect(JSON.parse(decodeConnectLink(link))).toEqual(req);
  });

  test('damaged or foreign links are refused', () => {
    expect(() => decodeConnectLink('https://evil.example')).toThrow();
    expect(() => decodeConnectLink('nomad://connect?r=%%%')).toThrow();
  });

  test('the answer is only sent to the registered address', async () => {
    const { connect } = setup();
    const res = await connect.handle(request());
    const url = buildCallbackUrl(registry, 'zonycs', ZONYCS, res);
    expect(url?.startsWith(`${ZONYCS}/nomad/callback#r=`)).toBe(true);
    expect(buildCallbackUrl(registry, 'zonycs', 'https://evil.example', res)).toBeNull();
    expect(buildCallbackUrl(registry, 'nobody', ZONYCS, res)).toBeNull();
  });
});
