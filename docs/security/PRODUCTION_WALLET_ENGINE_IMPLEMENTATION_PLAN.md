# Production Wallet Engine Implementation Plan

## Purpose

This document defines the plan for replacing the development wallet engine with a production wallet engine.

The wallet engine is responsible for account lifecycle, preparation of wallet actions, and enforcing safe authority boundaries.

---

## Current Development State

Current development component:

```txt
DevelopmentWalletEngine
```

This is acceptable for scaffold testing only.

It must not be used for production release flows.

---

## Target Production Component

Required production class:

```txt
ProductionWalletEngine
```

The class should implement:

```txt
WalletEngine
```

---

## Dependency Order

Production wallet implementation depends on:

1. AndroidKeystoreSecureStorageGateway
2. Production owner authority checks
3. Production Travel Pocket manager

The wallet engine should not be implemented before those boundaries exist.

---

## Core Rule

```txt
Prepare
Review
Owner authority check
Execute allowed action
Record result
```

The wallet engine must preserve separation between preparation, review, authority checks, and execution.

---

## Required Capabilities

The production wallet engine should support:

- account creation
- account restoration
- account selection
- address management
- action preparation
- review generation
- state tracking
- receipt generation

---

## Storage Requirements

The wallet engine must rely on production-safe storage.

The wallet engine must not:

- expose protected secrets to UI models
- rely on in-memory development storage
- bypass release safety gates

---

## Failure Rules

The engine must fail closed when:

- secure storage is unavailable
- account state is corrupted
- authority result is missing
- required context is incomplete
- release safety validation fails

Fail closed means the action does not continue.

---

## Testing Requirements

Required tests:

- account creation path
- account restore path
- address generation path
- missing storage path
- corrupted state path
- authority failure path
- release safety gate failure path
- development wallet engine blocked in release

---

## Release Gate Requirements

Release builds must fail if any of the following are true:

```txt
DevelopmentWalletEngine is wired
production-safe storage is unavailable
owner authority checks are bypassed
release safety gate is disabled
```

---

## Related Issues

- Issue #1: Replace development wallet engine
- Issue #2: Android Keystore-backed secure storage
- Issue #3: Production owner confirmation gateway
- Issue #4: Production Travel Pocket accounting
- Issue #6: CI release safety enforcement and security gates

---

## Current Status

Status: planning complete, implementation pending.

Real funds remain blocked.
