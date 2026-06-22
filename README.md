# Nomad Wallet

Nomad Wallet is a non-custodial, travel-first wallet under Voltaire Protocols. It is designed around explicit owner consent, capped travel spending, NFC request safety, Blockpages411 destination checks, and a phased rollout from closed beta to production.

Nomad is currently GitHub-ready for continued development and developer execution handoff.

Nomad is not yet approved for real funds.

## Current Status

```txt
Repository: LegionofMany/Nomad
Product: Nomad Wallet / Nomad Protocol
Phase: Phase 1 overlay complete; Phase 2D developer/local audit ready
Real funds: Disabled
Production wallet engine: Pending selection, audit, and integration
Live services: Prepared in plan; not production-connected yet
```

## Developer Handoff Start Here

Start with the final handoff packet before changing code:

```txt
NOMAD_DEV_KICKOFF_PACKET.md
NOMAD_FINAL_HANDOFF_PACKAGE.md
DEV_HANDOFF.md
NOMAD_DEVELOPER_EXECUTION_CHECKLIST.md
ENVIRONMENT_SETUP.md
PRODUCTION_BLOCKERS.md
```

The current developer execution path is:

```txt
1. Read NOMAD_DEV_KICKOFF_PACKET.md
2. Read NOMAD_FINAL_HANDOFF_PACKAGE.md
3. Run the Phase 2D local audit from ENVIRONMENT_SETUP.md
4. Record results in mobile/nomad/PHASE_2D_EXECUTION_REPORT_TEMPLATE.md
5. Fix TypeScript, Expo, dependency, and route-smoke-test issues
6. Select and integrate the base wallet engine behind the Nomad adapter provider
7. Connect live Nomad services behind adapters
8. Complete Phase 4 production audit and release gates
```

## Core Product Direction

Nomad is built for users who need a wallet that can travel safely across regions while keeping control in the hands of the wallet owner.

Core principles:

- Non-custodial wallet ownership
- Explicit confirmation for every payment
- NFC off by default
- NFC can request, but cannot approve
- Travel Pocket spending caps
- Main wallet isolation from travel spending
- Clock unlock and recovery concepts
- Blockpages411 safety checks
- Phased capability rollout

## Overlay / Wallet Engine Boundary

Nomad is the branded overlay, protection, travel, recovery, approval, Watch, BlockPages, Voltaire, settings, and insights layer.

The selected base wallet engine must own custody, private keys, seed storage, account derivation, signing, broadcasting, providers, balances, and canonical transaction history.

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

Nomad screens may display wallet state, request quotes, prepare reviewable drafts, route approvals, show safety status, and manage overlay UX. Nomad screens must not store seed phrases, derive accounts, hold private keys, sign transactions, or broadcast transactions.

## Nomad Mobile Overlay

The React Native / Expo overlay lives in:

```txt
mobile/
mobile/nomad/
mobile/screens/
```

The current mobile overlay includes 26 wired Nomad screens covering:

```txt
Portfolio, Wallets, Send, Receive, Swap, Travel Mode, Security Center, Settings,
Insights, Spending, Recovery Center, Voltaire Protocols, BlockPages Safety,
Time Clock Access, Unlock Wallet, Lost Wallet Recovery, Recovery Sequence,
Wallet Recovered, Owner Authority Approval, Address Safety Detail,
Top Up Travel Pocket, POS Approval, Create Owner Authority,
BlockPages URL Scanner, Emergency Freeze, Nomad Watch
```

The code-level screen coverage registry is here:

```txt
mobile/nomad/audit/screenCoverage.ts
```

## Samourai Reference Foundation

Nomad uses the public Samourai Wallet Android project as an architecture reference for mobile wallet organization, onboarding, backup/restore flow, transaction review boundaries, and Android wallet structure.

Nomad does not blindly clone Samourai.

Nomad does not import mixer, tumbler, laundering, obfuscation, or compliance-avoidance features into core wallet functionality.

Reference document:

```txt
docs/samourai-reference-map.md
```

## Major Modules

```txt
mobile/
  Expo / React Native prototype and Nomad overlay

mobile/nomad/
  Nomad overlay adapters, hooks, shared components, route/audit files, and phase docs

android-nomad/
  Android-native Nomad scaffold

src/
  TypeScript wallet/security/travel modules

docs/
  Product, rollout, GitHub readiness, and security documentation

docs/security/
  Threat model, production blockers, owner confirmation, NFC, Travel Pocket, recovery, key management

docs/beta/
  Closed beta plan and phased public rollout
```

