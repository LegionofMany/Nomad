# Nomad Developer Handoff

This document is the single-entry handoff guide for the Nomad mobile overlay work.

For the final repository-level handoff index, start with:

```txt
NOMAD_FINAL_HANDOFF_PACKAGE.md
```

## Project summary

Nomad is the branded mobile overlay for travel, protection, recovery, device, BlockPages safety, Voltaire Protocols, POS approval, and wallet command-center experiences.

Nomad is not the final production engine. A selected base engine must provide the live wallet implementation behind the Nomad adapter boundary.

## Current phase status

| Phase | Status | Notes |
| --- | --- | --- |
| Phase 1: Overlay Foundation | Complete | 26 screens, route registry, adapter contracts, hooks, local demo adapters, provider, screen audit, guardrails, and audit scripts are in place. |
| Phase 2A: Adapter contract hardening | Complete | Session, account, transaction, and safety adapter contracts have been expanded for integration readiness. |
| Phase 2B: Base-engine bridge scaffold | Complete | `mobile/nomad/adapters/clonedWalletAdapterTemplate.ts` defines the future engine bridge. |
| Phase 2C: Screen readiness pass | Complete | `mobile/nomad/PHASE_2C_SCREEN_READINESS_AUDIT.md` documents all 26 screens, readiness states, and demo/live replacement notes. |
| Phase 2D: Local compile/audit pass | Ready for developer | `mobile/nomad/PHASE_2D_LOCAL_AUDIT_CHECKLIST.md` gives the developer the install, typecheck, Expo launch, route smoke-test, and error-report workflow. |
| Phase 2E: Base engine selection/integration | Prepared | `mobile/nomad/PHASE_2E_BASE_ENGINE_SELECTION.md` defines engine selection criteria, integration shape, demo replacement checklist, and acceptance checks. |
| Phase 3: Live Nomad services | Prepared | `mobile/nomad/PHASE_3_LIVE_SERVICES_PLAN.md` defines the live service work for BlockPages, Travel Pocket, POS, freeze, recovery, Watch, Voltaire, and swap. |
| Phase 4: Production audit/release | Prepared | `mobile/nomad/PHASE_4_PRODUCTION_AUDIT_RELEASE.md` defines the final build, custody, signing, recovery, privacy, device, legal, app-store, and rollout gates. |

## Phase 1 completed scope

- 26 registered Nomad mobile screens.
- Shared route registry through `mobile/nomad/routes/nomadRoutes.ts`.
- Adapter contracts through `mobile/nomad/adapters/walletAdapter.ts`.
- Local demo adapters through `mobile/nomad/adapters/localNomadAdapters.ts`.
- Hook layer for wallet, travel, recovery, security, insights, swap, protocols, watch, settings, and safety.
- `NomadAdaptersProvider` so future engine-backed adapters can be injected without rewriting screens.
- Screen coverage audit registry.
- Guardrails preserving Nomad as the overlay layer.
- GitHub Actions, typecheck, and audit scripts.

## Screen inventory

1. Portfolio
2. Wallets
3. Send Bitcoin
4. Receive Bitcoin
5. Swap
6. Travel Mode / Travel Pocket
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

Every page should keep its own product reason. Do not flatten these screens into a generic template.

## Architecture

```txt
Selected base engine
        ↓
Concrete Nomad adapters
        ↓
NomadAdaptersProvider
        ↓
Nomad hooks
        ↓
26 Nomad screens
```

## Phase 2C completed: screen readiness pass

Before final integration, every screen has now been documented for:

- Loading state.
- Empty state.
- Error state.
- Locked state.
- Offline state where relevant.
- Demo/live replacement note.
- Route destination correctness.
- Adapter boundary correctness.

Read:

```txt
mobile/nomad/PHASE_2C_SCREEN_READINESS_AUDIT.md
```

## Phase 2D local audit checklist

A dedicated Phase 2D checklist has been added for the developer:

```txt
mobile/nomad/PHASE_2D_LOCAL_AUDIT_CHECKLIST.md
```

It covers:

- Fresh clone setup.
- Root dependency install.
- Mobile dependency install.
- Root TypeScript check.
- Mobile TypeScript check.
- Full Nomad audit command.
- Expo launch check.
- Manual 26-route smoke test.
- Known items to verify.
- Error report template.
- Phase 2D completion criteria.

## Phase 2E base engine selection and integration

A dedicated Phase 2E plan has been added for the developer:

```txt
mobile/nomad/PHASE_2E_BASE_ENGINE_SELECTION.md
```

