# Blockpages411 Auditor v8

Defensive production-ready URL, cloned-site, drainer-script, fake-airdrop, wallet-request, Permit/Permit2, approval, downloaded-payload, threat-intelligence, admin-review, screenshot-evidence, and read-only chain-simulation auditor for Blockpages411.

> Safety notice: this scanner reduces risk but cannot guarantee any URL is safe. Never enter a seed phrase, private key, or recovery phrase into any website.

## v8 purpose

v8 is the final GitHub-readiness hardening pass. It audits backwards from v7, fixes production defaults, and adds a readiness checker so the repo can be connected to GitHub after secrets are configured.

## What changed in v8

- Startup security gate for backend and worker.
- Weak/default `ADMIN_API_KEY` values are rejected.
- `ADMIN_API_KEY` must be 32+ characters in production.
- Constant-time admin key comparison.
- Synchronous `/audit` route is disabled by default.
- Production flow uses queued scans through `/audits`.
- Redis is no longer exposed on the host in Docker Compose.
- Docker Compose requires `ADMIN_API_KEY` before startup.
- Frontend admin panel is hidden unless `VITE_ENABLE_ADMIN_PANEL=true`.
- Frontend Dockerfile now builds static assets before preview serving.
- Added `npm run test:readiness` for final repo checks.
- Added final GitHub readiness audit and GitHub connect steps.

## Architecture

```text
frontend
  -> backend API
      -> /audits queued submission
          -> BullMQ / Redis
              -> worker
                  -> URL safety + SSRF guard
                  -> domain intelligence + threat-intel match
                  -> static HTML/JS analysis
                  -> external payload analysis + script-hash match
                  -> clone/fingerprint detection
                  -> Playwright sandbox + fake wallets
                  -> dynamic private-network request blocking
                  -> optional screenshot evidence
                  -> wallet request capture
                  -> EVM selector / approval / Permit inspection
                  -> optional read-only chain simulation
                  -> risk scoring
                  -> persisted JSON report
                  -> optional webhook alert
                  -> admin verdict / manual review
                  -> threat-intel export
```

## Public endpoints

### Submit queued audit

```http
POST /audits
Content-Type: application/json

{ "url": "https://example.com" }
```

### Poll status

```http
GET /audits/:auditId
```

### Fetch completed report

```http
GET /audits/:auditId/report
```

### Recent summary

```http
GET /audits/recent
```

### Legacy synchronous audit

```http
POST /audit
```

Disabled by default in v8. Enable only for local development:

```env
ENABLE_SYNC_AUDIT=true
```

## Admin/operator endpoints

All `/admin/*` routes require:

```http
x-admin-api-key: your-strong-admin-key
```

Important routes:

```http
GET  /admin/health
GET  /admin/audits/recent
GET  /admin/audits/:auditId
POST /admin/audits/:auditId/verdict
GET  /admin/export/threat-intel
GET  /admin/audits/:auditId/screenshot
```

Manual verdicts support:

```text
needs_review
confirmed_malicious
confirmed_safe
false_positive
inconclusive
```

When `verdict=confirmed_malicious` and `addToThreatIntel=true`, observed host, addresses, and downloaded script hashes can be promoted into local threat intelligence.

## Required environment setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Generate a strong admin secret:

```bash
openssl rand -hex 32
```

Set it in `.env`:

```env
ADMIN_API_KEY=<your-generated-64-character-hex-secret>
```

For public production builds, keep:

```env
ENABLE_QUEUE=true
ENABLE_SYNC_AUDIT=false
ALLOW_PRIVATE_AUDIT=false
ALLOW_PRIVATE_RPC=false
VITE_ENABLE_ADMIN_PANEL=false
```

For an internal operator frontend build only:

```env
VITE_ENABLE_ADMIN_PANEL=true
```

## Chain simulation

Chain simulation is disabled by default.

```env
ENABLE_CHAIN_SIMULATION=false
```

To enable read-only simulation, set trusted public RPC URLs only:

```env
ENABLE_CHAIN_SIMULATION=true
ETHEREUM_RPC_URL=https://your-trusted-rpc
BASE_RPC_URL=https://your-trusted-rpc
POLYGON_RPC_URL=https://your-trusted-rpc
```

Keep this false in production unless you fully control the RPC settings:

```env
ALLOW_PRIVATE_RPC=false
```

The simulation is defensive and read-only. It does not sign, send, or broadcast transactions.

## Run with Docker

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Redis: internal Docker network only
- Worker: background audit processor

## Local validation

Backend syntax:

```bash
cd backend
npm install
npm run syntax
```

Final readiness check:

```bash
npm run test:readiness
```

Docker startup:

```bash
cd ..
docker compose up --build
```

Health check:

```bash
curl http://localhost:4000/health
```

Submit queued audit:

```bash
curl -X POST http://localhost:4000/audits \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

Admin health:

```bash
curl -H "x-admin-api-key: $ADMIN_API_KEY" http://localhost:4000/admin/health
```

## GitHub status

v8 is ready to connect to GitHub after `.env` is created locally and secrets are not committed.

Do not commit:

- `.env`
- audit reports
- audit logs
- screenshots
- admin verdict JSON files
- real RPC URLs
- webhook URLs
- admin API keys

See:

- `FINAL_GITHUB_READINESS_AUDIT.md`
- `GITHUB_CONNECT_STEPS.md`
- `PRODUCTION_LAUNCH_CHECKLIST.md`
