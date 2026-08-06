# Blockpages411 Repository Audit

This audit was completed before bringing the Blockpages411 auditor package into the `LegionofMany/Nomad` repository.

## Repository observed

```txt
Repository: LegionofMany/Nomad
Default branch: main
Product: Nomad Wallet / Nomad Protocol
Current role: branded wallet overlay and protection layer
```

The existing repository already recognizes Blockpages safety as a required Nomad capability:

- `README.md` lists Blockpages destination checks as a core Nomad principle.
- `mobile/screens/BlockPagesURLScannerScreen.tsx` exists as a user-facing scanner screen.
- `mobile/nomad/hooks/useNomadSafety.ts` exposes `scanUrl` and `scanAddress` from the Nomad safety adapter.
- `mobile/nomad/adapters/walletAdapter.ts` defines the `NomadSafetyAdapter` contract.
- `mobile/nomad/adapters/localNomadAdapters.ts` currently implements only a local keyword-based placeholder safety adapter.

## What is complete in the current repo

```txt
✅ Mobile scanner screen exists
✅ Safety hook exists
✅ Safety adapter type exists
✅ Local fallback scanner exists
✅ Nomad architecture keeps scanning behind adapters
✅ Nomad does not sign, broadcast, or custody from scanner code
```

## What is missing

```txt
❌ Blockpages411 live auditor service is not yet inside the repo
❌ Queued scan API is not yet connected to Nomad mobile
❌ Redis/BullMQ worker workflow is not yet part of the repo
❌ Dynamic Playwright sandbox is not yet present in the repo
❌ SSRF/private-network protection service code is not yet present
❌ Chain-aware transaction simulation is not yet present
❌ Admin review / threat-intel workflow is not yet present
❌ Production scanner environment checklist is not yet present
```

## Required inclusion plan

The Blockpages411 Auditor v8 package should be added under:

```txt
services/blockpages411-auditor/
```

Nomad mobile should then connect through a new adapter bridge instead of directly embedding scanner logic in screens:

```txt
mobile/nomad/services/blockpages411Client.ts
mobile/nomad/adapters/blockpages411SafetyAdapter.ts
```

This keeps the architecture correct:

```txt
Nomad screen
  → useNomadSafety
  → NomadSafetyAdapter
  → Blockpages411 client
  → Blockpages411 queued scanner service
  → scan report
```

## Non-negotiable safety boundary

The scanner may inspect URLs, scripts, wallet-request payloads, signatures, approvals, transaction intent, domains, known bad intelligence, screenshots, and read-only RPC simulation.

The scanner must not:

```txt
- store user seed phrases
- request real seed phrases
- request private keys
- sign transactions
- broadcast transactions
- connect a real wallet inside the sandbox
- approve real wallet permissions
```

## Production status

This repo is ready to receive the Blockpages411 auditor service on a feature branch.

It should not be merged to production until:

```txt
1. Service files are added under services/blockpages411-auditor/
2. Mobile adapter bridge is added
3. Required environment variables are documented
4. Queue/worker smoke test passes
5. Scanner fixtures pass
6. Admin API key is configured outside Git
7. Live Blockpages411 endpoint is tested in staging
```
