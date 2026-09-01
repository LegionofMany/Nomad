const { getChainConfig, getSupportedChains, normalizeChainId } = require('./chainRegistry');
const { rpcCall } = require('./rpcClient');
const { decodeCallData } = require('./evmDecoder');
const { encodeAddress, decodeStringReturn, decodeUintReturn, hexToDecimalString } = require('./abiHelpers');

const ERC20_SYMBOL = '0x95d89b41';
const ERC20_NAME = '0x06fdde03';
const ERC20_DECIMALS = '0x313ce567';
const ERC20_BALANCE_OF = '0x70a08231';
const ERC20_ALLOWANCE = '0xdd62ed3e';
const ERC721_IS_APPROVED_FOR_ALL = '0xe985e9c5';

function findTransactionRequests(walletRequests = []) {
  return walletRequests.filter((req) => req?.method === 'eth_sendTransaction');
}

function findTypedSignatureRequests(walletRequests = []) {
  return walletRequests.filter((req) => /^eth_signTypedData/i.test(String(req?.method || '')) || ['personal_sign', 'eth_sign'].includes(String(req?.method || '')));
}

function getTxFromRequest(req = {}) {
  const params = Array.isArray(req.params) ? req.params : [];
  return params.find((p) => p && typeof p === 'object' && (p.to || p.from || p.data || p.input || p.value)) || null;
}

function getRequestChainId(req = {}, tx = {}) {
  return normalizeChainId(tx.chainId || req.chainId || req.activeWallet?.chainId || '0x1');
}

function getSimulationFromAddress(req = {}, tx = {}) {
  return String(tx.from || req.activeWallet?.address || process.env.SIMULATION_FROM_ADDRESS || '0x1111111111111111111111111111111111111111').toLowerCase();
}

async function readContractString(chainId, to, data) {
  const res = await rpcCall(chainId, 'eth_call', [{ to, data }, 'latest']);
  if (!res.ok) return null;
  return decodeStringReturn(res.result);
}

async function readContractUint(chainId, to, data) {
  const res = await rpcCall(chainId, 'eth_call', [{ to, data }, 'latest']);
  if (!res.ok) return null;
  return decodeUintReturn(res.result);
}

async function enrichTokenMetadata(chainId, tokenAddress) {
  if (!tokenAddress) return null;
  const [symbol, name, decimals] = await Promise.all([
    readContractString(chainId, tokenAddress, ERC20_SYMBOL),
    readContractString(chainId, tokenAddress, ERC20_NAME),
    readContractUint(chainId, tokenAddress, ERC20_DECIMALS)
  ]);
  return { tokenAddress: tokenAddress.toLowerCase(), symbol, name, decimals };
}

async function checkCurrentAllowance(chainId, tokenAddress, owner, spender) {
  if (!tokenAddress || !owner || !spender) return null;
  const data = ERC20_ALLOWANCE + encodeAddress(owner) + encodeAddress(spender);
  const res = await rpcCall(chainId, 'eth_call', [{ to: tokenAddress, data }, 'latest']);
  return { ok: res.ok, value: res.ok ? hexToDecimalString(res.result) : null, error: res.ok ? null : res.error || res.reason || null };
}

async function checkNftApprovalForAll(chainId, nftAddress, owner, operator) {
  if (!nftAddress || !owner || !operator) return null;
  const data = ERC721_IS_APPROVED_FOR_ALL + encodeAddress(owner) + encodeAddress(operator);
  const res = await rpcCall(chainId, 'eth_call', [{ to: nftAddress, data }, 'latest']);
  const approved = res.ok ? BigInt(res.result || '0x0') !== 0n : null;
  return { ok: res.ok, approved, error: res.ok ? null : res.error || res.reason || null };
}

async function simulateEthCall(chainId, tx, from) {
  const callTx = {
    from,
    to: tx.to,
    data: tx.data || tx.input || '0x',
    value: tx.value || '0x0'
  };
  const res = await rpcCall(chainId, 'eth_call', [callTx, 'latest'], { timeoutMs: Number(process.env.RPC_TIMEOUT_MS || 8000) });
  if (!res.ok) return { ok: false, wouldRevert: true, error: res.error || res.reason || null };
  return { ok: true, wouldRevert: false, resultPreview: String(res.result || '').slice(0, 300) };
}

async function estimateGas(chainId, tx, from) {
  const callTx = {
    from,
    to: tx.to,
    data: tx.data || tx.input || '0x',
    value: tx.value || '0x0'
  };
  const res = await rpcCall(chainId, 'eth_estimateGas', [callTx], { timeoutMs: Number(process.env.RPC_TIMEOUT_MS || 8000) });
  if (!res.ok) return { ok: false, error: res.error || res.reason || null };
  return { ok: true, gasHex: res.result, gasDecimal: hexToDecimalString(res.result) };
}

