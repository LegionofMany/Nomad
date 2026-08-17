async function postJson(url, payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.ALERT_TIMEOUT_MS || 5000));
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    return { ok: response.ok, status: response.status };
  } finally {
    clearTimeout(timeout);
  }
}

function buildAlertPayload(report) {
  return {
    type: 'blockpages411.high_risk_audit',
    auditId: report.auditId,
    url: report.url,
    generatedAt: report.generatedAt,
    risk: report.risk,
    clonedSite: report.cloneDetection?.clonedSite || false,
    walletRequestCount: report.dynamicAnalysis?.walletRequests?.length || 0,
    blockedRequestCount: report.dynamicAnalysis?.blockedRequests?.length || 0,
    topReasons: (report.risk?.reasons || []).slice(0, 8)
  };
}

async function maybeSendAlert(report) {
  const threshold = Number(process.env.ALERT_RISK_THRESHOLD || 8);
  const webhook = process.env.ALERT_WEBHOOK_URL;
  if (!webhook || Number(report.risk?.score || 0) < threshold) return { sent: false, reason: 'No alert required or webhook not configured' };
  const payload = buildAlertPayload(report);
  try {
    const result = await postJson(webhook, payload);
    return { sent: result.ok, status: result.status };
  } catch (err) {
    return { sent: false, error: err.message };
  }
}

module.exports = { maybeSendAlert, buildAlertPayload };
