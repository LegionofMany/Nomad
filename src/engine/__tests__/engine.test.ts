import { Mnemonic, Transaction, getBytes } from 'ethers';
import { Transaction as BtcTx } from 'bitcoinjs-lib';
import { deriveBitcoinTestnetKey, deriveEvmKey } from '../derive';
import { planBitcoinSend, signBitcoinPlan } from '../btc';
import type { OwnedUtxo } from '../btc';
import { NomadWalletEngine } from '../NomadWalletEngine';
import type { ApprovalGate, BitcoinProvider, EvmChainProvider, SessionAuthority, TransactionReview } from '../types';

// Public BIP39 test phrase: its addresses are published, so we can check against known answers.
const PHRASE = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const seedBytes = () => getBytes(Mnemonic.fromPhrase(PHRASE).computeSeed());

const KNOWN_BTC_TESTNET_ADDR = 'tb1q6rz28mcfaxtmd6v789l9rrlrusdprr9pqcpvkl';
const KNOWN_EVM_ADDR = '0x9858EfFD232B4033E47d90003D41EC34EcaEda94';
const OTHER_BTC = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
const OTHER_EVM = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const FAKE_TXID = 'a'.repeat(64);

describe('key derivation against published vectors', () => {
  test('Bitcoin testnet BIP84 first address', () => {
    expect(deriveBitcoinTestnetKey(seedBytes(), 0, false).address).toBe(KNOWN_BTC_TESTNET_ADDR);
  });
  test('Ethereum first address', () => {
    expect(deriveEvmKey(seedBytes(), 0).address).toBe(KNOWN_EVM_ADDR);
  });
  test('change address differs from receive address', () => {
    const s = seedBytes();
    expect(deriveBitcoinTestnetKey(s, 0, true).address).not.toBe(deriveBitcoinTestnetKey(s, 0, false).address);
  });
});

describe('bitcoin planning and signing', () => {
  const utxo = (value: bigint, kind: 'receive' | 'change' = 'receive', vout = 0): OwnedUtxo => ({ txid: FAKE_TXID, vout, value, kind });

  test('selects coins, adds change, fee matches rate', () => {
    const plan = planBitcoinSend({ utxos: [utxo(100_000n)], toAddress: OTHER_BTC, amountSats: 30_000n, feeRateSatPerVb: 10, changeAddress: 'c' });
    expect(plan.feeSats).toBe(BigInt(plan.vbytes) * 10n);
    expect(plan.changeSats + plan.amountSats + plan.feeSats).toBe(100_000n);
  });
  test('insufficient funds is refused', () => {
    expect(() => planBitcoinSend({ utxos: [utxo(1_000n)], toAddress: OTHER_BTC, amountSats: 30_000n, feeRateSatPerVb: 10, changeAddress: 'c' })).toThrow(/insufficient/i);
  });
  test('absurd fee rate is refused', () => {
    expect(() => planBitcoinSend({ utxos: [utxo(100_000n)], toAddress: OTHER_BTC, amountSats: 1_000n, feeRateSatPerVb: 5000, changeAddress: 'c' })).toThrow(/high/i);
  });
  test('produces a valid signed transaction paying the right output', () => {
    const s = seedBytes();
    const keys = { receive: deriveBitcoinTestnetKey(s, 0, false), change: deriveBitcoinTestnetKey(s, 0, true) };
    const plan = planBitcoinSend({ utxos: [utxo(100_000n)], toAddress: OTHER_BTC, amountSats: 30_000n, feeRateSatPerVb: 5, changeAddress: keys.change.address });
    const { rawHex, txid } = signBitcoinPlan(plan, keys);
    const tx = BtcTx.fromHex(rawHex);
    expect(tx.getId()).toBe(txid);
    expect(tx.outs[0].value).toBe(30_000);
    expect(tx.ins[0].witness.length).toBe(2); // signature + pubkey
  });
});

