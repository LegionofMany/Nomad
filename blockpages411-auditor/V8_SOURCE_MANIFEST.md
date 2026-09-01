# Blockpages411 Auditor v8 Source Manifest

The prepared v8 package contains the following service files. These are expected to live under `blockpages411-auditor/` when fully expanded.

## Backend routes

```txt
backend/routes/audit.js
backend/routes/audits.js
backend/routes/admin.js
```

## Backend utilities

```txt
backend/utils/urlSafety.js
backend/utils/staticAnalysis.js
backend/utils/dynamicAnalysis.js
backend/utils/heuristics.js
backend/utils/cloneDetection.js
backend/utils/payloadAnalysis.js
backend/utils/contractIntel.js
backend/utils/reportBuilder.js
backend/utils/safeHttp.js
backend/utils/domainIntel.js
backend/utils/dynamicNetworkGuard.js
backend/utils/evmDecoder.js
backend/utils/auditStore.js
backend/utils/alerting.js
backend/utils/auditRunner.js
backend/utils/auditQueue.js
backend/utils/chainRegistry.js
backend/utils/rpcClient.js
backend/utils/abiHelpers.js
backend/utils/chainSimulation.js
backend/utils/threatIntel.js
backend/utils/adminAuth.js
backend/utils/verdictStore.js
backend/utils/securityConfig.js
```

## Backend data

```txt
backend/data/knownFingerprints.json
backend/data/knownBadAddresses.json
backend/data/knownBadDomains.json
backend/data/knownBadScriptHashes.json
backend/data/protectedBrands.json
backend/data/threat-intel/knownBadDomains.custom.json
backend/data/threat-intel/knownBadAddresses.custom.json
backend/data/threat-intel/knownBadScriptHashes.custom.json
backend/data/admin-verdicts/.gitkeep
backend/data/screenshots/.gitkeep
backend/data/audit-reports/.gitkeep
backend/data/audit-logs/.gitkeep
```

## Backend runtime

```txt
backend/package.json
backend/server.js
backend/worker.js
backend/Dockerfile
```

## Fixtures and tests

```txt
backend/fixtures/fake-airdrop.html
backend/fixtures/seed-phrase-phish.html
backend/fixtures/private-network-attempt.html
backend/fixtures/fake-permit-signature.html
backend/fixtures/fake-approval-transaction.html
backend/fixtures/drainer-payload.js
backend/fixtures/fake-downloaded-payload.html
backend/tests/batchTest.js
backend/tests/queueTest.js
backend/tests/readinessCheck.js
```

## Frontend operator UI

```txt
frontend/src/components/URLInput.jsx
frontend/src/components/Report.jsx
frontend/src/components/AdminPanel.jsx
frontend/src/utils/api.js
frontend/src/App.jsx
frontend/src/index.jsx
frontend/src/style.css
frontend/package.json
frontend/vite.config.js
frontend/index.html
frontend/Dockerfile
```

## Root service files

```txt
README.md
.gitignore
docker-compose.yml
.env.example
AUDIT_BACKWARDS_V5_TO_V6.md
AUDIT_BACKWARDS_V6_TO_V7.md
AUDIT_BACKWARDS_V7_TO_V8.md
PRODUCTION_LAUNCH_CHECKLIST.md
FINAL_GITHUB_READINESS_AUDIT.md
GITHUB_CONNECT_STEPS.md
```

## v8 safety gates

```txt
Backend startup security checks
Worker startup security checks
Weak/default ADMIN_API_KEY blocked
Admin key requires 32+ characters in production
Constant-time admin key comparison
/audit sync route disabled by default
Queued /audits workflow enabled
Redis not exposed on host port
Frontend admin panel hidden unless enabled by env
Readiness check target: 44 / 44
```
