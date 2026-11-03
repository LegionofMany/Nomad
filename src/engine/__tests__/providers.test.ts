import { createEsploraProvider } from '../providers';
import type { FetchLike } from '../providers';

const ME = 'tb1qme';
const THEM = 'tb1qthem';

const fakeNet = (routes: Record<string, { status?: number; body: string }>, log: { url: string; method?: string; body?: string }[] = []): FetchLike =>
  async (url, init) => {
    log.push({ url, method: init?.method, body: init?.body });
    const key = Object.keys(routes).find((k) => url.endsWith(k));
    if (!key) return { ok: false, status: 404, text: async () => 'not found' };
    const r = routes[key];
    const status = r.status ?? 200;
    return { ok: status < 400, status, text: async () => r.body };
  };

describe('Esplora (Bitcoin testnet) provider, fake network', () => {
  test('rejects non-https endpoints', () => {
    expect(() => createEsploraProvider('http://insecure.example/api', fakeNet({}))).toThrow(/https/);
  });

  test('parses UTXOs into bigint satoshis', async () => {
    const p = createEsploraProvider('https://x.test/api', fakeNet({ [`/address/${ME}/utxo`]: { body: JSON.stringify([{ txid: 'a'.repeat(64), vout: 1, value: 12345 }]) } }));
    expect(await p.getUtxos(ME)).toEqual([{ txid: 'a'.repeat(64), vout: 1, value: 12345n }]);
  });

  test('fee rate rounds up and falls back safely', async () => {
    const a = createEsploraProvider('https://x.test/api', fakeNet({ '/fee-estimates': { body: JSON.stringify({ '3': 4.2 }) } }));
    expect(await a.getFeeRateSatPerVb()).toBe(5);
    const b = createEsploraProvider('https://x.test/api', fakeNet({ '/fee-estimates': { body: '{}' } }));
    expect(await b.getFeeRateSatPerVb()).toBe(2);
  });

  test('broadcast posts the raw hex and returns the txid; refuses non-hex', async () => {
    const log: any[] = [];
    const p = createEsploraProvider('https://x.test/api', fakeNet({ '/tx': { body: 'txid123\n' } }, log));
    expect(await p.broadcast('0200ab')).toBe('txid123');
    expect(log[0]).toMatchObject({ method: 'POST', body: '0200ab' });
    await expect(p.broadcast('not hex!')).rejects.toThrow();
  });

  test('network errors become friendly recoverable errors', async () => {
    const p = createEsploraProvider('https://x.test/api', fakeNet({ [`/address/${ME}/utxo`]: { status: 500, body: 'boom' } }));
    await expect(p.getUtxos(ME)).rejects.toMatchObject({ code: 'missing_provider', recoverable: true });
  });

  test('history classifies sent and received transactions', async () => {
    const txs = [
      { txid: 's1', vin: [{ prevout: { scriptpubkey_address: ME, value: 100000 } }], vout: [{ scriptpubkey_address: THEM, value: 30000 }, { scriptpubkey_address: ME, value: 69000 }], status: { confirmed: true, block_time: 1700000000 } },
      { txid: 'r1', vin: [{ prevout: { scriptpubkey_address: THEM, value: 50000 } }], vout: [{ scriptpubkey_address: ME, value: 40000 }], status: { confirmed: false } },
    ];
    const p = createEsploraProvider('https://x.test/api', fakeNet({ [`/address/${ME}/txs`]: { body: JSON.stringify(txs) } }));
    const h = await p.getHistory!([ME]);
    const sent = h.find((x) => x.id === 's1')!;
    const recv = h.find((x) => x.id === 'r1')!;
    expect(sent).toMatchObject({ direction: 'sent', amount: '0.00031000', status: 'confirmed', counterparty: THEM });
    expect(recv).toMatchObject({ direction: 'received', amount: '0.00040000', status: 'pending' });
  });
});
