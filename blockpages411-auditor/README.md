# Blockpages411 Auditor v8 for Nomad

This folder is the Nomad-side landing area for the Blockpages411 Auditor v8 service.

The auditor is designed to run as a separate service from the Nomad mobile overlay. Nomad should call it through an adapter; Nomad should not run Playwright, Redis, chain simulation, or backend scanner logic inside the mobile app.

## Integration boundary

```txt
Nomad mobile app
  -> NomadSafetyAdapter
  -> Blockpages411 Auditor API
  -> queued scan worker
  -> sandbox + static analysis + chain simulation
  -> risk report
  -> Nomad URL Scanner screen
```

## Current inclusion status

```txt
Repository: LegionofMany/Nomad
Branch: feature/blockpages411-auditor-v8
Status: v8 integration scaffold added
Full service source: prepared in Blockpages411 Auditor v8 package and ready to expand under this folder
Nomad app change: live adapter scaffold added at mobile/nomad/adapters/blockpages411AuditorAdapter.ts
```

## Expected auditor API

The v8 service exposes the queued production workflow:

```txt
POST /audits
GET /audits/:auditId
GET /audits/:auditId/report
GET /audits/recent
```

Nomad should use the queued flow only. The older synchronous `/audit` route is disabled by default in v8 production mode.

## Required Nomad environment variable

```env
EXPO_PUBLIC_BLOCKPAGES411_AUDITOR_URL=https://your-blockpages411-auditor-api.example.com
```

For local development:

```env
EXPO_PUBLIC_BLOCKPAGES411_AUDITOR_URL=http://localhost:4000
```

## Production rule

Do not connect this adapter to live user flows until:

1. Auditor v8 backend is deployed to staging.
2. Redis worker is running.
3. ADMIN_API_KEY is configured server-side only.
4. QA fixtures pass.
5. Nomad scanner screen confirms report mapping.
6. Phase 4 production audit confirms the service boundary.

## Next repository step

Expand the full v8 service source under this folder or keep it as a separately deployed service repository and use this folder as the Nomad integration boundary.
