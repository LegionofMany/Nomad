# Nomad GitHub Issue Board

This file is the repository-level issue board index for the remaining Nomad execution work.

Nomad's concept has not changed. Nomad remains the branded wallet overlay and protection layer. The selected/base wallet engine remains responsible for custody, account derivation, private keys, signing, broadcasting, providers, balances, and canonical transaction history.

## Current execution position

```txt
Phase 1: Overlay foundation - complete
Phase 2A: Adapter contract hardening - complete
Phase 2B: Cloned-wallet bridge scaffold - complete
Phase 2C: Screen readiness audit - complete
Phase 2D: Developer/local audit execution - open issue
Phase 2E: Base wallet engine integration - open issue
Phase 3: Live Nomad services - open issue
Phase 4: Production audit and release - open issue
```

## Active execution issues

### Issue #11 - Phase 2D: Run local compile and audit pass

Purpose: verify that the repository installs, typechecks, launches in Expo, and routes through all 26 Nomad screens.

Required result before closing:

- Root dependencies install successfully.
- Mobile dependencies install successfully.
- Root TypeScript check passes or documented errors are fixed.
- Mobile TypeScript check passes or documented errors are fixed.
- `npm run audit:nomad` passes.
- Expo starts.
- All 26 Nomad screens smoke-test successfully.
- `mobile/nomad/PHASE_2D_EXECUTION_REPORT_TEMPLATE.md` is filled out.

### Issue #12 - Phase 2E: Select and integrate base wallet engine

Purpose: connect the real wallet engine underneath Nomad through adapters.

Required result before closing:

- Base wallet engine is selected and documented.
- Secure wallet creation/import is connected.
- Secure key storage is connected.
- Receive addresses are real.
- Balances and transaction history are real.
- Signing and broadcasting are owned by the wallet engine.
- Demo seed fallback is removed or disabled for production.
- Nomad screens still only request, display, route, and prepare drafts.

### Issue #13 - Phase 3: Connect live Nomad services through adapters

Purpose: replace demo/local service states with live backend/service integrations behind adapters.

Required result before closing:

- BlockPages live scanner is connected or feature-flagged.
- Travel Pocket rails are connected or feature-flagged.
- POS approval is connected to the wallet/payment path.
- Emergency Freeze is enforceable by the wallet engine/service layer.
- Owner Authority and recovery backend are connected.
- Nomad Watch sync is connected or feature-flagged.
- Voltaire Protocols status uses live data or a documented backend placeholder.
- Swap quotes come from a real provider and execution remains wallet-engine-owned.

### Issue #14 - Phase 4: Complete production audit and release gates

Purpose: complete final security, privacy, custody, build, QA, legal, and release checks.

Required result before closing:

- Build/typecheck gates pass.
- Custody audit passes.
- Signing/broadcast audit passes.
- Receive address and QR audit passes.
- Recovery and Owner Authority audit passes.
- Emergency Freeze/security audit passes.
- BlockPages scanner/privacy audit passes.
- Travel Pocket/POS audit passes.
- Nomad Watch/device audit passes.
- 26-screen mobile QA passes.
- Legal/support/app-store/testnet/mainnet rollout items are complete.
- Final production signoff is recorded.

## Non-negotiable guardrail

Do not collapse Nomad into a generic wallet template. The 26 Nomad screens are part of the product definition and each has a reason.

```txt
Nomad may: display, request, draft, route, approve, protect, recover, freeze, scan, sync, and guide.

Wallet engine must: derive, store, sign, broadcast, index, and provide canonical chain state.
```

## Recommended developer order

1. Read `NOMAD_DEV_KICKOFF_PACKET.md`.
2. Read `NOMAD_FINAL_HANDOFF_PACKAGE.md`.
3. Run Phase 2D and fill `mobile/nomad/PHASE_2D_EXECUTION_REPORT_TEMPLATE.md`.
4. Complete Issue #11.
5. Start Issue #12 only after Phase 2D is understood.
6. Complete Issue #13 after the wallet engine boundary is stable.
7. Complete Issue #14 last.

## Closeout statement

The repo is ready for developer execution, not production release. Production readiness requires completion of Issues #11 through #14 and all Phase 4 release gates.
