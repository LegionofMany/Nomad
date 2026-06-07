# Nomad Feature Implementation Standard

Nomad features must be built correctly before they are exposed publicly.

This standard keeps the repository aligned with phased rollout while making sure hidden capabilities are real, testable, and ready to unlock when the project reaches each maturity stage.

## Core rule

```txt
Do not expose a feature just because it exists.
Do not claim a feature is production-ready until its production path is complete.
```

## Required lifecycle for every feature

Every Nomad feature must move through the following stages:

```txt
1. Product definition
2. Security model
3. Interface / boundary
4. Development implementation
5. Scenario runner or demo flow
6. Tests or checklist
7. Capability flag
8. Beta documentation
9. Production replacement path
10. Public unlock approval
```

## Stage 1 — Product definition

Every feature needs a plain-language definition:

- What it does
- Who it serves
- What user problem it solves
- What it must never do
- What phase it belongs to

## Stage 2 — Security model

Every feature that touches wallet state, payments, recovery, NFC, identity, or safety must have a security document under:

```txt
docs/security/
```

## Stage 3 — Interface / boundary

Every feature must expose a clear interface before production implementation.

Examples:

```txt
TravelPaymentPolicy
TravelPocketManager
NfcPaymentGateway
OwnerConfirmationGateway
```

## Stage 4 — Development implementation

A development implementation is allowed when clearly marked:

```txt
Development*
Basic*
InMemory*
```

Development implementations must never be wired into production release builds.

## Stage 5 — Scenario runner or demo flow

Each major feature should have a scenario runner or visible demo flow showing how it works in closed beta.

## Stage 6 — Tests or checklist

Before public beta, each feature must have tests or a manual checklist covering:

- Happy path
- Failure path
- User denial path
- Safety warning path
- Disabled/locked state
- Boundary conditions

## Stage 7 — Capability flag

Each feature must be represented in:

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

## Stage 8 — Beta documentation

Each feature exposed to testers must explain:

- What is enabled
- What is simulated
- What is blocked
- How testers should report feedback

## Stage 9 — Production replacement path

If a feature uses a development implementation, it must have a named production replacement.

Example:

```txt
DevelopmentNfcPaymentGateway
   -> AndroidNfcPaymentGateway
```

## Stage 10 — Public unlock approval

A feature can move forward only when:

1. Docs exist
2. Interface exists
3. Dev implementation exists
4. Safety checks exist
5. Capability flag is set correctly
6. Test feedback is reviewed
7. Release safety gate allows the phase

## Feature quality checklist

Before marking any feature complete:

- [ ] Product definition exists
- [ ] Security notes exist
- [ ] Interface exists
- [ ] Development implementation exists
- [ ] Production replacement is named
- [ ] Capability flag exists
- [ ] Scenario/demo exists
- [ ] Tests/checklist exist
- [ ] Docs explain beta limitations
- [ ] Real-funds impact is understood

## Current principle for Nomad

```txt
Build all major features into the repo.
Expose only what the phase supports.
Unlock carefully as testing grows.
Never bypass owner consent, secure storage, or release safety gates.
```
