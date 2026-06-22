# Nomad Final Handoff Package

This file is the final repository index for handing Nomad to a development team.

Nomad is currently a Phase 1 overlay build with Phase 2, Phase 3, and Phase 4 plans prepared. The project is not production-ready until the selected base wallet engine and live services are implemented behind the Nomad adapter layer and the production audit gates are passed.

## Current phase position

| Phase | Status | Meaning |
| --- | --- | --- |
| Phase 1 — Overlay Foundation | Complete | 26-screen Nomad mobile overlay, route registry, adapter contracts, hooks, demo adapters, adapter provider, audit registry, and guardrails are in place. |
| Phase 2A — Adapter Contract Hardening | Complete | Wallet/session/transaction/history/swap/security/recovery contracts are prepared for a real engine. |
| Phase 2B — Cloned Wallet Bridge Scaffold | Complete | A cloned-wallet adapter template exists for the selected wallet engine. |
| Phase 2C — Screen Readiness Audit | Complete | Every screen has a readiness row and phase action notes. |
| Phase 2D — Local Compile / Audit Execution | Ready for developer | The checklist and environment setup guide exist, but commands must be run on a local machine or CI. |
| Phase 2E — Base Wallet Engine Integration | Prepared | The selection/integration plan exists; the real engine is not connected yet. |
| Phase 3 — Live Services | Prepared | Live service roadmap exists for BlockPages, Travel Pocket, POS, freeze, recovery, Watch, protocols, and swaps. |
| Phase 4 — Production Audit / Release | Prepared | Release gates and production blockers are documented but not yet passed. |

## Primary handoff files

1. `DEV_HANDOFF.md` — main developer handoff guide.
2. `NOMAD_DEVELOPER_EXECUTION_CHECKLIST.md` — task-board style execution checklist.
3. `ENVIRONMENT_SETUP.md` — setup, install, typecheck, Expo, and smoke-test guide.
4. `PRODUCTION_BLOCKERS.md` — release blocker register.
5. `NOMAD_PHASE_ROADMAP.md` — 4-phase roadmap.
6. `mobile/nomad/NOMAD_LAYER_GUARDRAILS.md` — overlay boundary rules.
7. `mobile/nomad/PHASE_1_WIRING_AUDIT.md` — Phase 1 overlay wiring report.
8. `mobile/nomad/PHASE_2_WALLET_ENGINE_HANDOFF.md` — wallet-engine handoff notes.
9. `mobile/nomad/PHASE_2C_SCREEN_READINESS_AUDIT.md` — all 26 screen readiness checks.
10. `mobile/nomad/PHASE_2D_LOCAL_AUDIT_CHECKLIST.md` — local compile and audit checklist.
11. `mobile/nomad/PHASE_2E_BASE_ENGINE_SELECTION.md` — base wallet selection and integration plan.
12. `mobile/nomad/PHASE_3_LIVE_SERVICES_PLAN.md` — live service integration plan.
13. `mobile/nomad/PHASE_4_PRODUCTION_AUDIT_RELEASE.md` — production release gates.
14. `NOMAD_HANDOFF_CONSISTENCY_AUDIT.md` — consistency audit across handoff files.
15. `mobile/nomad/audit/screenCoverage.ts` — code-level 26-screen coverage registry.
16. `mobile/nomad/adapters/clonedWalletAdapterTemplate.ts` — adapter scaffold for the real wallet engine.

## Core architecture

```txt
Selected base wallet engine
        ↓
Concrete Nomad adapters
        ↓
NomadAdaptersProvider
        ↓
Nomad hooks
        ↓
26 Nomad screens
```

The selected base wallet engine must own custody, private keys, seed storage, account derivation, signing, broadcasting, providers, balances, and canonical transaction history.

Nomad owns UX, routing, Travel Pocket interface, safety interface, recovery interface, Owner Authority interface, emergency controls, Nomad Watch interface, Voltaire Protocols hub, settings, insights, and transaction draft handoff.

## Developer start checklist

Run these checks first:

```bash
npm install
npm run typecheck
npm run audit:nomad

cd mobile
npm install
npm run typecheck
npm run start
```

Then smoke test the full 26-screen route set from the mobile app.

Use `ENVIRONMENT_SETUP.md` for the full setup and error-reporting process.

## 26-screen coverage

The expected Nomad route set is:

1. Portfolio
2. Wallets
3. Send Bitcoin
4. Receive Bitcoin
5. Swap
6. Travel Mode
7. Security Center
8. Settings
9. Nomad Insights
10. Nomad Insights Spending
11. Recovery Center
12. Voltaire Protocols
13. BlockPages Safety
14. Time Clock Access
15. Unlock Wallet
16. Recover Lost Wallet
17. Verify Recovery Sequence
18. Wallet Recovered
19. Owner Authority Approval
20. Address Safety Detail
21. Top Up Travel Pocket
22. Approve POS Transaction
23. Create Owner Authority
24. BlockPages URL Scanner
25. Emergency Freeze
26. Nomad Watch

## Do not treat as production-ready until

- Phase 2D local checks pass.
- The local/demo wallet service is replaced or disabled for production.
- Demo seed fallback is removed.
- The selected wallet engine is integrated behind concrete adapters.
- Receive addresses and QR payloads come from the real wallet engine.
- Signing and broadcasting happen only inside the selected wallet engine/provider path.
- Swap quotes and execution are backed by a live provider.
- BlockPages scanner is backed by a live service.
- Travel Pocket/POS/freeze/recovery/watch features are backed by real services.
- All blockers in `PRODUCTION_BLOCKERS.md` are resolved or explicitly deferred outside release scope.
- Phase 4 production audit gates are completed.

## Handoff summary

This repository is ready to be passed to a developer as a structured integration package.

It should be described as:

> Nomad Phase 1 overlay complete, with Phase 2 wallet-engine integration, Phase 3 live-service integration, and Phase 4 production audit plans prepared. Production release remains blocked until the real wallet engine, live services, local audit pass, and production audits are complete.
