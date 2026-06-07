# Android Keystore Implementation Plan

## Purpose

This document defines the plan for replacing development storage with Android Keystore-backed secure storage.

This is the first G2 production replacement because wallet keys, recovery state, confirmation data, and sensitive settings depend on safe local storage.

---

## Current Development State

Current development storage:

```txt
InMemorySecureStorageGateway
```

This is acceptable for scaffold testing only.

It must not be used for real funds or production release.

---

## Target Production Component

Required production class:

```txt
AndroidKeystoreSecureStorageGateway
```

The class should implement the existing storage boundary:

```txt
SecureStorageGateway
```

---

## Required Behavior

The production storage gateway must:

- Use Android Keystore or equivalent OS-backed protection.
- Encrypt sensitive values before persistence.
- Avoid plaintext fallback.
- Avoid logging secrets.
- Fail closed if protected storage is unavailable.
- Return `isProductionSafe() == true` only when production protections are active.

---

## Data Handling Rules

Sensitive data must never be stored in plaintext.

Examples of sensitive data:

- wallet seed material
- private keys
- recovery state
- clock authority secrets
- unlock validation secrets
- owner confirmation secrets

Non-sensitive metadata may be stored separately only if it cannot reconstruct wallet authority.

---

## Failure Rules

The gateway must fail closed when:

- Android Keystore is unavailable.
- Encryption setup fails.
- Decryption fails.
- Key alias is missing unexpectedly.
- Storage integrity appears invalid.
- Device security requirements are not met.

Fail closed means the app must not continue into real-funds operation.

---

## Suggested Implementation Shape

```txt
AndroidKeystoreSecureStorageGateway
   |
   |-- creates or loads local encryption key
   |-- encrypts values before persistence
   |-- decrypts values only inside storage boundary
   |-- reports production-safe status
   |-- exposes no raw secrets to UI models
```

---

## Testing Requirements

Required tests:

- development storage returns `isProductionSafe() == false`
- production storage reports safe only when initialized correctly
- missing key fails closed
- corrupted stored value fails closed
- no plaintext fallback exists
- release safety gate fails if development storage is wired

---

## Release Gate Requirements

Release builds must fail if any of the following are true:

```txt
InMemorySecureStorageGateway is wired
secureStorageProductionSafe == false
plaintext fallback exists
release safety gate is removed
```

---

## Related Issues

- Issue #2: Implement Android Keystore-backed secure storage
- Issue #6: Add CI release safety enforcement and security gates

---

## Current Status

Status: planning complete, implementation pending.

Real funds remain blocked.