It covers:

- Wallet engine selection criteria.
- Due diligence before choosing an engine.
- Concrete adapter implementation shape.
- Required wallet adapter methods.
- Demo service replacement checklist.
- Phase 2E acceptance checks.
- Clear separation between Phase 2E wallet custody work and Phase 3 live Nomad services.

## Phase 3 live Nomad services

A dedicated Phase 3 service plan has been added for the developer:

```txt
mobile/nomad/PHASE_3_LIVE_SERVICES_PLAN.md
```

It covers:

- BlockPages live URL/address safety services.
- Travel Pocket live funding and regional spending.
- POS approval and payment-action handoff.
- Emergency Freeze and pause-spending enforcement.
- Owner Authority and recovery backend.
- Nomad Watch live device sync.
- Voltaire Protocols live service status.
- Swap quote provider and execution handoff.
- Service observability, privacy, and audit trail requirements.

Phase 3 should be implemented behind adapters first. Screens should not call raw service clients directly.

## Phase 4 production audit and release

A dedicated Phase 4 release plan has been added for the developer:

```txt
mobile/nomad/PHASE_4_PRODUCTION_AUDIT_RELEASE.md
```

It covers:

- Build and TypeScript release gates.
- Wallet custody audit.
- Signing and broadcast audit.
- Receive address and QR audit.
- Recovery and Owner Authority audit.
- Emergency Freeze and security audit.
- BlockPages privacy/scanner audit.
- Travel Pocket and POS audit.
- Nomad Watch and device audit.
- 26-screen mobile QA smoke test.
- Legal, compliance, support, app-store, testnet, and rollout gates.

Phase 4 should only begin after the real wallet engine and live services are integrated or intentionally disabled behind clear production flags.

## Phase 2D local commands

Run from repository root:

```bash
npm install
npm run typecheck
npm run mobile:typecheck
npm run audit:nomad
```

Then run the mobile app:

```bash
cd mobile
npm install
npm run typecheck
npx expo start
```

Patch all TypeScript, import, bundler, and runtime errors before starting real engine integration.

## Known production blockers

The following must be resolved before release:

- Local demo service must be replaced or hardened.
- Demo-only fallback paths must be removed before production.
- Send, Swap, POS, and Travel Pocket top-up must move from draft-only to live engine handoff.
- Receive QR values must come from the live engine.
- BlockPages scanners must connect to a live backend/service.
- Emergency Freeze must be enforced by wallet/backend policy, not only UI state.
- Owner Authority must connect to real notification/approval backend.
- Recovery sequence must connect to real validation and abuse-case controls.
- Nomad Watch must connect to real device/session service.
- Time Set should be reconciled with full HH:MM:SS behavior if the product requires seconds.
- Full final audits are required before release.

## Recommended developer workflow

1. Read `NOMAD_FINAL_HANDOFF_PACKAGE.md`.
2. Read `NOMAD_PHASE_ROADMAP.md`.
3. Read `mobile/nomad/NOMAD_LAYER_GUARDRAILS.md`.
4. Read `mobile/nomad/PHASE_1_WIRING_AUDIT.md`.
5. Read `mobile/nomad/PHASE_2_WALLET_ENGINE_HANDOFF.md`.
6. Read `mobile/nomad/PHASE_2C_SCREEN_READINESS_AUDIT.md`.
7. Read `mobile/nomad/PHASE_2D_LOCAL_AUDIT_CHECKLIST.md`.
8. Read `mobile/nomad/PHASE_2E_BASE_ENGINE_SELECTION.md`.
9. Read `mobile/nomad/PHASE_3_LIVE_SERVICES_PLAN.md`.
10. Read `mobile/nomad/PHASE_4_PRODUCTION_AUDIT_RELEASE.md`.
11. Run the local commands listed above.
12. Complete Phase 2D compile/audit pass.
13. Select/import the base engine.
14. Implement a concrete adapter beside `clonedWalletAdapterTemplate.ts`.
15. Inject the concrete adapter through `NomadAdaptersProvider`.
16. Replace local demo services with production service adapters.
17. Begin Phase 3 live Nomad service integrations.
18. Begin Phase 4 release audit only after live engine integration and live service integration are complete.

## Handoff conclusion

This repository is ready to hand to a developer as a Phase 1 overlay package with Phase 2 integration preparation, Phase 3 service planning, and Phase 4 production release planning prepared. It is not ready for public release until Phase 2E, Phase 3, and Phase 4 are completed and passed.