## Android-Native Nomad Layer

The Android-native scaffold lives at:

```txt
android-nomad/app/src/main/java/protocols/voltaire/nomad/
```

Current Android-native modules include:

- Wallet engine interface and development engine
- Secure storage gateway and development storage
- Clock unlock interface and basic development implementation
- Owner confirmation gateway
- Travel Mode manager
- Travel Pocket manager
- NFC payment gateway
- Travel payment policy and coordinator
- Blockpages411 safety client
- Beta capability flags
- Release safety gate
- Development safety report

## Closed Beta Mode

Closed beta is enabled for test/demo flows only.

Enabled beta flows:

- Demo wallet creation
- Demo wallet restore
- Clock unlock demo
- Travel Mode setup
- Travel Pocket simulation
- NFC request simulation
- Owner confirmation simulation
- Blockpages411 safety messaging

Blocked until production replacement and audit:

- Real funds
- Real stablecoin settlement
- Real production private-key custody
- Production merchant acceptance
- Main-wallet direct NFC spending
- Silent signing
- Background approval

## Travel Wallet Flow

```txt
NFC / QR / manual request
   ↓
TravelPaymentIntent
   ↓
TravelPaymentCoordinator.reviewPayment()
   ↓
Travel Pocket balance and limit checks
   ↓
OwnerConfirmationGateway.requestConfirmation()
   ↓
TravelPaymentCoordinator.recordOwnerApproval()
   ↓
Travel Pocket debit only after owner approval
```

## Safety Gate

Nomad currently keeps real funds disabled through:

```txt
android-nomad/app/src/main/java/protocols/voltaire/nomad/security/ProductionReadiness.kt
android-nomad/app/src/main/java/protocols/voltaire/nomad/security/ReleaseSafetyGate.kt
```

Current rule:

```txt
REAL_FUNDS_ALLOWED = false
```

## Local Audit Commands

Run these before engine integration and after every major implementation pass:

```bash
npm install
npm run typecheck
npm run audit:nomad

cd mobile
npm install
npm run typecheck
npm run start
```

Use:

```txt
ENVIRONMENT_SETUP.md
mobile/nomad/PHASE_2D_LOCAL_AUDIT_CHECKLIST.md
mobile/nomad/PHASE_2D_EXECUTION_REPORT_TEMPLATE.md
```

## GitHub Readiness

See:

```txt
docs/GITHUB_READY_CHECKLIST.md
docs/FEATURE_IMPLEMENTATION_STANDARD.md
NOMAD_FINAL_HANDOFF_PACKAGE.md
NOMAD_HANDOFF_CLOSEOUT_AUDIT.md
```

Current verdict:

```txt
GitHub-ready for continued development: YES
GitHub-ready for developer handoff: YES
GitHub-ready for production release: NO
Real funds allowed: NO
```

## Security Documentation

Key docs:

```txt
SECURITY.md
docs/security/THREAT_MODEL.md
docs/security/PRODUCTION_BLOCKERS.md
PRODUCTION_BLOCKERS.md
docs/security/KEY_MANAGEMENT.md
docs/security/OWNER_CONFIRMATION.md
docs/security/NFC_TRAVEL_MODE.md
docs/security/TRAVEL_POCKET.md
docs/security/RECOVERY_MODEL.md
docs/security/RELEASE_AUDIT_CHECKLIST.md
```

## Developer Next Steps

1. Review `NOMAD_DEV_KICKOFF_PACKET.md`.
2. Review `NOMAD_FINAL_HANDOFF_PACKAGE.md`.
3. Review `ENVIRONMENT_SETUP.md` and run Phase 2D local audit.
4. Record results in `mobile/nomad/PHASE_2D_EXECUTION_REPORT_TEMPLATE.md`.
5. Fix any TypeScript, Expo, dependency, or route smoke-test issues.
6. Select and integrate the production wallet engine through `mobile/nomad/adapters/clonedWalletAdapterTemplate.ts`.
7. Connect Phase 3 live services through adapters.
8. Complete Phase 4 production audit and release gates before real funds.

## Release Warning

This repository contains development implementations for scaffold and beta testing. Do not use Nomad with real funds until production replacements, tests, CI checks, external audit, and release signing are complete.

## License

License to be finalized before public production release.
