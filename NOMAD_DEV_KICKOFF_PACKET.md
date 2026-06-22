# Nomad Developer Kickoff Packet

This packet is the final developer-start guide for turning the prepared Nomad overlay and handoff package into an executable integration project.

## Current Build Position

Nomad is currently in a handoff-ready state for developer execution.

- Phase 1: Overlay Foundation — Complete
- Phase 2A: Adapter Contract Hardening — Complete
- Phase 2B: Cloned/Base Wallet Bridge Scaffold — Complete
- Phase 2C: Screen Readiness Audit — Complete
- Phase 2D: Local Compile and Audit Execution — Ready for developer machine
- Phase 2E: Base Wallet Engine Selection and Integration — Prepared, not completed
- Phase 3: Live Nomad Services — Prepared, not completed
- Phase 4: Production Audit and Release — Prepared, not completed

## What Nomad Still Is

The Nomad product vision has not changed.

Nomad is the branded wallet overlay, protection layer, travel-spend layer, recovery layer, approval layer, and Voltaire Protocols command surface.

Nomad should not be reduced into a generic wallet skin.

## Non-Negotiable Architecture Boundary

The selected base wallet engine must own:

- wallet creation and import
- seed/private-key storage
- account derivation
- chain/provider configuration
- real balances
- receive addresses
- canonical transaction history
- signing
- broadcasting
- lock/unlock session enforcement

Nomad may own:

- UX and routes
- dashboard and insights
- Travel Pocket interface
- Time Sets and recovery interface
- Owner Authority approval interface
- Emergency Freeze controls
- BlockPages scanner interface
- Nomad Watch interface
- Voltaire Protocols interface
- settings and security preference surfaces
- transaction draft handoff and user approval routing

## Developer Start Order

1. Read `NOMAD_FINAL_HANDOFF_PACKAGE.md`.
2. Read `DEV_HANDOFF.md`.
3. Read `NOMAD_DEVELOPER_EXECUTION_CHECKLIST.md`.
4. Read `PRODUCTION_BLOCKERS.md`.
5. Read `ENVIRONMENT_SETUP.md`.
6. Run the local audit commands from `mobile/nomad/PHASE_2D_LOCAL_AUDIT_CHECKLIST.md`.
7. Fix any compile, dependency, route, or Expo errors.
8. Select the base wallet engine according to `mobile/nomad/PHASE_2E_BASE_ENGINE_SELECTION.md`.
9. Implement concrete adapters behind `NomadAdaptersProvider`.
10. Connect Phase 3 live services behind adapters.
11. Run Phase 4 production release gates.

## GitHub Issue Execution Board

The remaining execution work is tracked in GitHub issues:

- #11 — Phase 2D: Run local compile and audit pass
- #12 — Phase 2E: Select and integrate base wallet engine
- #13 — Phase 3: Connect live Nomad services through adapters
- #14 — Phase 4: Complete production audit and release gates

## First Developer Command Set

From a fresh clone:

```bash
npm install
npm run typecheck
npm run audit:nomad
```

Then run the mobile app:

```bash
cd mobile
npm install
npm run typecheck
npm run start
```

## First QA Requirement

After Expo launches, the developer should smoke-test all 26 Nomad overlay screens.

Each screen should be checked for:

- route access
- loading state
- empty state
- error state
- navigation path
- adapter data usage
- no direct key/seed/signing ownership
- no broken visual layout

## Production Blockers To Clear

Nomad is not production-ready until these are cleared:

- selected base wallet engine integrated
- demo seed fallback removed or disabled
- real receive address and QR generation connected
- real balances and history connected
- signing and broadcasting connected only through wallet engine
- swap provider connected or feature-flagged
- BlockPages live scanner connected or feature-flagged
- Travel Pocket and POS rails connected or feature-flagged
- Emergency Freeze enforced by wallet engine/service path
- Owner Authority and recovery enforced by backend/service path
- Nomad Watch live-device sync connected or feature-flagged
- all local and CI checks passing
- Phase 4 production audit signed off

## Completion Definition

Nomad is complete only when:

1. The 26-screen overlay passes mobile QA.
2. TypeScript and Expo checks pass.
3. The selected wallet engine is integrated behind adapters.
4. Nomad does not store secrets, derive accounts, sign, or broadcast directly.
5. Live services are connected or safely feature-flagged.
6. Production blockers are cleared.
7. Phase 4 audit gates are complete.
8. The final release build is approved.

Until then, the repository is best described as:

> Nomad Phase 1 overlay and complete developer handoff package are complete. Remaining work is developer execution of Phase 2D through Phase 4.
