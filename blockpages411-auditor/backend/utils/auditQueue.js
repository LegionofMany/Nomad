const { Queue, QueueEvents } = require('bullmq');

const QUEUE_NAME = process.env.AUDIT_QUEUE_NAME || 'blockpages411-audits';

function redisConnection() {
  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB || 0),
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  };
}

function queueOptions() {
  return {
    connection: redisConnection(),
    defaultJobOptions: {
      attempts: Number(process.env.AUDIT_JOB_ATTEMPTS || 1),
      backoff: { type: 'exponential', delay: Number(process.env.AUDIT_JOB_BACKOFF_MS || 3000) },
      removeOnComplete: {
        age: Number(process.env.AUDIT_JOB_COMPLETE_AGE_SECONDS || 86400),
        count: Number(process.env.AUDIT_JOB_COMPLETE_COUNT || 1000)
      },
      removeOnFail: {
        age: Number(process.env.AUDIT_JOB_FAIL_AGE_SECONDS || 604800),
        count: Number(process.env.AUDIT_JOB_FAIL_COUNT || 1000)
      }
    }
  };
}

function createAuditQueue() {
  return new Queue(QUEUE_NAME, queueOptions());
}

function createAuditQueueEvents() {
  return new QueueEvents(QUEUE_NAME, { connection: redisConnection() });
}

async function enqueueAuditJob({ auditId, url, normalizedUrl, requestedAt }) {
  const queue = createAuditQueue();
  try {
    const job = await queue.add('audit-url', { auditId, url, normalizedUrl, requestedAt }, { jobId: auditId });
    return { jobId: job.id, auditId, queueName: QUEUE_NAME };
  } finally {
    await queue.close();
  }
}

async function getAuditJobStatus(auditId) {
  const queue = createAuditQueue();
  try {
    const job = await queue.getJob(auditId);
    if (!job) return null;
    const state = await job.getState();
    return {
      auditId,
      jobId: job.id,
      queueName: QUEUE_NAME,
      state,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason || null,
      timestamp: job.timestamp ? new Date(job.timestamp).toISOString() : null,
      processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : null,
      finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      returnvalue: state === 'completed' ? job.returnvalue || null : null
    };
  } finally {
    await queue.close();
  }
}

async function getQueueStats() {
  const queue = createAuditQueue();
  try {
    const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused');
    return { queueName: QUEUE_NAME, counts };
  } finally {
    await queue.close();
  }
}

module.exports = { QUEUE_NAME, redisConnection, createAuditQueue, createAuditQueueEvents, enqueueAuditJob, getAuditJobStatus, getQueueStats };
