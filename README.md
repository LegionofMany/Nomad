# Nomad Wallet

Nomad Wallet is a non-custodial, travel-first wallet under Voltaire Protocols. It is designed around explicit owner consent, capped travel spending, NFC request safety, Blockpages411 destination checks, and a phased rollout from closed beta to production.

Nomad is currently GitHub-ready for continued development and closed beta testing.

Nomad is not yet approved for real funds.

## Current Status

```txt
Repository: LegionofMany/Nomad
Product: Nomad Wallet / Nomad Protocol
Phase: Closed beta / test mode scaffold
Real funds: Disabled
Production wallet engine: Pending audit and replacement
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
  Expo / React Native prototype

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

## GitHub Readiness

See:

```txt
docs/GITHUB_READY_CHECKLIST.md
docs/FEATURE_IMPLEMENTATION_STANDARD.md
```

Current verdict:

```txt
GitHub-ready for continued development: YES
GitHub-ready for production release: NO
Real funds allowed: NO
```

## Security Documentation

Key docs:

```txt
SECURITY.md
docs/security/THREAT_MODEL.md
docs/security/PRODUCTION_BLOCKERS.md
docs/security/KEY_MANAGEMENT.md
docs/security/OWNER_CONFIRMATION.md
docs/security/NFC_TRAVEL_MODE.md
docs/security/TRAVEL_POCKET.md
docs/security/RECOVERY_MODEL.md
docs/security/RELEASE_AUDIT_CHECKLIST.md
```

## Developer Next Steps

1. Review `docs/DEVELOPER_ONBOARDING.md`
2. Review `docs/ARCHITECTURE_OVERVIEW.md`
3. Review `docs/beta/CLOSED_BETA_PLAN.md`
4. Activate Android Gradle build files
5. Add tests for Travel Pocket, NFC request, owner confirmation, and release safety gate
6. Wire beta UI screens
7. Prepare Vercel-facing beta page
8. Replace development implementations before any real-funds release

## Release Warning

This repository contains development implementations for scaffold and beta testing. Do not use Nomad with real funds until production replacements, tests, CI checks, external audit, and release signing are complete.

## License

License to be finalized before public production release.
