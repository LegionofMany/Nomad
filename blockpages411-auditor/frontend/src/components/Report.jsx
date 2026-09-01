function Badge({ level }) {
  return <span className={`badge ${String(level || 'low').toLowerCase()}`}>{level}</span>;
}

function CountPanel({ label, value }) {
  return <div className="panel"><strong>{label}</strong><span>{value}</span></div>;
}

export default function Report({ data }) {
  const risk = data.risk || { score: 0, level: 'LOW', reasons: [] };
  const walletRequests = data.dynamicAnalysis?.walletRequests || [];
  const blockedRequests = data.dynamicAnalysis?.blockedRequests || [];
  const payloads = data.payloadAnalysis?.payloads || [];
  const contractFindings = data.contractIntel?.findings || [];
  const decodedTransactions = data.contractIntel?.decodedTransactions || [];
  const domainFindings = data.domainIntel?.findings || [];
  const runtimeSignals = data.dynamicAnalysis?.runtimeSignals || [];
  const chainSimulation = data.chainSimulation || {};
  const inspectedChainTx = chainSimulation.inspectedTransactions || [];
  const signatureRisks = chainSimulation.signatureRisks || [];
  const screenshot = data.dynamicAnalysis?.screenshot || null;

  return (
    <div className="report">
      <div className="riskRow">
        <div>
          <p className="label">Risk score</p>
          <h2>{risk.score}/10 <Badge level={risk.level} /></h2>
          {data.auditId && <p className="small">Audit ID: {data.auditId}</p>}
        </div>
        <p>{risk.recommendation}</p>
      </div>

      <h3>Why this score?</h3>
      {risk.reasons?.length ? <ul>{risk.reasons.map((reason, i) => <li key={i}>{reason}</li>)}</ul> : <p>No major automated red flags were found.</p>}

      <div className="grid">
        <CountPanel label="Clone detected" value={data.cloneDetection?.clonedSite ? 'Yes' : 'No'} />
        <CountPanel label="Domain findings" value={domainFindings.length} />
        <CountPanel label="Static findings" value={data.staticAnalysis?.findings?.length || 0} />
        <CountPanel label="Payloads checked" value={data.payloadAnalysis?.checked || 0} />
        <CountPanel label="Wallet requests" value={walletRequests.length} />
        <CountPanel label="Blocked requests" value={blockedRequests.length} />
        <CountPanel label="Contract findings" value={contractFindings.length} />
        <CountPanel label="Decoded tx warnings" value={decodedTransactions.length} />
        <CountPanel label="Chain tx simulated" value={inspectedChainTx.length} />
        <CountPanel label="Signature risks" value={signatureRisks.length} />
        <CountPanel label="Screenshot evidence" value={screenshot ? 'Captured' : 'Off'} />
      </div>

      {screenshot && <details open><summary>Screenshot evidence</summary><pre>{JSON.stringify(screenshot, null, 2)}</pre></details>}
      {domainFindings.length > 0 && <details open><summary>Domain intelligence findings</summary><pre>{JSON.stringify(domainFindings, null, 2)}</pre></details>}
      {blockedRequests.length > 0 && <details open><summary>Sandbox blocked unsafe requests</summary><pre>{JSON.stringify(blockedRequests, null, 2)}</pre></details>}
      {walletRequests.length > 0 && <details open><summary>Wallet requests intercepted</summary><pre>{JSON.stringify(walletRequests, null, 2)}</pre></details>}
      {contractFindings.length > 0 && <details open><summary>Contract / approval intelligence findings</summary><pre>{JSON.stringify(contractFindings, null, 2)}</pre></details>}
      {decodedTransactions.length > 0 && <details open><summary>Decoded transaction warnings</summary><pre>{JSON.stringify(decodedTransactions, null, 2)}</pre></details>}
      {inspectedChainTx.length > 0 && <details open><summary>Chain-aware transaction simulation</summary><pre>{JSON.stringify(chainSimulation, null, 2)}</pre></details>}
      {signatureRisks.length > 0 && inspectedChainTx.length === 0 && <details open><summary>Chain-aware signature risk review</summary><pre>{JSON.stringify(chainSimulation, null, 2)}</pre></details>}
      {runtimeSignals.length > 0 && <details><summary>Runtime API/network instrumentation</summary><pre>{JSON.stringify(runtimeSignals, null, 2)}</pre></details>}
      {payloads.length > 0 && <details><summary>Downloaded payload analysis</summary><pre>{JSON.stringify(payloads, null, 2)}</pre></details>}
      {(data.persistence || data.alert) && <details><summary>Persistence / alert status</summary><pre>{JSON.stringify({ persistence: data.persistence, alert: data.alert }, null, 2)}</pre></details>}
      <details><summary>Full report JSON</summary><pre>{JSON.stringify(data, null, 2)}</pre></details>
    </div>
  );
}
