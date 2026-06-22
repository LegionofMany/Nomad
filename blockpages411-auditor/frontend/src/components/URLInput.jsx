import { useEffect, useRef, useState } from 'react';
import { enqueueAudit, getAuditStatus, submitURL } from '../utils/api.js';
import Report from './Report.jsx';

export default function URLInput() {
  const [url, setUrl] = useState('');
  const [report, setReport] = useState(null);
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('queued');
  const pollRef = useRef(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function pollAudit(auditId) {
    const status = await getAuditStatus(auditId);
    setJob(status);
    if (status.report) {
      setReport(status.report);
      setLoading(false);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (status.job?.state === 'failed') {
      setError(status.job.failedReason || 'Audit failed');
      setLoading(false);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setReport(null);
    setJob(null);
    setLoading(true);
    if (pollRef.current) clearInterval(pollRef.current);

    try {
      if (mode === 'sync') {
        const data = await submitURL(url);
        setReport(data);
        setLoading(false);
        return;
      }

      const queued = await enqueueAudit(url);
      setJob({ auditId: queued.auditId, state: 'waiting', job: queued });
      await pollAudit(queued.auditId);
      pollRef.current = setInterval(() => pollAudit(queued.auditId).catch((err) => {
        setError(err.response?.data?.error || err.message);
        setLoading(false);
        clearInterval(pollRef.current);
        pollRef.current = null;
      }), 2500);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <form onSubmit={handleSubmit} className="form">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
        <select value={mode} onChange={(e) => setMode(e.target.value)} aria-label="Audit mode">
          <option value="queued">Queued production scan</option>
          <option value="sync">Immediate dev scan</option>
        </select>
        <button disabled={loading}>{loading ? 'Auditing...' : 'Audit URL'}</button>
      </form>

      {job && !report && (
        <div className="statusBox">
          <strong>Status:</strong> {job.state || job.job?.state || 'queued'}
          {job.auditId && <span className="small"> Audit ID: {job.auditId}</span>}
          {job.job?.progress && <pre>{JSON.stringify(job.job.progress, null, 2)}</pre>}
        </div>
      )}

      {error && <p className="error">{error}</p>}
      {report && <Report data={report} />}
    </section>
  );
}
