import { Wallet } from 'ethers';
import {
  DEV_REGISTRY,
  NomadConnect,
  buildAttestationMessage,
  createMemoryAttestationStore,
  decodeAttestLink,
  encodeAttestLink,
  encodeConnectLink,
  isAttestLink,
  isConnectLink,
  processAttestLink,
  processConnectLink,
  withDemoApp,
} from '../index';
import type { ConnectRegistry, ConnectWallet, SignedAttestation } from '../index';

const NOW = new Date('2026-11-22T10:00:00.000Z');
const ORIGIN = 'http://localhost:3001';
const key = Wallet.createRandom();

const registry: ConnectRegistry = {
  apps: [{ id: 'zonycs', name: 'Zonycs', origins: [ORIGIN], allowedKinds: ['signin'], callbackPath: '/nomad/callback' }],
  issuers: [],
};

let n = 0;
const req = (over: Record<string, unknown> = {}) => ({
  v: 1,
  id: `link-req-${String(++n).padStart(16, '0')}`,
  nonce: `link-non-${String(n).padStart(16, '0')}`,
  kind: 'signin',
  app: { id: 'zonycs', origin: ORIGIN },
  issuedAt: new Date(NOW.getTime() - 1000).toISOString(),
  expiresAt: new Date(NOW.getTime() + 300_000).toISOString(),
  ...over,
});

function setup(opts: { yes?: boolean; locked?: boolean } = {}) {
  const wallet: ConnectWallet = {
    getAccounts: async () => {
      if (opts.locked) throw Object.assign(new Error('locked'), { code: 'wallet_locked' });
      return [{ id: 'evm-sepolia-0', label: 'Ethereum Sepolia', address: key.address, assetSymbol: 'SepoliaETH', chainId: 'evm-sepolia' }] as any;
    },
    signConnectMessage: async (m) => ({ address: key.address, signature: await key.signMessage(m) }),
    signTransaction: async () => {
      throw new Error('not used');
    },
    broadcastTransaction: async () => {
      throw new Error('not used');
    },
  };
  const connect = new NomadConnect({ wallet, registry, now: () => NOW, gate: { request: async () => opts.yes ?? true } });
  return { connect };
}

const link = (over: Record<string, unknown> = {}) => encodeConnectLink(req(over) as any);

test('recognises only nomad connect links', () => {
  expect(isConnectLink('nomad://connect?r=abc')).toBe(true);
  expect(isConnectLink('https://evil.example')).toBe(false);
  expect(isConnectLink('nomad://other?r=abc')).toBe(false);
  expect(isConnectLink(null)).toBe(false);
});

test('an approved request answers the registered address', async () => {
  const { connect } = setup();
  const out = await processConnectLink(connect, registry, link());
  expect(out.response.status).toBe('approved');
  expect(out.title).toBe('Done');
  expect(out.message).toContain('Zonycs');
  expect(out.callbackUrl?.startsWith(`${ORIGIN}/nomad/callback#r=`)).toBe(true);
});

test('a declined request still tells the app, and tells the owner it was declined', async () => {
  const { connect } = setup({ yes: false });
  const out = await processConnectLink(connect, registry, link());
  expect(out.title).toBe('Declined');
  expect(out.response.status).toBe('error');
  expect(out.callbackUrl).not.toBeNull();
});

test('a damaged link is refused and goes nowhere', async () => {
  const { connect } = setup();
  const out = await processConnectLink(connect, registry, 'nomad://connect?r=%%%');
  expect(out.response.status).toBe('error');
  expect(out.callbackUrl).toBeNull();
});

test('an unregistered app is never contacted', async () => {
  const { connect } = setup();
  const out = await processConnectLink(connect, registry, link({ app: { id: 'evilshop', origin: 'https://evil.example' } }));
  expect(out.response.status === 'error' && out.response.code).toBe('unknown_app');
  expect(out.callbackUrl).toBeNull();
});

test('a look-alike origin for a real app id is never contacted', async () => {
  const { connect } = setup();
  const out = await processConnectLink(connect, registry, link({ app: { id: 'zonycs', origin: 'https://zonycs-login.example' } }));
  expect(out.response.status === 'error' && out.response.code).toBe('origin_mismatch');
  expect(out.callbackUrl).toBeNull();
});

test('a locked wallet is reported as locked', async () => {
  const { connect } = setup({ locked: true });
  const out = await processConnectLink(connect, registry, link());
  expect(out.response.status === 'error' && out.response.code).toBe('wallet_locked');
});

