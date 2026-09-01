const { Worker } = require('bullmq');
const { assertStartupSecurity } = require('./utils/securityConfig');
const { redisConnection, QUEUE_NAME } = require('./utils/auditQueue');
const { performAudit } = require('./utils/auditRunner');

const concurrency = Math.max(1, Math.min(Number(process.env.AUDIT_WORKER_CONCURRENCY || 1), 5));

assertStartupSecurity({ service: 'worker' });

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    await job.updateProgress({ phase: 'starting', message: 'Starting URL audit' });
    const { auditId, normalizedUrl, url, requestedAt } = job.data || {};
    const targetUrl = normalizedUrl || url;
    await job.updateProgress({ phase: 'running', message: 'Running static, payload, dynamic and contract intelligence audit' });
    const report = await performAudit(targetUrl, { auditId, queuedAt: requestedAt, mode: 'queued' });
    await job.updateProgress({ phase: 'completed', message: 'Audit complete', risk: report.risk });
    return {
      auditId: report.auditId,
      url: report.url,
      generatedAt: report.generatedAt,
      risk: report.risk,
      reportUrl: `/audits/${report.auditId}/report`
    };
  },
  {
    connection: redisConnection(),
    concurrency,
    lockDuration: Number(process.env.AUDIT_JOB_LOCK_MS || 120000),
    stalledInterval: Number(process.env.AUDIT_JOB_STALLED_INTERVAL_MS || 30000),
    maxStalledCount: Number(process.env.AUDIT_JOB_MAX_STALLED || 1)
  }
);

worker.on('completed', (job, result) => {
  console.log(JSON.stringify({ event: 'audit_completed', jobId: job.id, auditId: result.auditId, risk: result.risk }));
});

worker.on('failed', (job, err) => {
  console.error(JSON.stringify({ event: 'audit_failed', jobId: job?.id, error: err.message }));
});

worker.on('error', (err) => {
  console.error(JSON.stringify({ event: 'worker_error', error: err.message }));
});

async function shutdown() {
  console.log('Closing Blockpages411 audit worker...');
  await worker.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log(`Blockpages411 audit worker v8 listening on queue ${QUEUE_NAME} with concurrency ${concurrency}`);