describe('wallet engine', () => {
  const makeEnv = (opts: { unlocked?: boolean; approve?: boolean } = {}) => {
    const state = { unlocked: opts.unlocked ?? true, approve: opts.approve ?? true, seedCalls: 0, reviews: [] as TransactionReview[], broadcasts: [] as string[] };
    const session: SessionAuthority = {
      hasWallet: async () => true,
      isUnlocked: async () => state.unlocked,
      getSeed: async () => {
        if (!state.unlocked) throw new Error('locked');
        state.seedCalls++;
        return seedBytes();
      },
      lock: async () => {
        state.unlocked = false;
      },
    };
    const approval: ApprovalGate = {
      requestApproval: async (r) => {
        state.reviews.push(r);
        return state.approve;
      },
    };
    const bitcoin: BitcoinProvider = {
      getUtxos: async (addr) => (addr === KNOWN_BTC_TESTNET_ADDR ? [{ txid: FAKE_TXID, vout: 0, value: 100_000n }] : []),
      getFeeRateSatPerVb: async () => 5,
      broadcast: async (raw) => {
        state.broadcasts.push(raw);
        return BtcTx.fromHex(raw).getId();
      },
    };
    const evm: EvmChainProvider = {
      getBalance: async () => 10n ** 18n,
      getNonce: async () => 3,
      getFeeData: async () => ({ maxFeePerGas: 20_000_000_000n, maxPriorityFeePerGas: 1_000_000_000n }),
      estimateGas: async () => 21_000n,
      broadcast: async (raw) => {
        state.broadcasts.push(raw);
        return Transaction.from(raw).hash as string;
      },
    };
    return { state, engine: new NomadWalletEngine({ session, approval, bitcoin, evm }) };
  };
  const btcDraft = { fromAsset: 'tBTC', toAddress: OTHER_BTC, amount: '0.0003', chainId: 'bitcoin-testnet' } as any;
  const evmDraft = { fromAsset: 'SepoliaETH', toAddress: OTHER_EVM, amount: '0.01', chainId: 'evm-sepolia' } as any;

  test('reports locked state and refuses to reveal addresses while locked', async () => {
    const { engine } = makeEnv({ unlocked: false });
    expect((await engine.getSessionState()).status).toBe('locked');
    await expect(engine.getAccounts()).rejects.toMatchObject({ code: 'wallet_locked' });
  });

  test('returns the published addresses when unlocked', async () => {
    const { engine } = makeEnv();
    expect(await engine.getReceiveAddress('tBTC', 'bitcoin-testnet')).toBe(KNOWN_BTC_TESTNET_ADDR);
    expect(await engine.getReceiveAddress('SepoliaETH', 'evm-sepolia')).toBe(KNOWN_EVM_ADDR);
  });

  test('balances come from the providers', async () => {
    const { engine } = makeEnv();
    const assets = await engine.getAssets();
    expect(assets.find((a) => a.symbol === 'tBTC')?.balance).toBe('0.00100000');
    expect(assets.find((a) => a.symbol === 'SepoliaETH')?.balance).toBe('1.0');
  });

  test('mainnet chains are refused', async () => {
    const { engine } = makeEnv();
    await expect(engine.getReceiveAddress('BTC', 'bitcoin')).rejects.toMatchObject({ code: 'unsupported_chain' });
    await expect(engine.getReceiveAddress('ETH', 'ethereum')).rejects.toMatchObject({ code: 'unsupported_chain' });
  });

  test('mainnet destination address is refused', async () => {
    const { engine } = makeEnv();
    await expect(engine.signTransaction({ ...btcDraft, toAddress: 'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu' })).rejects.toThrow();
  });

  test('declined approval signs nothing and never touches the seed for signing', async () => {
    const { engine, state } = makeEnv({ approve: false });
    await engine.getAccounts();
    const before = state.seedCalls;
    await expect(engine.signTransaction(btcDraft)).rejects.toMatchObject({ code: 'rejected_signing' });
    expect(state.seedCalls).toBe(before);
    expect(state.reviews).toHaveLength(1);
  });

  test('the approval review shows the real destination, amount and fee', async () => {
    const { engine, state } = makeEnv();
    await engine.signTransaction(btcDraft);
    expect(state.reviews[0]).toMatchObject({ toAddress: OTHER_BTC, amount: '0.00030000', assetSymbol: 'tBTC', fromAddress: KNOWN_BTC_TESTNET_ADDR });
    expect(Number(state.reviews[0].feeEstimate)).toBeGreaterThan(0);
  });

  test('createTransaction never signs or asks approval', async () => {
    const { engine, state } = makeEnv();
    const r = await engine.createTransaction(btcDraft);
    expect(r.status).toBe('created');
    expect(state.reviews).toHaveLength(0);
  });

  test('sign then broadcast a Bitcoin testnet transaction', async () => {
    const { engine, state } = makeEnv();
    const signed = await engine.signTransaction(btcDraft);
    expect(signed.status).toBe('signed');
    const result = await engine.broadcastTransaction(signed);
    expect(result.status).toBe('broadcasted');
    expect(result.txHash).toBe(signed.txHash);
    expect(state.broadcasts).toHaveLength(1);
  });

  test('sign then broadcast an EVM Sepolia transaction with the right chain id', async () => {
    const { engine } = makeEnv();
    const signed = await engine.signTransaction(evmDraft);
    const parsed = Transaction.from(signed.rawTransaction as string);
    expect(parsed.chainId).toBe(11155111n);
    expect(parsed.from).toBe(KNOWN_EVM_ADDR);
    expect(parsed.to).toBe(OTHER_EVM);
    expect(parsed.nonce).toBe(3);
    expect((await engine.broadcastTransaction(signed)).status).toBe('broadcasted');
  });

  test('refuses to broadcast a transaction it did not sign', async () => {
    const { engine, state } = makeEnv();
    const signed = await engine.signTransaction(btcDraft);
    await expect(engine.broadcastTransaction({ ...signed, rawTransaction: 'deadbeef' })).rejects.toThrow();
    await expect(engine.broadcastTransaction({ status: 'signed', txHash: 'f'.repeat(64), rawTransaction: 'aa' } as any)).rejects.toThrow();
    expect(state.broadcasts).toHaveLength(0);
  });

  test('locking wipes pending transactions and blocks further use', async () => {
    const { engine, state } = makeEnv();
    const signed = await engine.signTransaction(btcDraft);
    await engine.lockWallet();
    await expect(engine.broadcastTransaction(signed)).rejects.toThrow();
    await expect(engine.getAccounts()).rejects.toMatchObject({ code: 'wallet_locked' });
    expect(state.broadcasts).toHaveLength(0);
  });

  test('wallet locked while the approval screen is open aborts signing', async () => {
    const env = makeEnv();
    const original = env.engine;
    const state = env.state;
    const draft = btcDraft;
    // lock during the approval prompt
    (original as any).cfg.approval = {
      requestApproval: async () => {
        state.unlocked = false;
        return true;
      },
    };
    await expect(original.signTransaction(draft)).rejects.toMatchObject({ code: 'wallet_locked' });
  });

  test('recovery restoration honestly reports not implemented', async () => {
    const { engine } = makeEnv();
    await expect(engine.restoreFromNomadAuthorization({} as any)).rejects.toMatchObject({ code: 'not_implemented' });
  });
});
