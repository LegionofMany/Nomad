# Nomad Production Blockers Register

This file is the release-blocker register for Nomad. It is intentionally direct so the development team can separate the completed overlay/handoff work from the remaining production implementation work.

## Current Release Classification

Nomad is currently a Phase 1 overlay and developer-handoff build.

It is not production-ready until the selected base wallet engine, live service adapters, local build checks, and Phase 4 audits are complete.

## Non-Negotiable Product Boundary

Nomad may:

- Display wallet state.
- Request receive addresses from the wallet engine.
- Request balances and transaction history from the wallet engine.
- Prepare reviewable transaction drafts.
- Route user approvals.
- Display safety, travel, recovery, watch, settings, insights, and protocol status.
- Coordinate overlay flows through adapters and hooks.

Nomad must not:

- Store seed phrases.
- Store private keys.
- Derive accounts.
- Sign transactions from screens.
- Broadcast transactions from screens.
- Bypass user approval.
- Treat local/demo adapters as production services.
- Collapse the 26-page product into a generic wallet shell.

## Blocker 1 — Real Wallet Engine Not Integrated

The selected base wallet engine still needs to be integrated underneath the Nomad adapter provider.

Required before production:

- Wallet creation/import.
- Secure seed/private-key custody.
- Account derivation.
- Chain/provider management.
- Session state.
- Lock/unlock flow.
- Signing.
- Broadcasting.
- Canonical transaction history.

Owner: Phase 2E.

## Blocker 2 — Demo Seed Fallback Must Be Removed or Disabled

The local/demo wallet service includes a fallback path for development environments where production secure storage is not available.

Required before production:

- Remove unsafe seed fallback from production builds, or gate it behind development-only flags.
- Confirm no seed/plain-secret storage path exists in release mode.
- Confirm secure storage behavior on iOS and Android devices.

Owner: Phase 2E / Phase 4 custody audit.

## Blocker 3 — Signing and Broadcast Are Not Production-Connected

Send, Swap, POS approval, Travel Pocket top-up, and related flows currently prepare draft/handoff data only.

Required before production:

- Wallet-engine approval screen.
- User confirmation before signing.
- Engine-owned signing.
- Engine-owned broadcast.
- Success/failure receipts.
- Transaction history refresh.

Owner: Phase 2E / Phase 4 signing audit.

## Blocker 4 — Receive Address and QR Flow Must Be Real

Receive screens currently depend on adapter-provided receive addresses. The selected wallet engine must provide chain-correct addresses.

Required before production:

- Real BTC/EVM/Hedera/other supported-chain receive address generation.
- Address derivation validation.
- QR payload validation.
- Copy/share behavior validation.
- Network/asset mismatch protection.

Owner: Phase 2E / Phase 4 receive-address audit.

## Blocker 5 — Swap Provider Is Not Live

The swap path is prepared as a quote/draft adapter boundary, not a production liquidity service.

Required before production:

- Live quote provider.
- Slippage controls.
- Route disclosure.
- Fees disclosure.
- Wallet-engine execution handoff.
- Failed quote and failed execution states.

Owner: Phase 3 / Phase 4 signing audit.

## Blocker 6 — BlockPages Scanner Is Not Live

BlockPages URL and address scanner screens are wired to adapter paths but still need production scanner services.

Required before production:

- Live URL scanner endpoint/service.
- Live address risk scoring.
- Privacy-preserving request handling.
- Abuse/rate-limit controls.
- Audit trail for scanner result sources.
- User-safe warning language.

Owner: Phase 3 / Phase 4 privacy/scanner audit.

## Blocker 7 — Travel Pocket and POS Rails Are Not Live

Travel Pocket and POS approval UX is prepared, but the payment/spend rail is not production-connected.

Required before production:

- Funding source validation.
- Regional stable-value routing.
- Spend-limit enforcement.
- POS payment handoff.
- Decline/refund/failure handling.
- Compliance and risk review.

Owner: Phase 3 / Phase 4 Travel Pocket/POS audit.

## Blocker 8 — Emergency Freeze Is Not Enforced by the Wallet Engine Yet

Emergency Freeze currently has overlay state. Production freeze must enforce through the wallet engine and/or service controls.

Required before production:

- Freeze scope definitions.
- Wallet-engine transaction block.
- Session revoke behavior.
- Owner Authority escalation behavior.
- Clear audit trail.
- Recovery path after freeze.

Owner: Phase 3 / Phase 4 security audit.

## Blocker 9 — Owner Authority and Recovery Need Backend Enforcement

Recovery and Owner Authority flows are mapped, but production enforcement needs backend or wallet-engine support.

Required before production:

- Signer identity model.
- Approval quorum.
- Recovery challenge validation.
- Anti-takeover controls.
- Rate limits and cooldowns.
- Audit logs.

Owner: Phase 3 / Phase 4 recovery audit.

## Blocker 10 — Time Sets Need Final Engine Compatibility

The UI and overlay describe Time Set behavior, but the underlying engine must support the final resolution and unlock rules.

Required before production:

- Confirm HH:MM:SS or final time-resolution model.
- Confirm lock/unlock enforcement path.
- Confirm timezone/device-time handling.
- Confirm attack-path protections for clock changes.

Owner: Phase 2E / Phase 4 recovery and custody audit.

## Blocker 11 — Nomad Watch Is Not Live-Device Connected

Nomad Watch has the overlay page and adapter boundary, but not the production device sync layer.

Required before production:

- Device pairing.
- Secure sync.
- Watch approval model.
- Watch emergency action validation.
- Battery/firmware/sync status from real device source.
- Lost-device and revoke-device flow.

Owner: Phase 3 / Phase 4 device audit.

## Blocker 12 — Voltaire Protocols Status Is Not Live

The Voltaire Protocols page is prepared as a hub, but production status and protocol telemetry need real service data.

Required before production:

- Live protocol status source.
- Health/status endpoints.
- Outage and degraded-state handling.
- User-facing incident/status language.

Owner: Phase 3.

## Blocker 13 — Local Compile and Expo Run Must Pass

The repository has audit scripts and workflow files, but the local compile result must be produced by a developer machine or CI run.

Required before production:

```bash
npm install
npm run audit:nomad
cd mobile
npm install
npm run typecheck
npm run start
```

Owner: Phase 2D.

## Blocker 14 — 26-Screen QA Smoke Test Must Pass

Every Nomad screen must open, route, display safe states, and preserve its reason.

Required before production:

- Confirm all 26 screens route correctly.
- Confirm loading, error, empty, and locked states.
- Confirm no screen owns key/signing logic.
- Confirm no screen is removed, duplicated, or collapsed.

Owner: Phase 2D / Phase 4 mobile QA.

## Completion Rule

Nomad can only move from handoff build to production candidate after:

1. Phase 2D local checks pass.
2. Phase 2E wallet engine integration is complete.
3. Phase 3 live service adapters are connected or safely feature-flagged.
4. All blockers in this file are resolved or explicitly deferred outside release scope.
5. Phase 4 production audits pass.
