# Blockpages411 Scanner Service

This directory is reserved for the hardened Blockpages411 URL scanner service that connects to Nomad through the `NomadSafetyAdapter` boundary.

## Current inclusion status

The mobile bridge has been added in:

```txt
mobile/nomad/services/blockpages411Client.ts
mobile/nomad/adapters/blockpages411SafetyAdapter.ts
```

## Expected service shape

```txt
services/blockpages411-scanner/
├─ backend/
│  ├─ server.js
│  ├─ worker.js
│  ├─ routes/
│  ├─ utils/
│  ├─ data/
│  ├─ fixtures/
│  └─ tests/
├─ frontend/
├─ docker-compose.yml
├─ .env.example
└─ README.md
```

## Required API contract for Nomad mobile

The mobile bridge expects the queued scanner API:

```txt
POST /audits
GET /audits/:auditId
GET /audits/:auditId/report
```

The scanner should return a completed report containing at least:

```json
{
  "auditId": "string",
  "url": "https://example.com",
  "riskScore": 0,
  "riskLevel": "low",
  "summary": "Scan completed",
  "recommendation": "Proceed with caution only if expected"
}
```

## Production requirements

```txt
Set a strong admin key outside Git.
Keep sync scan route disabled by default.
Keep Redis internal only.
Use the queued /audits workflow.
Keep the sandbox private-network guard enabled.
Do not connect a real wallet inside the sandbox.
Use only trusted RPC providers.
```

## Safety boundary

Nomad mobile calls this service for safety verdicts only. The service must never sign, approve, or broadcast transactions.
