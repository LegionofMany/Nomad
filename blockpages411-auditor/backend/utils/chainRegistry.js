const DEFAULT_CHAINS = {
  '0x1': { chainId: '0x1', decimalChainId: 1, name: 'Ethereum Mainnet', rpcEnv: 'ETHEREUM_RPC_URL', explorer: 'https://etherscan.io' },
  '0x89': { chainId: '0x89', decimalChainId: 137, name: 'Polygon', rpcEnv: 'POLYGON_RPC_URL', explorer: 'https://polygonscan.com' },
  '0x38': { chainId: '0x38', decimalChainId: 56, name: 'BNB Smart Chain', rpcEnv: 'BSC_RPC_URL', explorer: 'https://bscscan.com' },
  '0xa': { chainId: '0xa', decimalChainId: 10, name: 'Optimism', rpcEnv: 'OPTIMISM_RPC_URL', explorer: 'https://optimistic.etherscan.io' },
  '0xa4b1': { chainId: '0xa4b1', decimalChainId: 42161, name: 'Arbitrum One', rpcEnv: 'ARBITRUM_RPC_URL', explorer: 'https://arbiscan.io' },
  '0x2105': { chainId: '0x2105', decimalChainId: 8453, name: 'Base', rpcEnv: 'BASE_RPC_URL', explorer: 'https://basescan.org' },
  '0xa86a': { chainId: '0xa86a', decimalChainId: 43114, name: 'Avalanche C-Chain', rpcEnv: 'AVALANCHE_RPC_URL', explorer: 'https://snowtrace.io' }
};

function normalizeChainId(chainId) {
  if (chainId === undefined || chainId === null || chainId === '') return '0x1';
  if (typeof chainId === 'number') return `0x${chainId.toString(16)}`;
  const text = String(chainId).trim().toLowerCase();
  if (text.startsWith('0x')) return `0x${BigInt(text).toString(16)}`;
  if (/^\d+$/.test(text)) return `0x${BigInt(text).toString(16)}`;
  return text;
}

function parseCustomChains() {
  try {
    const raw = process.env.CHAIN_RPC_MAP_JSON;
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const out = {};
    for (const [key, value] of Object.entries(parsed)) {
      const chainId = normalizeChainId(key);
      if (typeof value === 'string') {
        out[chainId] = { chainId, name: `Custom Chain ${chainId}`, rpcUrl: value };
      } else if (value && typeof value === 'object') {
        out[chainId] = { chainId, ...value, rpcUrl: value.rpcUrl || value.url || value.rpc };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function getChainConfig(chainId) {
  const normalized = normalizeChainId(chainId);
  const custom = parseCustomChains();
  const base = custom[normalized] || DEFAULT_CHAINS[normalized] || { chainId: normalized, name: `Unknown EVM Chain ${normalized}` };
  const rpcUrl = base.rpcUrl || (base.rpcEnv ? process.env[base.rpcEnv] : null);
  return { ...base, chainId: normalized, rpcUrl: rpcUrl || null, simulationEnabled: Boolean(rpcUrl) && process.env.ENABLE_CHAIN_SIMULATION === 'true' };
}

function getSupportedChains() {
  const custom = parseCustomChains();
  const merged = { ...DEFAULT_CHAINS, ...custom };
  return Object.values(merged).map((chain) => {
    const cfg = getChainConfig(chain.chainId);
    return { chainId: cfg.chainId, decimalChainId: cfg.decimalChainId || null, name: cfg.name, hasRpc: Boolean(cfg.rpcUrl), simulationEnabled: cfg.simulationEnabled };
  });
}

module.exports = { DEFAULT_CHAINS, normalizeChainId, getChainConfig, getSupportedChains };
