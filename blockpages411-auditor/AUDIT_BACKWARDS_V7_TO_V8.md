# Audit Backwards — v7 to v8

## What v7 already completed

- Queued scan workflow using BullMQ and Redis.
- Separate API and worker processes.
- Persistent per-audit JSON reports.
- Admin manual verdict workflow.
- Custom threat-intelligence promotion/export.
- Downloaded script hash matching.
- Screenshot evidence hooks.
- Dynamic Playwright sandbox with private-network request guard.
- Wallet request interception.
- Permit / Permit2 / typed-data risk review.
- ERC20 approval and NFT approval decoding.
- Optional read-only chain simulation.

## Weaknesses found during backward audit

1. `ADMIN_API_KEY` had a default placeholder in Docker Compose.
2. Admin auth did not reject weak/default secrets.
3. Admin key comparison was normal string comparison instead of constant-time comparison.
4. `/audit` synchronous scans were still available by default.
5. Redis was exposed on host port `6379`.
6. Frontend always rendered the operator/admin panel.
7. Frontend Dockerfile used Vite dev server style instead of build/preview.
8. No automated final readiness checker existed.
9. GitHub connection instructions needed to be explicit about not committing secrets/runtime data.

## v8 fixes applied

1. Added `backend/utils/securityConfig.js`.
2. Backend and worker now run startup security checks.
3. Weak/default admin secrets are rejected.
4. Admin auth now uses constant-time comparison.
5. `/audit` now requires `ENABLE_SYNC_AUDIT=true`.
6. Production default is queued `/audits` only.
7. Docker Compose no longer exposes Redis on host.
8. Docker Compose requires `ADMIN_API_KEY` using `${ADMIN_API_KEY:? ... }`.
9. Frontend admin panel is hidden unless `VITE_ENABLE_ADMIN_PANEL=true`.
10. Added `backend/tests/readinessCheck.js` and `npm run test:readiness`.
11. Added final GitHub readiness audit and connect steps.

## Result

v8 is ready to connect to GitHub after `.env` is created locally and secrets are configured.
