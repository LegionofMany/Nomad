# Blockpages411 Auditor v8 Production Launch Checklist

Use this checklist before deploying the scanner publicly.

## Required secrets and environment

- [ ] Copy `.env.example` to `.env`.
- [ ] Generate `ADMIN_API_KEY` with `openssl rand -hex 32`.
- [ ] Confirm `ADMIN_API_KEY` is not a default placeholder and is at least 32 characters.
- [ ] Set `ALLOWED_ORIGIN` to the real Blockpages411 frontend origin.
- [ ] Keep `ENABLE_QUEUE=true`.
- [ ] Keep `ENABLE_SYNC_AUDIT=false` for production.
- [ ] Keep `ALLOW_PRIVATE_AUDIT=false`.
- [ ] Keep `ALLOW_PRIVATE_RPC=false`.
- [ ] Set `VITE_ENABLE_ADMIN_PANEL=false` for the public frontend.
- [ ] Build a separate private/operator frontend with `VITE_ENABLE_ADMIN_PANEL=true` only if needed.

## Storage

- [ ] Confirm `AUDIT_REPORT_DIR` points to persistent storage.
- [ ] Confirm `AUDIT_LOG_PATH` points to persistent JSONL storage.
- [ ] Confirm `ADMIN_VERDICT_DIR` points to persistent storage.
- [ ] Confirm `THREAT_INTEL_DIR` points to persistent storage.
- [ ] Confirm screenshot storage is ready before setting `CAPTURE_SCREENSHOTS=true`.

## Network and Docker hardening

- [ ] Redis is not exposed on a public host port.
- [ ] Backend and worker run with `no-new-privileges`.
- [ ] Backend and worker drop Linux capabilities.
- [ ] Backend and worker have read-only filesystems with writable `/tmp` and `/app/data` only.
- [ ] CPU, memory, PID, and shared-memory limits are reviewed.
- [ ] Backend public ingress is protected by your hosting layer / reverse proxy.
- [ ] Admin routes are not exposed without HTTPS.

## Optional chain simulation

- [ ] Keep `ENABLE_CHAIN_SIMULATION=false` until trusted RPC endpoints are ready.
- [ ] If enabling, use trusted paid/public RPC endpoints only.
- [ ] Do not use localhost, private IP, or metadata-service RPC URLs.
- [ ] Keep `MAX_CHAIN_SIM_TX` limited.
- [ ] Keep `ALLOW_PRIVATE_RPC=false`.

## Required local tests

```bash
cd backend
npm install
npm run syntax
npm run test:readiness
```

## Required Docker test

```bash
cd ..
cp .env.example .env
# edit ADMIN_API_KEY first
docker compose up --build
```

## Required runtime tests

Health:

```bash
curl http://localhost:4000/health
```

Queued scan:

```bash
curl -X POST http://localhost:4000/audits \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

Admin health:

```bash
curl -H "x-admin-api-key: $ADMIN_API_KEY" http://localhost:4000/admin/health
```

Operator workflow:

- [ ] Submit a queued scan.
- [ ] Confirm the worker completes it.
- [ ] Confirm report is persisted.
- [ ] Confirm `/audits/:auditId/report` returns the report.
- [ ] In an operator build, open admin panel.
- [ ] Save a `needs_review` verdict.
- [ ] Save a `confirmed_malicious` verdict with `addToThreatIntel=true` on a QA fixture only.
- [ ] Export threat intelligence and verify indicators appear.

## Git safety

- [ ] `.env` is not committed.
- [ ] Audit reports are not committed.
- [ ] Audit logs are not committed.
- [ ] Screenshots are not committed.
- [ ] Admin verdict JSON files are not committed.
- [ ] Runtime custom threat-intel files are not committed unless intentionally seeded.
- [ ] Real RPC URLs are not committed.
- [ ] Webhook URLs are not committed.
- [ ] Admin API key is not committed.

## Launch decision

If every required item above passes, v8 is ready to connect to GitHub.
