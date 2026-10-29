# Nomad Developer Onboarding

This guide helps a new developer understand the Nomad repository and continue building without needing to reconstruct the project history.

---

## Project Summary

Nomad Wallet is a travel-first, non-custodial wallet under Voltaire Protocols.

It combines:

- Nomad-specific clock authority
- Explicit owner confirmation
- Travel Mode
- Limited Travel Pocket boundaries
- Blockpages411 destination context
- Closed beta capability flags
- Release safety gates
- Samourai foundation evaluation, not blind cloning

---

## Current Phase

```txt
Phase G / Production Readiness
Current state: Closed beta / development scaffold
Real funds: Disabled
Production release: Blocked
```

Nomad is GitHub-ready for continued development, architecture review, and scaffold hardening.

Nomad is not production-ready and must not be used with real funds.

---

## Repository Map

```txt
README.md
  Main project overview and current status

mobile/
  Expo / React Native prototype area

android-nomad/
  Android-native Nomad scaffold

src/
  TypeScript wallet-core, security, and travel modules

docs/
  Product, architecture, rollout, and readiness docs

docs/architecture/
  Wallet, clock authority, Travel Pocket, and foundation evaluation flows

docs/security/
  Threat model, production blockers, key management, release audit checklist

docs/beta/
  Closed beta and rollout docs

.github/workflows/
  Repository safety checks
```

---

## Android-Native Entry Points

```txt
android-nomad/app/src/main/java/protocols/voltaire/nomad/MainActivity.kt
android-nomad/app/src/main/java/protocols/voltaire/nomad/NomadApplication.kt
android-nomad/app/src/main/java/protocols/voltaire/nomad/di/NomadServiceContainer.kt
```

Start with `NomadServiceContainer.kt` to understand what is currently wired.

---

## Key Architecture Documents

Read these before implementation:

```txt
docs/architecture/WALLET_FLOW.md
docs/architecture/CLOCK_AUTHORITY_FLOW.md
docs/architecture/TRAVEL_POCKET_FLOW.md
docs/architecture/SAMOURAI_FOUNDATION_EVALUATION.md
docs/ANDROID_BUILD_ACTIVATION.md
```

These documents define expected behavior before production components are implemented.

---

## Important Android Modules

```txt
beta/
  BetaMode.kt
  CapabilityFlags.kt

blockpages/
  BlockpagesSafetyClient.kt
  DevelopmentBlockpagesSafetyClient.kt

security/
  ClockUnlockManager.kt
  BasicClockUnlockManager.kt
  SecureStorageGateway.kt
  InMemorySecureStorageGateway.kt
  OwnerConfirmationGateway.kt
  DevelopmentOwnerConfirmationGateway.kt
  ProductionReadiness.kt
  ReleaseSafetyGate.kt
  DevelopmentSafetyReport.kt

travel/
  TravelModeManager.kt
  BasicTravelModeManager.kt
  TravelPaymentIntent.kt
  TravelPaymentPolicy.kt
  BasicTravelPaymentPolicy.kt
  TravelPaymentCoordinator.kt
  BasicTravelPaymentCoordinator.kt
  TravelPaymentScenario.kt
  TravelPocket.kt
  TravelPocketManager.kt
  BasicTravelPocketManager.kt
  NfcPaymentGateway.kt
  DevelopmentNfcPaymentGateway.kt

wallet/
  WalletEngine.kt
  DevelopmentWalletEngine.kt
  AddressManager.kt

ui/
  NomadHomeModel.kt
  NomadHomeController.kt
```

---

## Phase G Workboard

### P0 Production Blockers

Real funds remain blocked until these are complete:

1. Replace `DevelopmentWalletEngine` with `ProductionWalletEngine`.
2. Replace `InMemorySecureStorageGateway` with Android Keystore-backed storage.
3. Implement production owner confirmation.
4. Implement production Travel Pocket accounting.
5. Implement production Android request gateway.
6. Add CI release safety enforcement and security gates.

### P1 Developer Readiness

Developer-readiness work includes:

1. Activate Android Gradle build.
2. Complete developer setup guide.
3. Maintain architecture flow documents.
4. Maintain Samourai foundation evaluation.
5. Add build validation workflow.
6. Add architecture diagrams.

---

## Development Rules

1. Do not remove release safety gates.
2. Do not enable real funds from development services.
3. Do not wire development implementations into production release builds.
4. Keep feature flags updated in `CapabilityFlags.kt`.
5. Add docs before opening a feature to beta testers.
6. Add tests and checks before public beta.
7. Preserve owner approval as the sensitive-action boundary.
8. Keep Travel Pocket isolated from the main wallet.
9. Keep Samourai as an evaluated foundation path, not a blind clone.

---

## First Tasks For A New Developer

1. Read `README.md`.
2. Read `docs/GITHUB_READY_CHECKLIST.md`.
3. Read `docs/security/PRODUCTION_BLOCKERS.md`.
4. Read `docs/ARCHITECTURE_OVERVIEW.md`.
5. Read the files in `docs/architecture/`.
6. Read `docs/ANDROID_BUILD_ACTIVATION.md`.
7. Inspect `NomadServiceContainer.kt`.
8. Inspect `ReleaseSafetyGate.kt`.
9. Inspect `DevelopmentWalletEngine.kt`.
10. Inspect `BasicTravelPocketManager.kt`.

---

## Build Readiness Path

A new developer should work toward:

```txt
git clone
   ↓
open android-nomad/ in Android Studio
   ↓
run debug build
   ↓
run repository safety checks
   ↓
add unit tests
   ↓
replace development implementations one by one
```

A successful debug build does not mean production readiness.

---

## Next Implementation Priorities

1. Activate Android Gradle build cleanly.
2. Add build validation workflow.
3. Add unit tests for Travel Pocket limits.
4. Add unit tests for owner denial.
5. Add unit tests for Release Safety Gate.
6. Start Android Keystore-backed secure storage.
7. Start production owner confirmation.
8. Start production wallet engine only after storage and confirmation boundaries are clear.

---

## Production Warning

Do not use this repository with real funds until production replacements, automated tests, CI checks, release signing, external audit, and final documentation review are complete.
