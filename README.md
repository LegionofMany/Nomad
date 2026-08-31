# Nomad

Nomad is the finished travel, protection, recovery, approval, device, Reqrium safety, Arkrilium ecosystem, settings, and insights feature layer for a non-custodial wallet. It is designed around explicit owner consent, capped travel spending, request-only NFC, strict Time Key access, and ordered 24-Time-Set recovery verification.

The Nomad feature layer is wallet-ready. It deliberately does not choose, clone, or own a base wallet engine. The future wallet remains responsible for custody, private keys, accounts, signing, broadcasting, balances, provider access, and canonical transaction history.

Nomad is not yet approved for real funds. That restriction remains until a separately audited wallet engine and its production providers are connected through the included adapter contract.

## Current Status

```txt
Repository: LegionofMany/Nomad
Product: Nomad feature layer
Phase: Nomad overlay complete; future wallet integration ready
Real funds: Disabled
Wallet engine: Intentionally not included or selected
Expo native persistence: Device-encrypted storage
Web persistence: Browser preview storage, reported truthfully as non-production
External services: Adapter-ready and reported as not connected when absent
```

## Completion Gate

Run the same checks enforced by CI:

```bash
npm ci
npm --prefix mobile ci
npm run audit:nomad
npm test -- --runInBand
npm --prefix mobile run build:web
```

The Nomad-specific gate verifies:

- all 26 approved Nomad pages and 29 registered routes;
- no key custody or signing ownership in screen coverage;
- native encrypted persistence and cryptographically secure randomness;
- password verification, 24 unique ordered Time Sets, salted digests, and lockout;
- metadata-only recovery authorization that never claims keys were restored;
- the complete future-wallet bridge contract.

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
- Reqrium safety checks
- Phased capability rollout

## Overlay / Wallet Engine Boundary

Nomad is the branded overlay, protection, travel, recovery, approval, Watch, Reqrium, Arkrilium, settings, and insights layer.

The future base wallet engine must own custody, private keys, seed storage, account derivation, signing, broadcasting, providers, balances, and canonical transaction history.

```txt
Future wallet repository
        ↓
Strict wallet bridge (`createClonedWalletAdapter`)
        ↓
NomadAdaptersProvider
        ↓
Nomad hooks
        ↓
26 Nomad screens
```

Nomad screens may display wallet state, request quotes, prepare reviewable drafts, route approvals, show safety status, and manage overlay UX. Nomad screens do not store seed phrases, derive accounts, hold private keys, sign transactions, or broadcast transactions. Missing external providers remain visibly unavailable instead of being simulated as connected.

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
Insights, Spending, Recovery Center, Arkrilium Protocols, Reqrium Safety,
Time Clock Access, Unlock Wallet, Lost Wallet Recovery, Recovery Sequence,
Wallet Recovered, Owner Authority Approval, Address Safety Detail,
Top Up Travel Pocket, POS Approval, Create Owner Authority,
Reqrium URL Scanner, Emergency Freeze, Nomad Watch
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
- Reqrium safety boundary (legacy Android class names are retained for compatibility)
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
- Reqrium safety messaging

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

Run these before future-wallet integration and after every Nomad change:

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
Nomad feature layer complete: YES
Future-wallet bridge ready: YES
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

## Future Wallet Integration

1. Clone or add the wallet repository you choose later.
2. Implement `ClonedWalletEngineBridge` without passing seeds or private keys into Nomad.
3. Construct adapters with the strict `createClonedWalletAdapter` entry point.
4. Pass those adapters to `NomadAdaptersProvider`.
5. Verify the wallet’s own custody, signing, provider, recovery-receipt, and release audits before enabling real funds.

## Release Warning

This repository contains development implementations for scaffold and beta testing. Do not use Nomad with real funds until production replacements, tests, CI checks, external audit, and release signing are complete.

## License

License to be finalized before public production release.
