const { normalizeUrl, assertPublicUrl } = require('./urlSafety');
const { analyzeDomain } = require('./domainIntel');
const { staticAnalysis } = require('./staticAnalysis');
const { payloadAnalysis } = require('./payloadAnalysis');
const { dynamicAnalysis } = require('./dynamicAnalysis');
const { getSiteFingerprint, isClone } = require('./cloneDetection');
const { analyzeWalletRequests } = require('./contractIntel');
const { calculateRiskScore } = require('./heuristics');
const { analyzeChainSimulation } = require('./chainSimulation');
const { summarizeFindings } = require('./reportBuilder');
const { makeAuditId, saveAuditReport } = require('./auditStore');
const { maybeSendAlert } = require('./alerting');
const knownFingerprints = require('../data/knownFingerprints.json');

async function performAudit(inputUrl, options = {}) {
  const normalizedUrl = normalizeUrl(inputUrl);
  if (process.env.ALLOW_PRIVATE_AUDIT !== 'true') await assertPublicUrl(normalizedUrl);

  const auditId = options.auditId || makeAuditId(normalizedUrl);
  const queuedAt = options.queuedAt || null;
  const startedAt = new Date().toISOString();

  const domainIntel = analyzeDomain(normalizedUrl);
  const [staticResult, fingerprint] = await Promise.all([
    staticAnalysis(normalizedUrl),
    getSiteFingerprint(normalizedUrl)
  ]);

  const finalUrl = staticResult.finalUrl || normalizedUrl;
  const [payloadResult, dynamicResult] = await Promise.all([
    payloadAnalysis(staticResult.scriptUrls || []),
    dynamicAnalysis(finalUrl, { auditId })
  ]);

  const cloneDetection = isClone(normalizedUrl, fingerprint, knownFingerprints);
  const textSources = [
    JSON.stringify(staticResult.findings || []),
    JSON.stringify(staticResult.forms || []),
    JSON.stringify(payloadResult.payloads || []),
    JSON.stringify(dynamicResult.logs || []),
    JSON.stringify(dynamicResult.network || []),
    JSON.stringify(dynamicResult.runtimeSignals || []),
    JSON.stringify(dynamicResult.blockedRequests || [])
  ];
  const contractIntel = analyzeWalletRequests(dynamicResult.walletRequests || [], textSources);
  const chainSimulation = await analyzeChainSimulation(dynamicResult.walletRequests || []);
  const risk = calculateRiskScore({ domainIntel, staticResult, payloadResult, dynamicResult, cloneDetection, contractIntel, chainSimulation });

  let report = summarizeFindings({
    auditId,
    normalizedUrl,
    domainIntel,
    cloneDetection,
    fingerprint,
    staticResult,
    payloadResult,
    dynamicResult,
    contractIntel,
    chainSimulation,
    risk,
    workflow: {
      mode: options.mode || 'sync',
      queuedAt,
      startedAt,
      finishedAt: new Date().toISOString()
    }
  });

  const persistence = await saveAuditReport(report);
  const alert = await maybeSendAlert(report);
  report = { ...report, persistence, alert };

  // Persist the final copy too, so the stored JSON includes persistence/alert metadata.
  if (persistence?.persisted) await saveAuditReport(report, { appendJsonl: false });
  return report;
}

module.exports = { performAudit };
