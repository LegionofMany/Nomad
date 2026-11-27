import { Mnemonic, Signature, getBytes, verifyTypedData } from 'ethers';
import { NomadWalletEngine } from '../../engine/NomadWalletEngine';
import type { ApprovalGate, EvmChainProvider, SessionAuthority } from '../../engine/types';
import { NomadConnect, ZONYCS_TESTNET_BUY, createMemoryAttestationStore } from '../index';
import type { ConnectRegistry, ConnectReview, ConnectResponse } from '../index';

const PHRASE = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const WALLET = '0x9858EfFD232B4033E47d90003D41EC34EcaEda94';
const ATTACKER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const NOW = new Date('2026-11-27T12:00:00.000Z');
const NOW_SEC = Math.floor(NOW.getTime() / 1000);
const ORIGIN = 'https://www.zonycs.com';
const ORDER_HASH = '0x' + 'ab'.repeat(32);
const P = ZONYCS_TESTNET_BUY;

const registry: ConnectRegistry = {
  apps: [
    { id: 'zonycs', name: 'Zonycs', origins: [ORIGIN], allowedKinds: ['signin', 'buy'], callbackPath: '/sign-in/nomad', buy: P },
    { id: 'nobuy', name: 'NoBuy', origins: ['https://nobuy.example'], allowedKinds: ['signin', 'buy'], callbackPath: '/cb' },
    { id: 'syaxio', name: 'Syaxio', origins: ['https://syaxio.example'], allowedKinds: ['signin'], callbackPath: '/cb' },
  ],
  issuers: [],
};

let counter = 0;
const token = (p: string) => `${p}${String(++counter).padStart(20, '0')}`;

const buyRequest = (over: Record<string, unknown> = {}) => ({
  v: 1,
  id: token('req'),
  nonce: token('non'),
  kind: 'buy',
  app: { id: 'zonycs', origin: ORIGIN },
  issuedAt: new Date(NOW.getTime() - 1000).toISOString(),
  expiresAt: new Date(NOW.getTime() + 5 * 60 * 1000).toISOString(),
  chainId: 296,
  orderHash: ORDER_HASH,
  amount: '25000000',
  permitNonce: '3',
  deadline: NOW_SEC + 15 * 60,
  item: 'Used bicycle',
  ...over,
});

function setup(opts: { unlocked?: boolean; yes?: boolean } = {}) {
  const state = { unlocked: opts.unlocked ?? true, yes: opts.yes ?? true, signs: 0, reviews: [] as ConnectReview[] };
  const session: SessionAuthority = {
    hasWallet: async () => true,
    isUnlocked: async () => state.unlocked,
    getSeed: async () => getBytes(Mnemonic.fromPhrase(PHRASE).computeSeed()),
    lock: async () => {
      state.unlocked = false;
    },
  };
  const approval: ApprovalGate = { requestApproval: async () => false };
  const evm: EvmChainProvider = {
    getBalance: async () => 0n,
    getNonce: async () => 0,
    getFeeData: async () => ({ maxFeePerGas: 1n, maxPriorityFeePerGas: 1n }),
    estimateGas: async () => 21_000n,
    broadcast: async () => '0x' + 'cd'.repeat(32),
  };
  const engine = new NomadWalletEngine({ session, approval, evm });
  const original = engine.signConnectTypedData.bind(engine);
  engine.signConnectTypedData = async (d, t, v) => {
    state.signs++;
    return original(d, t, v);
  };
  const connect = new NomadConnect({
    wallet: engine,
    registry,
    now: () => NOW,
    store: createMemoryAttestationStore(),
    gate: {
      request: async (r) => {
        state.reviews.push(r);
        return state.yes;
      },
    },
  });
  return { state, engine, connect };
}

const code = (r: ConnectResponse) => (r.status === 'error' ? r.code : 'approved');

const acceptanceTypes = { BuyerAcceptance: [{ name: 'orderHash', type: 'bytes32' }, { name: 'buyer', type: 'address' }, { name: 'deadline', type: 'uint64' }] };
const permitTypes = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};

