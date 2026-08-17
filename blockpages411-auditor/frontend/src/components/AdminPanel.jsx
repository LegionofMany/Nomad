import { useEffect, useState } from 'react';
import { exportThreatIntel, getAdminRecentAudits, getRecentAudits, saveAdminVerdict } from '../utils/api.js';

export default function AdminPanel() {
  const [data, setData] = useState(null);
  const [adminKey, setAdminKey] = useState('');
  const [selectedAuditId, setSelectedAuditId] = useState('');
  const [verdict, setVerdict] = useState('needs_review');
  const [notes, setNotes] = useState('');
  const [addToThreatIntel, setAddToThreatIntel] = useState(false);
  const [intelExport, setIntelExport] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadRecent() {
    try {
      setError('');
      setMessage('');
      const recent = adminKey ? await getAdminRecentAudits(adminKey, 25) : await getRecentAudits(10);
      setData(recent);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  async function handleVerdict(event) {
    event.preventDefault();
    try {
      setError('');
      const saved = await saveAdminVerdict(adminKey, selectedAuditId, {
        verdict,
        notes,
        tags: notes.split(/[,\s]+/).filter(Boolean).slice(0, 10),
        addToThreatIntel
      });
      setMessage(`Saved verdict: ${saved.verdict.verdict}`);
      await loadRecent();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  async function handleExport() {
    try {
      setError('');
      setIntelExport(await exportThreatIntel(adminKey));
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  useEffect(() => { loadRecent(); }, []);

  return (
    <section className="card adminCard">
      <div className="adminHeader">
        <div>
          <p className="eyebrow">Operator View</p>
          <h2>Recent Audits + Manual Review</h2>
        </div>
        <button type="button" onClick={loadRecent}>Refresh</button>
      </div>

      <div className="form adminKeyRow">
        <input value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="Admin API key for protected review actions" type="password" />
        <button type="button" onClick={handleExport}>Export Threat Intel</button>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      {data?.queue && <p className="small">Queue: {JSON.stringify(data.queue.counts || data.queue)}</p>}

      <div className="tableWrap">
        <table>
          <thead><tr><th>Time</th><th>URL</th><th>Risk</th><th>Verdict</th><th>Signals</th></tr></thead>
          <tbody>
            {(data?.recent || []).map((item) => (
              <tr key={item.auditId} onClick={() => setSelectedAuditId(item.auditId)} className={selectedAuditId === item.auditId ? 'selectedRow' : ''}>
                <td>{item.generatedAt}<br /><span className="small">{item.auditId}</span></td>
                <td>{item.url}</td>
                <td>{item.risk?.score}/10 {item.risk?.level}</td>
                <td>{item.verdict?.verdict || 'unreviewed'}</td>
                <td>{JSON.stringify(item.counts)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleVerdict} className="reviewBox">
        <h3>Manual Verdict</h3>
        <input value={selectedAuditId} onChange={(e) => setSelectedAuditId(e.target.value)} placeholder="Audit ID" />
        <select value={verdict} onChange={(e) => setVerdict(e.target.value)}>
          <option value="needs_review">Needs review</option>
          <option value="confirmed_malicious">Confirmed malicious</option>
          <option value="confirmed_safe">Confirmed safe</option>
          <option value="false_positive">False positive</option>
          <option value="inconclusive">Inconclusive</option>
        </select>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Operator notes / tags" />
        <label className="checkRow"><input type="checkbox" checked={addToThreatIntel} onChange={(e) => setAddToThreatIntel(e.target.checked)} /> Add confirmed malicious indicators to custom threat intelligence</label>
        <button type="submit" disabled={!adminKey || !selectedAuditId}>Save Verdict</button>
      </form>

      {intelExport && <details open><summary>Threat Intelligence Export</summary><pre>{JSON.stringify(intelExport, null, 2)}</pre></details>}
    </section>
  );
}
