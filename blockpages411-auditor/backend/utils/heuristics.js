function clamp(score) { return Math.max(0, Math.min(10, Math.round(score * 10) / 10)); }

function addReason(reasons, text) {
  if (text && !reasons.includes(text)) reasons.push(text);
}

function calculateRiskScore({ domainIntel, staticResult, payloadResult, dynamicResult, cloneDetection, contractIntel, chainSimulation }) {
  let score = 0;
  const reasons = [];

  if (cloneDetection?.clonedSite) {
    score += 4.5;
    addReason(reasons, 'Site fingerprint matched a protected-site structure on a different domain. Possible clone/impersonation.');
  }

  if (domainIntel?.scoreWeight > 0) {
    const add = Math.min(3, domainIntel.scoreWeight / 3);
    score += add;
    addReason(reasons, `Domain analysis found ${domainIntel.findings.length} suspicious domain signal(s).`);
  }

  if (staticResult?.scoreWeight > 0) {
    const add = Math.min(3.5, staticResult.scoreWeight / 4);
    score += add;
    addReason(reasons, `Static analysis found ${staticResult.findings.length} suspicious code/page signal(s).`);
  }

  if (payloadResult?.scoreWeight > 0) {
    const add = Math.min(4, payloadResult.scoreWeight / 3.5);
    score += add;
    addReason(reasons, 'Downloaded payload analysis found suspicious external script signal(s).');
  }

  if (dynamicResult?.walletRequests?.length) {
    score += 3.5;
    addReason(reasons, `Sandbox intercepted ${dynamicResult.walletRequests.length} wallet request(s).`);
  }

  if (dynamicResult?.domSignals?.length) {
    score += 1.4;
    addReason(reasons, `Live DOM contained Web3 scam language/signals: ${dynamicResult.domSignals.join(', ')}.`);
  }

  if (dynamicResult?.blockedRequests?.length) {
    score += Math.min(2, dynamicResult.blockedRequests.length * 0.6);
    addReason(reasons, `Sandbox blocked ${dynamicResult.blockedRequests.length} unsafe/private/non-HTTP request(s).`);
  }

  if (dynamicResult?.runtimeSignals?.length) {
    const text = JSON.stringify(dynamicResult.runtimeSignals).toLowerCase();
    if (/telegram|discord.*webhook|drain|claim|airdrop|private|seed|mnemonic/.test(text)) {
      score += 1.5;
      addReason(reasons, 'Runtime network/API instrumentation observed suspicious claim/exfiltration-style behavior.');
    }
  }

  if (contractIntel?.decodedTransactions?.some((tx) => tx?.warnings?.some((w) => /infinite|max|setApprovalForAll|Permit2/i.test(w)))) {
    score += 2;
    addReason(reasons, 'Decoded transaction data contained infinite approval, Permit2, or NFT operator warning(s).');
  }

  if (contractIntel?.scoreWeight > 0) {
    const add = Math.min(6.5, contractIntel.scoreWeight / 3);
    score += add;
    addReason(reasons, `Wallet/contract intelligence found ${contractIntel.findings.length} high-risk approval, signature, transaction, or address signal(s).`);
  }



  if (chainSimulation?.scoreWeight > 0) {
    const add = Math.min(4.5, chainSimulation.scoreWeight / 4);
    score += add;
    addReason(reasons, `Chain-aware simulation/enrichment found ${chainSimulation.transactionRequestCount || 0} transaction request(s) and ${chainSimulation.signatureRequestCount || 0} signature request(s).`);
  }

  if (chainSimulation?.inspectedTransactions?.some((tx) => JSON.stringify(tx).toLowerCase().includes('infinite'))) {
    score += 2;
    addReason(reasons, 'Chain simulation detected infinite/max approval context.');
  }

  if (chainSimulation?.inspectedTransactions?.some((tx) => tx?.simulation?.ethCall?.ok && /approve|setapprovalforall|permit|transferfrom/i.test(JSON.stringify(tx?.decoded || {})))) {
    score += 1.5;
    addReason(reasons, 'Read-only chain simulation indicated a high-risk approval/transfer transaction can be evaluated by RPC.');
  }

  const networkText = JSON.stringify(dynamicResult?.network || []).toLowerCase();
  if (/drain|claim|airdrop|permit|approve|telegram|webhook/.test(networkText)) {
    score += 1;
    addReason(reasons, 'Network activity contained claim/airdrop/approval/drainer-like terms.');
  }

  if (staticResult?.forms?.some((form) => /seed|recovery|secret|private|mnemonic/i.test(JSON.stringify(form)))) {
    score += 4;
    addReason(reasons, 'Page appears to ask for seed phrase, private key, or recovery data.');
  }

  const finalScore = clamp(score);
  const level = finalScore >= 8 ? 'CRITICAL' : finalScore >= 6 ? 'HIGH' : finalScore >= 3 ? 'MEDIUM' : 'LOW';
  const recommendation = finalScore >= 8
    ? 'Block this site. Do not connect a wallet, sign, approve, or enter any recovery data.'
    : finalScore >= 6
      ? 'Do not connect a wallet or sign anything. Treat this site as unsafe until manually reviewed.'
      : finalScore >= 3
        ? 'Proceed with caution. Do not approve transactions or signatures unless independently verified.'
        : 'No major automated red flags were found, but this is not a guarantee of safety.';

  return { score: finalScore, level, reasons, recommendation };
}

module.exports = { calculateRiskScore };
