function summarizeFindings({ auditId, normalizedUrl, domainIntel, cloneDetection, fingerprint, staticResult, payloadResult, dynamicResult, contractIntel, chainSimulation, risk, persistence = null, alert = null, workflow = null }) {
  return {
    auditId,
    url: normalizedUrl,
    generatedAt: new Date().toISOString(),
    scannerVersion: '8.0.0',
    risk,
    workflow,
    domainIntel,
    cloneDetection: { ...cloneDetection, fingerprint: fingerprint?.hash || fingerprint || null, fingerprintFinalUrl: fingerprint?.finalUrl || null },
    staticAnalysis: {
      finalUrl: staticResult.finalUrl,
      redirects: staticResult.redirects,
      htmlBytes: staticResult.htmlBytes,
      scriptUrls: staticResult.scriptUrls,
      inlineScriptCount: staticResult.inlineScriptCount,
      forms: staticResult.forms,
      iframes: staticResult.iframes,
      findings: staticResult.findings,
      errors: staticResult.errors
    },
    payloadAnalysis: {
      checked: payloadResult.checked,
      payloads: payloadResult.payloads,
      scoreWeight: payloadResult.scoreWeight
    },
    dynamicAnalysis: {
      dynamicSuspicious: dynamicResult.dynamicSuspicious,
      walletRequests: dynamicResult.walletRequests,
      runtimeSignals: dynamicResult.runtimeSignals,
      domSignals: dynamicResult.domSignals,
      logs: dynamicResult.logs,
      network: dynamicResult.network,
      blockedRequests: dynamicResult.blockedRequests || [],
      screenshot: dynamicResult.screenshot || null,
      error: dynamicResult.error || null
    },
    contractIntel,
    chainSimulation,
    persistence,
    alert,
    safetyNotice: 'Blockpages411 performs defensive automated analysis. It can reduce risk, but no scanner can guarantee a website is safe. Never enter a seed phrase/private key into any website.'
  };
}

module.exports = { summarizeFindings };
