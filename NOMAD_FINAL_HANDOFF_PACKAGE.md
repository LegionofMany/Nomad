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
| Phase 2D — Local Compile / Audit Execution | Ready for developer | The checklist, environment setup guide, and execution report template exist, but commands must be run on a local machine or CI. |
| Phase 2E — Base Wallet Engine Integration | Prepared | The selection/integration plan exists; the real engine is not connected yet. |
| Phase 3 — Live Services | Prepared | Live service roadmap exists for BlockPages, Travel Pocket, POS, freeze, recovery, Watch, protocols, and swaps. |
| Phase 4 — Production Audit / Release | Prepared | Release gates and production blockers are documented but not yet passed. |
| Developer Kickoff | Complete | The final developer-start packet now exists and points to the first execution path. |
| Handoff Closeout | Complete | Final consistency and closeout audit file exists for developer handoff. |
| GitHub Issue Board | Complete | Remaining developer execution is indexed through Issues #11–#14. |

## Primary handoff files

1. `NOMAD_DEV_KICKOFF_PACKET.md` — final developer-start packet and execution order.
2. `NOMAD_FINAL_HANDOFF_PACKAGE.md` — this top-level handoff index.
3. `NOMAD_GITHUB_ISSUE_BOARD.md` — GitHub issue board index for Issues #11–#14.
4. `NOMAD_HANDOFF_CLOSEOUT_AUDIT.md` — final closeout audit before developer execution.
5. `DEV_HANDOFF.md` — main developer handoff guide.
6. `NOMAD_DEVELOPER_EXECUTION_CHECKLIST.md` — task-board style execution checklist.
7. `ENVIRONMENT_SETUP.md` — setup, install, typecheck, Expo, and smoke-test guide.
8. `PRODUCTION_BLOCKERS.md` — release blocker register.
9. `NOMAD_PHASE_ROADMAP.md` — 4-phase roadmap.
10. `mobile/nomad/NOMAD_LAYER_GUARDRAILS.md` — overlay boundary rules.
11. `mobile/nomad/PHASE_1_WIRING_AUDIT.md` — Phase 1 overlay wiring report.
12. `mobile/nomad/PHASE_2_WALLET_ENGINE_HANDOFF.md` — wallet-engine handoff notes.
13. `mobile/nomad/PHASE_2C_SCREEN_READINESS_AUDIT.md` — all 26 screen readiness checks.
14. `mobile/nomad/PHASE_2D_LOCAL_AUDIT_CHECKLIST.md` — local compile and audit checklist.
15. `mobile/nomad/PHASE_2D_EXECUTION_REPORT_TEMPLATE.md` — report template for developer/local audit results.
16. `mobile/nomad/PHASE_2E_BASE_ENGINE_SELECTION.md` — base wallet selection and integration plan.
17. `mobile/nomad/PHASE_3_LIVE_SERVICES_PLAN.md` — live service integration plan.
18. `mobile/nomad/PHASE_4_PRODUCTION_AUDIT_RELEASE.md` — production release gates.
19. `NOMAD_HANDOFF_CONSISTENCY_AUDIT.md` — consistency audit across handoff files.
20. `mobile/nomad/audit/screenCoverage.ts` — code-level 26-screen coverage registry.
21. `mobile/nomad/adapters/clonedWalletAdapterTemplate.ts` — adapter scaffold for the real wallet engine.

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

Start with `NOMAD_DEV_KICKOFF_PACKET.md`, then run these checks first:

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

Use `ENVIRONMENT_SETUP.md` for the full setup and error-reporting process. Record the results in `mobile/nomad/PHASE_2D_EXECUTION_REPORT_TEMPLATE.md`.