describe('buy (pay for an escrowed marketplace order)', () => {
  test('signs the acceptance and the permit, and both verify against the PINNED contract and token', async () => {
    const { connect, state } = setup();
    const req = buyRequest();
    const res = await connect.handle(req);
    if (res.status !== 'approved' || res.kind !== 'buy') throw new Error(`unexpected: ${JSON.stringify(res)}`);
    expect(res.address).toBe(WALLET);
    expect(res.id).toBe(req.id);
    expect(res.nonce).toBe(req.nonce);
    expect(res.orderHash).toBe(ORDER_HASH);

    const acceptanceSigner = verifyTypedData(
      { ...P.settlementDomain, chainId: 296, verifyingContract: P.settlement },
      acceptanceTypes,
      { orderHash: ORDER_HASH, buyer: WALLET, deadline: req.deadline },
      res.buyerSignature,
    );
    expect(acceptanceSigner).toBe(WALLET);

    const permitSig = Signature.from({ r: res.permit.r, s: res.permit.s, v: res.permit.v }).serialized;
    const permitSigner = verifyTypedData(
      { name: P.token.permitName, version: P.token.permitVersion, chainId: 296, verifyingContract: P.token.address },
      permitTypes,
      { owner: WALLET, spender: P.settlement, value: 25_000_000n, nonce: 3n, deadline: req.deadline },
      permitSig,
    );
    expect(permitSigner).toBe(WALLET);
    expect(res.permit.deadline).toBe(req.deadline);
    expect(state.signs).toBe(2);
  });

  test('the owner sees the amount in readable units, the escrow contract, and the app words marked as the app’s', async () => {
    const { connect, state } = setup();
    await connect.handle(buyRequest());
    expect(state.reviews).toHaveLength(1);
    const text = [state.reviews[0].title, ...state.reviews[0].lines].join('\n');
    expect(text).toContain('25.0 SBUSD');
    expect(text).toContain('escrow');
    expect(text).toContain('0x05F7d6');
    expect(text).toContain('Zonycs says this is: Used bicycle');
  });

  test('a request cannot change the contract, token, spender or owner: extra fields are ignored', async () => {
    const { connect } = setup();
    const req = buyRequest({ spender: ATTACKER, token: ATTACKER, verifyingContract: ATTACKER, owner: ATTACKER, buyer: ATTACKER });
    const res = await connect.handle(req);
    if (res.status !== 'approved' || res.kind !== 'buy') throw new Error('unexpected');
    const permitSig = Signature.from({ r: res.permit.r, s: res.permit.s, v: res.permit.v }).serialized;
    const signer = verifyTypedData(
      { name: P.token.permitName, version: P.token.permitVersion, chainId: 296, verifyingContract: P.token.address },
      permitTypes,
      { owner: WALLET, spender: P.settlement, value: 25_000_000n, nonce: 3n, deadline: req.deadline },
      permitSig,
    );
    expect(signer).toBe(WALLET);
    // The same signature does NOT verify for an attacker spender.
    const wrong = verifyTypedData(
      { name: P.token.permitName, version: P.token.permitVersion, chainId: 296, verifyingContract: P.token.address },
      permitTypes,
      { owner: WALLET, spender: ATTACKER, value: 25_000_000n, nonce: 3n, deadline: req.deadline },
      permitSig,
    );
    expect(wrong).not.toBe(WALLET);
  });

  test('declining signs nothing', async () => {
    const { connect, state } = setup({ yes: false });
    expect(code(await connect.handle(buyRequest()))).toBe('declined');
    expect(state.signs).toBe(0);
  });

  test('a locked wallet signs nothing', async () => {
    const { connect, state } = setup({ unlocked: false });
    expect(code(await connect.handle(buyRequest()))).toBe('wallet_locked');
    expect(state.signs).toBe(0);
  });

  test('refuses an app that may not buy, and an app with no pinned payment settings', async () => {
    const { connect, state } = setup();
    expect(code(await connect.handle(buyRequest({ app: { id: 'syaxio', origin: 'https://syaxio.example' } })))).toBe('kind_not_allowed');
    expect(code(await connect.handle(buyRequest({ app: { id: 'nobuy', origin: 'https://nobuy.example' } })))).toBe('kind_not_allowed');
    expect(state.signs).toBe(0);
    expect(state.reviews).toHaveLength(0);
  });

  test('refuses the wrong network, an over-limit amount, and bad deadlines', async () => {
    const { connect, state } = setup();
    expect(code(await connect.handle(buyRequest({ chainId: 1 })))).toBe('invalid_request');
    expect(code(await connect.handle(buyRequest({ amount: '1000000001' })))).toBe('invalid_request');
    expect(code(await connect.handle(buyRequest({ deadline: NOW_SEC + 5 })))).toBe('expired');
    expect(code(await connect.handle(buyRequest({ deadline: NOW_SEC - 100 })))).toBe('expired');
    expect(code(await connect.handle(buyRequest({ deadline: NOW_SEC + 24 * 3600 })))).toBe('invalid_request');
    expect(state.signs).toBe(0);
  });

  test('accepts exactly the largest allowed amount', async () => {
    const { connect } = setup();
    const res = await connect.handle(buyRequest({ amount: P.maxAmount }));
    expect(res.status).toBe('approved');
  });

  test('refuses malformed fields', async () => {
    const { connect } = setup();
    expect(code(await connect.handle(buyRequest({ orderHash: '0x1234' })))).toBe('invalid_request');
    expect(code(await connect.handle(buyRequest({ amount: '0' })))).toBe('invalid_request');
    expect(code(await connect.handle(buyRequest({ amount: '1.5' })))).toBe('invalid_request');
    expect(code(await connect.handle(buyRequest({ permitNonce: '-1' })))).toBe('invalid_request');
    expect(code(await connect.handle(buyRequest({ deadline: 'soon' })))).toBe('invalid_request');
    expect(code(await connect.handle(buyRequest({ chainId: '296' })))).toBe('invalid_request');
  });

  test('a request cannot be used twice', async () => {
    const { connect, state } = setup();
    const req = buyRequest();
    expect((await connect.handle(req)).status).toBe('approved');
    expect(code(await connect.handle(req))).toBe('replayed');
    expect(state.signs).toBe(2);
  });

  test('a request from the wrong website is refused', async () => {
    const { connect, state } = setup();
    expect(code(await connect.handle(buyRequest({ app: { id: 'zonycs', origin: 'https://evil.example' } })))).toBe('origin_mismatch');
    expect(state.signs).toBe(0);
  });
});

describe('engine: structured signing is limited to a purchase', () => {
  const domain = { name: 'X', version: '1', chainId: 296, verifyingContract: P.settlement };

  test('refuses any other message shape', async () => {
    const { engine } = setup();
    await expect(engine.signConnectTypedData(domain, { Mail: [{ name: 'to', type: 'address' }] }, { to: ATTACKER })).rejects.toThrow();
    await expect(
      engine.signConnectTypedData(domain, { ...acceptanceTypes, ...permitTypes }, { orderHash: ORDER_HASH, buyer: WALLET, deadline: 1 }),
    ).rejects.toThrow();
  });

  test('refuses a message with no network or contract', async () => {
    const { engine } = setup();
    await expect(
      engine.signConnectTypedData({ name: 'X', version: '1' }, acceptanceTypes, { orderHash: ORDER_HASH, buyer: WALLET, deadline: 1 }),
    ).rejects.toThrow();
  });

  test('refuses while locked', async () => {
    const { engine } = setup({ unlocked: false });
    await expect(engine.signConnectTypedData(domain, acceptanceTypes, { orderHash: ORDER_HASH, buyer: WALLET, deadline: 1 })).rejects.toThrow();
  });
});
