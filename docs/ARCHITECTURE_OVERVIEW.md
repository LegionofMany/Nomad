# Nomad Architecture Overview

Nomad is designed as a phased wallet system: build the full structure, expose capabilities safely, and unlock deeper functionality only when tests and audits support it.

## Architecture layers

```txt
User Interface
   ↓
Capability Flags / Beta Mode
   ↓
Service Container
   ↓
Feature Boundaries
   ↓
Development or Production Implementations
   ↓
Release Safety Gate
```

## Primary flows

### 1. Closed beta status

```txt
BetaMode
   ↓
CapabilityFlags
   ↓
MainActivity
   ↓
Tester sees enabled and locked capabilities
```

### 2. Travel payment flow

```txt
NFC / QR / manual input
   ↓
TravelPaymentIntent
   ↓
TravelPaymentCoordinator.reviewPayment()
   ↓
TravelPaymentPolicy
   ↓
TravelPocketManager.reviewDebit()
   ↓
OwnerConfirmationGateway.requestConfirmation()
   ↓
TravelPaymentCoordinator.recordOwnerApproval()
   ↓
TravelPocketManager.applyDebit()
```

### 3. Safety flow

```txt
NomadServiceContainer
   ↓
ReleaseSafetyGate.evaluate()
   ↓
DevelopmentSafetyReport
   ↓
MainActivity displays blocker state
```

## Important boundaries

### Wallet boundary

The wallet engine prepares and reviews wallet actions. It must not silently approve user actions.

Current development class:

```txt
DevelopmentWalletEngine
```

Production replacement:

```txt
ProductionWalletEngine
```

### NFC boundary

NFC can only create a payment request intent.

Current development class:

```txt
DevelopmentNfcPaymentGateway
```

Production replacement:

```txt
AndroidNfcPaymentGateway
```

### Owner confirmation boundary

Only the owner confirmation layer can approve payment flow continuation.

Current development class:

```txt
DevelopmentOwnerConfirmationGateway
```

Production replacement:

```txt
ProductionOwnerConfirmationGateway
```

### Travel Pocket boundary

Travel Pocket isolates travel spending from the main wallet.

Current development class:

```txt
BasicTravelPocketManager
```

Production replacement:

```txt
ProductionTravelPocketManager
```

### Blockpages safety boundary

Blockpages411 safety checks provide warnings and context. They must never approve payments automatically.

Current development class:

```txt
DevelopmentBlockpagesSafetyClient
```

Production replacement:

```txt
BlockpagesApiSafetyClient
```

## Capability rollout

Capabilities are tracked in:

```txt
android-nomad/app/src/main/java/protocols/voltaire/nomad/beta/CapabilityFlags.kt
```

Supported states:

```txt
HIDDEN
INTERNAL_TEST
CLOSED_BETA
PUBLIC_BETA
PRODUCTION_LOCKED
PRODUCTION_READY
```

## Current closed beta capabilities

```txt
Demo Wallet
Clock Unlock
Travel Mode
Travel Pocket
NFC Request Simulation
Owner Confirmation
Blockpages411 Safety Preview
```

## Production-locked capabilities

```txt
Real NFC Hardware
Real Stablecoin Settlement
Real private-key production custody
Production merchant acceptance
```

## Main security principle

```txt
A request is not approval.
```

NFC, QR, merchant payloads, and manual payment entries can request a payment review. They cannot approve, sign, debit, or broadcast by themselves.

## Main release principle

```txt
Development wiring can support beta testing.
Production release requires production replacements.
```
