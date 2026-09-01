const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const checks = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function check(name, pass, detail = '') {
  checks.push({ name, pass: Boolean(pass), detail });
}

const requiredFiles = [
  'README.md',
  'FINAL_GITHUB_READINESS_AUDIT.md',
  'GITHUB_CONNECT_STEPS.md',
  'PRODUCTION_LAUNCH_CHECKLIST.md',
  '.env.example',
  '.gitignore',
  'docker-compose.yml',
  'backend/server.js',
  'backend/worker.js',
  'backend/routes/audit.js',
  'backend/routes/audits.js',
  'backend/routes/admin.js',
  'backend/utils/securityConfig.js',
  'backend/utils/dynamicNetworkGuard.js',
  'backend/utils/chainSimulation.js',
  'backend/utils/threatIntel.js',
  'frontend/src/App.jsx'
];

for (const file of requiredFiles) check(`required file exists: ${file}`, exists(file));

const compose = read('docker-compose.yml');
const redisBlock = (compose.match(/\n  redis:[\s\S]*?\n\n  backend:/) || [''])[0];
check('Redis is not exposed to host with ports:', !redisBlock.includes('ports:'), 'Redis should remain internal to Docker network.');
check('Compose requires ADMIN_API_KEY', compose.includes('${ADMIN_API_KEY:?'), 'Docker compose must fail if ADMIN_API_KEY is missing.');
check('Synchronous audit disabled by default', compose.includes('ENABLE_SYNC_AUDIT=${ENABLE_SYNC_AUDIT:-false}') && compose.includes('ENABLE_SYNC_AUDIT=false'));
check('Private audit disabled in compose', /ALLOW_PRIVATE_AUDIT=false/.test(compose));
check('Private RPC disabled in compose', /ALLOW_PRIVATE_RPC=false/.test(compose));
check('Docker uses read_only containers', (compose.match(/read_only: true/g) || []).length >= 2);
check('Docker drops Linux capabilities', (compose.match(/cap_drop:/g) || []).length >= 2);

const envExample = read('.env.example');
check('.env.example keeps queue enabled', envExample.includes('ENABLE_QUEUE=true'));
check('.env.example keeps sync audit disabled', envExample.includes('ENABLE_SYNC_AUDIT=false'));
check('.env.example keeps private audit disabled', envExample.includes('ALLOW_PRIVATE_AUDIT=false'));
check('.env.example keeps private RPC disabled', envExample.includes('ALLOW_PRIVATE_RPC=false'));
check('.env.example documents admin secret', envExample.includes('openssl rand -hex 32'));
check('.env.example hides admin panel by default', envExample.includes('VITE_ENABLE_ADMIN_PANEL=false'));

const gitignore = read('.gitignore');
check('.gitignore excludes .env', /^\.env$/m.test(gitignore));
check('.gitignore excludes audit reports', gitignore.includes('backend/data/audit-reports/'));
check('.gitignore excludes audit logs', gitignore.includes('backend/data/audit-logs/'));
check('.gitignore excludes screenshots', gitignore.includes('backend/data/screenshots/*.png'));
check('.gitignore excludes runtime custom threat intel', gitignore.includes('backend/data/threat-intel/*.custom.json'));

const server = read('backend/server.js');
check('Server runs startup security checks', server.includes('assertStartupSecurity'));
check('Health exposes safe public config', server.includes('getSafePublicConfig'));

const worker = read('backend/worker.js');
check('Worker runs startup security checks', worker.includes('assertStartupSecurity'));

const syncRoute = read('backend/routes/audit.js');
check('/audit sync route is gated', syncRoute.includes('ENABLE_SYNC_AUDIT') && syncRoute.includes('Synchronous audit endpoint is disabled'));

const adminAuth = read('backend/utils/adminAuth.js');
check('Admin auth rejects weak/default secrets', adminAuth.includes('isWeakSecret'));
check('Admin auth uses timing safe comparison', adminAuth.includes('timingSafeEqualString'));

const app = read('frontend/src/App.jsx');
check('Frontend admin panel is env-gated', app.includes('VITE_ENABLE_ADMIN_PANEL') && app.includes('ENABLE_ADMIN_PANEL'));

const backendPkg = JSON.parse(read('backend/package.json'));
check('Backend package is v8', backendPkg.version === '8.0.0');
check('Backend has readiness script', backendPkg.scripts && backendPkg.scripts['test:readiness']);

const failed = checks.filter((c) => !c.pass);
console.log(JSON.stringify({
  ok: failed.length === 0,
  total: checks.length,
  passed: checks.length - failed.length,
  failed: failed.length,
  failures: failed
}, null, 2));

if (failed.length) process.exit(1);