test('the same link cannot be used twice', async () => {
  const { connect } = setup();
  const l = link();
  expect((await processConnectLink(connect, registry, l)).response.status).toBe('approved');
  const again = await processConnectLink(connect, registry, l);
  expect(again.response.status === 'error' && again.response.code).toBe('replayed');
});

describe('Reqrium verification hand-off (nomad://attest)', () => {
  const issuer = Wallet.createRandom();
  const withIssuer: ConnectRegistry = { ...registry, issuers: [{ id: 'reqrium', name: 'Reqrium', address: issuer.address }] };

  const attest = async (over: Record<string, unknown> = {}, signer: { signMessage(m: string): Promise<string> } = issuer): Promise<SignedAttestation> => {
    const attestation = {
      v: 1 as const,
      issuer: 'reqrium',
      subject: key.address,
      claim: 'verified_person' as const,
      issuedAt: new Date(NOW.getTime() - 86_400_000).toISOString(),
      expiresAt: new Date(NOW.getTime() + 86_400_000).toISOString(),
      ...over,
    };
    return { attestation, signature: await signer.signMessage(buildAttestationMessage(attestation)) };
  };
  const make = () => {
    const base = setup().connect as any;
    const wallet = base.cfg.wallet as ConnectWallet;
    return new NomadConnect({ wallet, registry: withIssuer, now: () => NOW, store: createMemoryAttestationStore(), gate: { request: async () => true } });
  };

  test('recognises and round-trips a verification link', async () => {
    const signed = await attest();
    const l = encodeAttestLink(signed);
    expect(isAttestLink(l)).toBe(true);
    expect(isAttestLink('nomad://connect?r=abc')).toBe(false);
    expect(decodeAttestLink(l)).toEqual(signed);
  });

  test('a valid verification from the trusted issuer is saved', async () => {
    const out = await processAttestLink(make(), encodeAttestLink(await attest()));
    expect(out.ok).toBe(true);
    expect(out.title).toBe('Verification saved');
  });

  test('a verification signed by anyone else is refused', async () => {
    const out = await processAttestLink(make(), encodeAttestLink(await attest({}, Wallet.createRandom())));
    expect(out.ok).toBe(false);
  });

  test('a verification about another wallet is refused', async () => {
    const out = await processAttestLink(make(), encodeAttestLink(await attest({ subject: Wallet.createRandom().address })));
    expect(out.ok).toBe(false);
    expect(out.message).toMatch(/different wallet/);
  });

  test('an expired verification is refused', async () => {
    const out = await processAttestLink(make(), encodeAttestLink(await attest({ expiresAt: new Date(NOW.getTime() - 1000).toISOString() })));
    expect(out.ok).toBe(false);
  });

  test('with no trusted issuer configured nothing is saved', async () => {
    const { connect } = setup();
    const out = await processAttestLink(connect, encodeAttestLink(await attest()));
    expect(out.ok).toBe(false);
  });

  test('malformed links never throw', async () => {
    const { connect } = setup();
    for (const bad of ['nomad://attest?a=', 'nomad://attest?a=%%%', 'nomad://attest?a=e30', 'https://evil.example']) {
      expect((await processAttestLink(connect, bad)).ok).toBe(false);
    }
  });
});

describe('test page registration', () => {
  test('adds the test page only for a valid origin', () => {
    expect(withDemoApp(DEV_REGISTRY, undefined)).toBe(DEV_REGISTRY);
    expect(withDemoApp(DEV_REGISTRY, 'http://evil.example')).toBe(DEV_REGISTRY);
    const r = withDemoApp(DEV_REGISTRY, 'https://nomad-eight-eta.vercel.app');
    expect(r.apps.find((a) => a.id === 'nomad-demo')).toMatchObject({ origins: ['https://nomad-eight-eta.vercel.app'], callbackPath: '/connect-demo.html' });
    expect(DEV_REGISTRY.apps.some((a) => a.id === 'nomad-demo')).toBe(false);
  });

  test('the test page can sign in end to end', async () => {
    const origin = 'https://nomad-eight-eta.vercel.app';
    const reg = withDemoApp(DEV_REGISTRY, origin);
    const base = setup().connect as any;
    const connect = new NomadConnect({ wallet: base.cfg.wallet, registry: reg, now: () => NOW, gate: { request: async () => true } });
    const out = await processConnectLink(connect, reg, link({ app: { id: 'nomad-demo', origin } }));
    expect(out.response.status).toBe('approved');
    expect(out.callbackUrl?.startsWith(`${origin}/connect-demo.html#r=`)).toBe(true);
  });
});
