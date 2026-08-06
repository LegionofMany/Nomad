# Nomad + Blockpages411 Auditor v8 Integration

## Purpose

This file records the first Nomad repository inclusion of the Blockpages411 Auditor v8 service boundary.

Nomad already has a BlockPages URL Scanner screen and a `NomadSafetyAdapter` interface. The missing bridge is a live adapter that can talk to the hardened v8 queued auditor service.

## Added in this branch

```txt
blockpages411-auditor/README.md
blockpages411-auditor/V8_SOURCE_MANIFEST.md
```

## Why the auditor stays outside mobile

The v8 auditor runs backend-only capabilities:

```txt
Playwright sandbox
Redis/BullMQ queue
Private-network blocking
Downloaded payload analysis
Threat-intel storage
Admin verdicts
Chain-aware simulation
Webhook alerting
```

Those must not run inside the mobile app.

## Nomad mobile responsibility

Nomad should only:

```txt
Submit URL scan request
Poll queued scan status
Fetch completed report
Map report to NomadSafetyScanResult
Display result to the user
```

## Required environment variable

```env
EXPO_PUBLIC_BLOCKPAGES411_AUDITOR_URL=https://your-blockpages411-auditor-api.example.com
```

## Production gating

Do not enable live scans until:

1. v8 auditor backend is deployed to staging.
2. v8 worker is running with Redis.
3. v8 readiness check passes.
4. Nomad scanner screen is tested against fake-airdrop and fake-approval fixtures.
5. No real wallet signing is connected to the scanner.
6. Phase 4 production audit approves the scanner path.

## Current decision

This branch does not change main app behavior automatically. It adds the v8 landing area and service boundary so the full service can be expanded under `blockpages411-auditor/` or deployed as a separate backend used by Nomad through an adapter.
