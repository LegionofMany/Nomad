# Nomad Developer Onboarding

This guide helps a new developer understand the Nomad repository and continue building without needing to reconstruct the project history.

## Project summary

Nomad Wallet is a travel-first, non-custodial wallet under Voltaire Protocols.

It combines:

- Samourai-inspired Android wallet architecture
- Nomad-specific Travel Mode
- Prefunded Travel Pocket spending
- NFC request safety
- Explicit owner confirmation
- Blockpages411 safety checks
- Closed beta capability flags
- Release safety gates

## Current phase

```txt
Closed beta / test mode scaffold
```

Real funds are disabled.

## Repository map

```txt
README.md
  Main project overview

mobile/
  Expo / React Native prototype

android-nomad/
  Android-native Nomad scaffold

src/
  TypeScript wallet-core, security, and travel modules

docs/
  Product, architecture, rollout, and GitHub readiness docs

docs/security/
  Security docs and production blockers

docs/beta/
  Closed beta and rollout docs
```

## Android-native entry points

```txt
android-nomad/app/src/main/java/protocols/voltaire/nomad/MainActivity.kt
android-nomad/app/src/main/java/protocols/voltaire/nomad/NomadApplication.kt
android-nomad/app/src/main/java/protocols/voltaire/nomad/di/NomadServiceContainer.kt
```

## Important Android modules

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

## Development rules

1. Do not remove release safety gates.
2. Do not enable real funds from development services.
3. Do not wire development implementations into production release builds.
4. Keep feature flags updated in `CapabilityFlags.kt`.
5. Add docs before opening a feature to beta testers.
6. Add tests/checklists before public beta.
7. Preserve owner approval as the payment boundary.
8. Keep NFC as a request source only.
9. Keep Travel Pocket isolated from the main wallet.
10. Keep Samourai as a reference, not a blind clone.

## First tasks for a new developer

1. Read `README.md`.
2. Read `docs/GITHUB_READY_CHECKLIST.md`.
3. Read `docs/FEATURE_IMPLEMENTATION_STANDARD.md`.
4. Read `docs/security/PRODUCTION_BLOCKERS.md`.
5. Read `docs/beta/PHASED_PUBLIC_ROLLOUT.md`.
6. Inspect `NomadServiceContainer.kt`.
7. Inspect `TravelPaymentScenario.kt`.
8. Inspect `ReleaseSafetyGate.kt`.

## Next implementation priorities

1. Activate Android Gradle build cleanly.
2. Add unit tests for Travel Pocket limits.
3. Add unit tests for NFC request safety.
4. Add unit tests for owner denial.
5. Add unit tests for Release Safety Gate.
6. Build beta UI screens.
7. Add Vercel-facing beta status page.
8. Add feedback intake form.
9. Start replacing development services with production-ready implementations.

## Production warning

Do not use this repository with real funds until production replacements, tests, audits, and release signing are complete.
