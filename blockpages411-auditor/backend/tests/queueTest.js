const axios = require('axios');

const API = process.env.API_BASE || 'http://localhost:4000';
const target = process.argv[2] || 'https://example.com';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const queued = await axios.post(`${API}/audits`, { url: target });
  console.log('Queued:', queued.data);
  const auditId = queued.data.auditId;

  for (let i = 0; i < 30; i += 1) {
    const status = await axios.get(`${API}/audits/${auditId}`);
    console.log(`Poll ${i + 1}:`, status.data.state, status.data.job?.progress || '');
    if (status.data.report) {
      console.log('Completed risk:', status.data.report.risk);
      process.exit(0);
    }
    if (status.data.job?.state === 'failed') {
      console.error('Failed:', status.data.job.failedReason);
      process.exit(1);
    }
    await sleep(2500);
  }
  console.error('Timed out waiting for queued audit');
  process.exit(1);
}

main().catch((err) => {
  console.error(err.response?.data || err.message);
  process.exit(1);
});
