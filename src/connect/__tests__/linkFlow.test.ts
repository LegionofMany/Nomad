import { Wallet } from 'ethers';
import { NomadConnect, encodeConnectLink, isConnectLink, processConnectLink } from '../index';
import type { ConnectRegistry, ConnectWallet } from '../index';

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
