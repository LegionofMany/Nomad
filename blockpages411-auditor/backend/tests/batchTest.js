const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:4000';
const urls = process.argv.slice(2);

const defaultUrls = [
  'https://example.com'
];

async function main() {
  const targets = urls.length ? urls : defaultUrls;
  for (const url of targets) {
    try {
      const started = Date.now();
      const res = await axios.post(`${API_BASE}/audit`, { url }, { timeout: 90000 });
      const report = res.data;
      console.log('\n=================================================');
      console.log(`URL: ${url}`);
      console.log(`Audit ID: ${report.auditId}`);
      console.log(`Risk: ${report.risk.score}/10 ${report.risk.level}`);
      console.log(`Reasons: ${(report.risk.reasons || []).join(' | ') || 'none'}`);
      console.log(`Wallet requests: ${report.dynamicAnalysis.walletRequests.length}`);
      console.log(`Blocked requests: ${(report.dynamicAnalysis.blockedRequests || []).length}`);
      console.log(`Contract findings: ${report.contractIntel.findings.length}`);
      console.log(`Payloads checked: ${report.payloadAnalysis.checked}`);
      console.log(`Duration: ${Date.now() - started}ms`);
    } catch (err) {
      console.log('\n=================================================');
      console.log(`URL: ${url}`);
      console.log(`ERROR: ${err.response?.data?.error || err.message}`);
    }
  }
}

main();
