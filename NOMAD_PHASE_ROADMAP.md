# Nomad Four Phase Roadmap

Nomad is the branded overlay layer for wallet, travel, protection, recovery, device, and Voltaire Protocols experiences. The cloned or imported base wallet remains responsible for private keys, seed storage, account derivation, signing, transaction broadcast, chain providers, balances, and transaction history.

This roadmap keeps work moving even before a final open-source base wallet is selected.

## Phase 1: Overlay Foundation

**Status:** Complete as a Phase 1 handoff build.

### Completed scope

- 26 Nomad mobile screens created and route registered.
- Shared Nomad route registry added.
- Nomad adapter contracts added.
- Local/demo adapters added for frontend wiring.
- Hook layer added for wallet, travel, recovery, security, insights, swap, protocols, watch, settings, and safety.
- Nomad adapter provider added so future cloned-wallet adapters can be injected without rewriting screens.
- Screen coverage audit registry added.
- Guardrails added to preserve Nomad as overlay, not the custody/signing engine.
- Typecheck/audit scripts and GitHub Actions workflow added.

### Phase 1 output

Phase 1 proves the Nomad user experience, screen coverage, and adapter boundaries. It is ready for dev-team review and Phase 2 integration work.

## Phase 2: Wallet Engine Readiness and Adapter Integration

**Status:** Prepared through Phase 2E; Phase 2D must still be run by the developer locally or in CI before live integration work is accepted.

Phase 2 can continue before selecting or cloning a specific open-source wallet repository. The goal is to make the Nomad side ready for any compatible wallet engine.

### Phase 2A: Integration contract hardening

**Status:** Complete.

- Confirm every adapter method has a clear responsibility.
- Split demo-only methods from production-required methods.
- Add TODO markers where the cloned wallet must provide custody, signing, broadcast, balances, history, receive addresses, and pricing.
- Add stricter TypeScript interfaces for wallet accounts, chains, transaction drafts, signed transactions, and broadcast results.
- Add clear failure states for unsupported chains, locked wallet, expired session, missing provider, and rejected signing.

### Phase 2B: Wallet engine bridge scaffolding

**Status:** Complete.

- Create a `mobile/nomad/adapters/clonedWalletAdapterTemplate.ts` file.
- Keep it unimplemented or safely stubbed until a real base wallet is selected.
- Map the exact adapter methods that the cloned wallet must fill.
- Add developer comments explaining where wallet engine APIs connect.
- Ensure the template never stores raw seed phrases or private keys.

### Phase 2C: Screen readiness pass

**Status:** Complete.

- Review all 26 screens for loading, error, empty, and locked states.
- Confirm transaction screens only request drafts until the base wallet signs.
- Confirm recovery and owner-authority flows do not imply funds can be recovered without the actual wallet engine.
- Confirm emergency freeze UI is clearly an overlay request until the backend/wallet engine enforces it.

### Phase 2D: Local audit and compile pass

**Status:** Ready for developer execution.

Run:

```bash
npm install
npm run audit:nomad
cd mobile
npm run typecheck
npx expo start
```

Patch all TypeScript, import, and runtime errors before beginning real wallet engine integration.

### Phase 2E: Base wallet selection and integration

**Status:** Prepared.

Once a base wallet is selected:

- Import or clone the wallet engine.
- Replace the local demo wallet service.
- Implement real wallet creation/import.
- Implement secure key storage.
- Implement real account/address derivation.
- Implement real receive addresses and QR values.
- Implement real balances and transaction history.
- Implement real transaction signing and broadcasting.
- Remove all demo-only seed fallback paths before production.

## Phase 3: Live Nomad Services

**Status:** Prepared after Phase 2 foundation is stable.

Phase 3 turns Nomad's special overlay features into live services.

### Phase 3 scope

- Live BlockPages URL and address scanner.
- Real wallet risk scoring and warning results.
- Live Travel Pocket funding and regional spending logic.
- Live POS approval flow.
- Enforced emergency freeze and pause-spending controls.
- Real Owner Authority approval and notification backend.
- Recovery backend and recovery status tracking.
- Nomad Watch device sync and action bridge.
- Voltaire Protocols live service status and navigation.
- Swap quote provider and execution handoff to the wallet engine.

### Phase 3 output

Nomad becomes a live protection, travel, recovery, and protocol overlay instead of a local/demo front-end shell.

## Phase 4: Production Audit and Release

**Status:** Prepared as final release-gate plan.

### Phase 4 scope

- Full mobile build audit.
- Full TypeScript audit.
- Wallet custody audit.
- Seed/private-key storage audit.
- Signing and broadcast audit.
- Receive address and QR audit.
- Recovery attack-path audit.
- Freeze/owner-authority abuse-case audit.
- BlockPages scanner privacy audit.
- Travel Pocket and POS audit.
- Nomad Watch and device audit.
- Device testing on iOS and Android.
- Testnet rollout.
- Mainnet rollout plan.
- Terms, privacy policy, and support procedures.
- App Store and Play Store release preparation.
- Final dev-team handoff and release signoff.

### Phase 4 output

Nomad can be called production-ready only after Phase 2E wallet integration is complete, Phase 3 live services are complete or safely disabled behind production flags, and every Phase 4 gate passes.

## Current honest status

Nomad is complete for Phase 1 overlay architecture. Phase 2A, 2B, and 2C are complete. Phase 2D must still be run by the developer, and Phase 2E requires selecting and integrating the real wallet engine. Phase 3 and Phase 4 plans are now prepared for the developer.

It is not production-ready as a real wallet until Phase 2E replaces the local/demo wallet layer with a secure wallet engine, Phase 3 connects or disables live services properly, and Phase 4 audits the final production build.

## Next recommended action

Complete the local Phase 2D compile/audit checklist, then select the base wallet engine and begin Phase 2E concrete adapter implementation.
