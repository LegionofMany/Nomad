# G3 Source Dependency Audit

## Purpose

This audit records the current Android source dependency status before production implementation begins.

The goal is to verify what already exists and what still needs replacement.

---

## Audit Result

```txt
Android source scaffold exists: YES
MainActivity exists: YES
NomadServiceContainer exists: YES
Security interfaces exist: YES
ReleaseSafetyGate exists: YES
Production-ready implementation exists: NO
Real funds allowed: NO
```

---

## Verified Existing Files

Verified source files:

```txt
android-nomad/app/src/main/java/protocols/voltaire/nomad/MainActivity.kt
android-nomad/app/src/main/java/protocols/voltaire/nomad/NomadApplication.kt
android-nomad/app/src/main/java/protocols/voltaire/nomad/di/NomadServiceContainer.kt
android-nomad/app/src/main/java/protocols/voltaire/nomad/security/SecureStorageGateway.kt
android-nomad/app/src/main/java/protocols/voltaire/nomad/security/InMemorySecureStorageGateway.kt
android-nomad/app/src/main/java/protocols/voltaire/nomad/security/ReleaseSafetyGate.kt
android-nomad/app/src/main/java/protocols/voltaire/nomad/security/ProductionReadiness.kt
android-nomad/app/src/main/java/protocols/voltaire/nomad/security/OwnerConfirmationGateway.kt
android-nomad/app/src/main/java/protocols/voltaire/nomad/security/StrictOwnerConfirmationGateway.kt
```

---

## Important Findings

### 1. Service Container Is Centralized

`NomadServiceContainer` centralizes development wiring and explicitly notes that production builds should replace development services with audited implementations.

### 2. Development Storage Is Clearly Unsafe

`InMemorySecureStorageGateway` returns `isProductionSafe() == false` and is documented as development-only.

### 3. Release Safety Gate Exists

`ReleaseSafetyGate` checks real-funds status, active development services, storage safety, owner confirmation bypass, and Travel Pocket direct-access risk.

### 4. Production Readiness Is Strict

`ProductionReadiness.REAL_FUNDS_ALLOWED` is currently false and development implementations are explicitly listed.

### 5. Owner Confirmation Boundary Exists

`OwnerConfirmationGateway` and `StrictOwnerConfirmationGateway` exist, but production owner authority still needs final Android implementation.

---

## Remaining G3 Work

Required next steps:

1. Verify travel source files.
2. Verify wallet source files.
3. Verify UI/controller source files.
4. Add missing compile dependencies if needed.
5. Add local test harness.
6. Implement Android Keystore storage.
7. Continue production replacement order.

---

## Final Statement

The source scaffold is real, but still development-bound.

The codebase is ready for production implementation work, not production use.

Real funds remain blocked.
