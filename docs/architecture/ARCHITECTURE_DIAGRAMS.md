# Nomad Architecture Diagrams

## Purpose

This document provides text-based architecture diagrams for the Nomad Phase G scaffold.

These diagrams are implementation guides. They do not certify production readiness.

---

## 1. Repository Layer Diagram

```txt
Nomad Repository
   |
   |-- README.md
   |-- SECURITY.md
   |
   |-- android-nomad/
   |     |-- Android-native scaffold
   |     |-- protocols.voltaire.nomad package
   |
   |-- mobile/
   |     |-- Expo / React Native prototype area
   |
   |-- src/
   |     |-- TypeScript wallet, security, and travel modules
   |
   |-- docs/
   |     |-- architecture/
   |     |-- security/
   |     |-- beta/
   |
   |-- .github/workflows/
         |-- repository safety checks
         |-- Android structure validation
```

---

## 2. Android Service Wiring Diagram

```txt
MainActivity
   |
   v
NomadServiceContainer
   |
   |-- WalletEngine
   |     |-- DevelopmentWalletEngine today
   |     |-- ProductionWalletEngine required
   |
   |-- SecureStorageGateway
   |     |-- InMemorySecureStorageGateway today
   |     |-- AndroidKeystoreSecureStorageGateway required
   |
   |-- OwnerConfirmationGateway
   |     |-- Development/basic implementation today
   |     |-- ProductionOwnerConfirmationGateway required
   |
   |-- TravelModeManager
   |
   |-- TravelPocketManager
   |     |-- BasicTravelPocketManager today
   |     |-- ProductionTravelPocketManager required
   |
   |-- BlockpagesSafetyClient
   |     |-- DevelopmentBlockpagesSafetyClient today
   |     |-- Production API client required
   |
   |-- ReleaseSafetyGate
         |-- blocks production release when unsafe wiring exists
```

---

## 3. Wallet Flow Diagram

```txt
User intent
   |
   v
Wallet action request
   |
   v
Wallet engine prepares action
   |
   v
Human-readable review
   |
   v
Safety and destination context
   |
   v
Owner confirmation
   |
   v
Single-action approval
   |
   v
Sign / submit only after valid approval
   |
   v
Receipt or cancellation
```

Key rule:

```txt
Prepare != Approve
Approve != persistent permission
```

---

## 4. Clock Authority Diagram

```txt
Daily Unlock
   |
   |-- grants interface access only
   |
   v
Owner Confirmation
   |
   |-- required for sensitive actions
   |-- single-use approval
   |
   v
Recovery Authority
      |-- separate restore path
      |-- not a shortcut for daily use
```

Key rule:

```txt
Daily unlock does not equal transaction approval.
```

---

## 5. Travel Pocket Diagram

```txt
Main Wallet
   |
   |-- protected balance
   |
   v
Explicit owner funding action
   |
   v
Travel Pocket
   |
   |-- limited balance
   |-- per-action limits
   |-- daily limits
   |-- trip limits
   |-- expiry
   |-- freeze state
   |
   v
Travel review
   |
   v
Owner confirmation
   |
   v
Approved Travel Pocket state update
```

Key rule:

```txt
Travel Pocket cannot access the main wallet directly.
```

---

## 6. Production Readiness Diagram

```txt
Development Scaffold
   |
   v
Phase G1 Developer Readiness
   |-- docs
   |-- architecture flows
   |-- structure checks
   |-- onboarding
   |
   v
Phase G2 Production Replacements
   |-- wallet engine
   |-- secure storage
   |-- owner confirmation
   |-- Travel Pocket accounting
   |-- Android request gateway
   |
   v
Phase G3 Tests and CI Enforcement
   |-- unit tests
   |-- safety checks
   |-- release gates
   |
   v
External Review
   |
   v
Real-funds beta decision
```

---

## 7. Real-Funds Release Gate

```txt
If any development implementation is wired
   |
   v
Release blocked

If secure storage is not production-safe
   |
   v
Release blocked

If owner confirmation can be bypassed
   |
   v
Release blocked

If tests or CI checks fail
   |
   v
Release blocked

If external review is incomplete
   |
   v
Release blocked
```

---

## Final Rule

These diagrams are a guide for implementation, not a production approval.

Nomad remains blocked for real funds until production replacements, automated tests, release signing, and external review are complete.
