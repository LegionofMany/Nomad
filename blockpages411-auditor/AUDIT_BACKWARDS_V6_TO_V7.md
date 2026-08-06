# Audit Backwards: v6 -> v7

## v6 strengths confirmed

v6 already had a solid production scan pipeline:

- Queued scan workflow with Redis/BullMQ.
- API + worker separation.
- Static HTML/JS analysis.
- External JavaScript payload analysis.
- Playwright dynamic sandbox with fake wallet profiles.
- Dynamic private-network request blocking.
- Wallet request interception.
- EVM selector decoding for approvals, transfers, and NFT operator grants.
- Optional read-only chain simulation/enrichment through trusted RPC URLs.
- JSON report persistence and JSONL audit logging.

## v6 gaps before moving forward

The backward audit found these gaps:

1. Admin/operator routes were not authenticated.
2. Recent audit review existed, but there was no manual verdict workflow.
3. Threat-intelligence files existed, but there was no operator-managed custom intel workflow.
4. Downloaded script hashes were generated, but not matched against a malicious script-hash database.
5. Clone review had no screenshot evidence capture option.
6. High-risk findings could alert, but operators could not convert confirmed malicious findings into reusable intel.
7. Production README did not yet include admin review, intel export, screenshot capture, or GitHub-connect readiness guidance.

## v7 changes completed

v7 adds:

- `ADMIN_API_KEY` protected admin routes.
- Manual verdict workflow: `needs_review`, `confirmed_malicious`, `confirmed_safe`, `false_positive`, `inconclusive`.
- Verdict persistence in `ADMIN_VERDICT_DIR`.
- Custom threat-intelligence storage in `THREAT_INTEL_DIR`.
- Admin endpoints to add bad domains, addresses, and script hashes.
- Threat-intelligence export endpoint.
- Confirmed malicious verdicts can optionally add observed domain/address/script-hash indicators to custom intel.
- Known bad script-hash matching in payload analysis.
- Optional screenshot evidence capture through `CAPTURE_SCREENSHOTS=true`.
- Authenticated screenshot retrieval endpoint.
- Frontend operator review panel with admin key, verdict saving, and threat-intel export.
- New downloaded-payload QA fixture.
- README and launch checklist updated.

## Remaining before GitHub connection

v7 is now much closer, but should still be audited once more before GitHub connection:

- Run local Docker build.
- Run syntax checks.
- Run QA fixtures.
- Confirm admin key works.
- Confirm screenshots save only when enabled.
- Confirm manual verdict -> custom threat-intel promotion works.
- Confirm no secrets are committed.