function typedDataRiskSummary(req) {
  const serialized = JSON.stringify(req.params || '').toLowerCase();
  const findings = [];
  if (/permit2/.test(serialized)) findings.push('Permit2 typed-data signature observed');
  if (/permit/.test(serialized)) findings.push('Permit typed-data signature observed');
  if (/spender|operator|approval|allowance|setapprovalforall/.test(serialized)) findings.push('Signature references spender/operator/approval language');
  if (/seaport|blur|looksrare|wyvern|x2y2/.test(serialized)) findings.push('Marketplace/order signature language observed');
  if (/0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff/.test(serialized)) findings.push('Signature references max uint / infinite approval value');
  return findings;
}

async function inspectSingleTransaction(req, index) {
  const tx = getTxFromRequest(req);
  if (!tx) return { index, ok: false, reason: 'No transaction object found in wallet request' };
  const chainId = getRequestChainId(req, tx);
  const chain = getChainConfig(chainId);
  const from = getSimulationFromAddress(req, tx);
  const data = tx.data || tx.input || '0x';
  const decoded = decodeCallData(data);
  const txTarget = String(tx.to || '').toLowerCase() || null;
  const warnings = [];
  const enrichment = {};

  if (!txTarget) warnings.push('Transaction has no target address in captured request');
  if (tx.value && !['0x0', '0', 0].includes(tx.value)) warnings.push(`Native asset transfer requested: ${tx.value}`);
  if (decoded.warnings?.length) warnings.push(...decoded.warnings);

  if (decoded.selector === '0x095ea7b3') {
    enrichment.token = await enrichTokenMetadata(chainId, txTarget);
    enrichment.currentAllowance = await checkCurrentAllowance(chainId, txTarget, from, decoded.args.spender);
  }

  if (decoded.selector === '0xa22cb465') {
    enrichment.currentNftOperatorApproval = await checkNftApprovalForAll(chainId, txTarget, from, decoded.args.operator);
  }

  if (!chain.simulationEnabled) {
    return {
      index,
      chain: { chainId: chain.chainId, name: chain.name, simulationEnabled: false, hasRpc: Boolean(chain.rpcUrl) },
      from,
      to: txTarget,
      value: tx.value || '0x0',
      decoded,
      enrichment,
      simulation: { skipped: true, reason: chain.rpcUrl ? 'ENABLE_CHAIN_SIMULATION is not true' : `No RPC URL configured for ${chain.name}` },
      warnings
    };
  }

  const [ethCall, gasEstimate] = await Promise.all([
    simulateEthCall(chainId, tx, from),
    estimateGas(chainId, tx, from)
  ]);
  if (ethCall.wouldRevert) warnings.push('eth_call simulation indicates this transaction may revert or is blocked by current state');
  if (gasEstimate.ok) warnings.push(`Gas estimate succeeded: ${gasEstimate.gasDecimal}`);

  return {
    index,
    chain: { chainId: chain.chainId, name: chain.name, simulationEnabled: true, hasRpc: true },
    from,
    to: txTarget,
    value: tx.value || '0x0',
    decoded,
    enrichment,
    simulation: { ethCall, gasEstimate },
    warnings
  };
}

async function analyzeChainSimulation(walletRequests = [], options = {}) {
  const transactionRequests = findTransactionRequests(walletRequests);
  const signatureRequests = findTypedSignatureRequests(walletRequests);
  const maxTransactions = Number(options.maxTransactions || process.env.MAX_CHAIN_SIM_TX || 8);
  const inspectedTransactions = [];

  for (const [index, req] of transactionRequests.slice(0, maxTransactions).entries()) {
    inspectedTransactions.push(await inspectSingleTransaction(req, index));
  }

  const signatureRisks = signatureRequests.map((req, index) => ({
    index,
    method: req.method,
    activeWallet: req.activeWallet || null,
    findings: typedDataRiskSummary(req)
  })).filter((item) => item.findings.length > 0 || /sign/i.test(item.method));

  const chainSummary = getSupportedChains();
  const scoreWeight = inspectedTransactions.reduce((sum, item) => {
    let add = 0;
    const text = JSON.stringify(item).toLowerCase();
    if (/infinite|max erc20 approval|setapprovalforall|permit2|permit/.test(text)) add += 8;
    if (/native asset transfer/.test(text)) add += 4;
    if (/router|multicall/.test(text)) add += 4;
    if (item.simulation?.ethCall?.ok) add += 1;
    if (item.simulation?.ethCall?.wouldRevert) add += 1;
    return sum + add;
  }, 0) + signatureRisks.reduce((sum, item) => sum + Math.min(8, item.findings.length * 3), 0);

  return {
    enabled: process.env.ENABLE_CHAIN_SIMULATION === 'true',
    configuredChains: chainSummary,
    transactionRequestCount: transactionRequests.length,
    signatureRequestCount: signatureRequests.length,
    inspectedTransactions,
    signatureRisks,
    scoreWeight,
    notice: 'Chain simulation uses read-only eth_call/eth_estimateGas where RPC URLs are configured. It never signs or sends transactions.'
  };
}

module.exports = { analyzeChainSimulation, inspectSingleTransaction, typedDataRiskSummary };
