# Travel Pocket Implementation Plan

## Purpose

This document defines the plan for replacing the basic Travel Pocket layer with a production-ready Travel Pocket manager.

Travel Pocket is the limited-use spending boundary between the protected wallet balance and travel-mode activity.

---

## Current Development State

Current development component:

```txt
BasicTravelPocketManager
```

This is acceptable for scaffold testing only.

It must not be used for production release flows.

---

## Target Production Component

Required production class:

```txt
ProductionTravelPocketManager
```

The class should implement the existing boundary:

```txt
TravelPocketManager
```

---

## Core Rule

```txt
The main wallet is protected.
The Travel Pocket is limited.
```

Travel Pocket must never become an unlimited shortcut to protected wallet balances.

---

## Required Behavior

The production Travel Pocket manager must support:

- explicit setup
- explicit funding
- per-action limits
- daily limits
- trip limits
- expiry
- freeze state
- owner authority checks for changes
- auditable local state transitions

---

## State Model

Suggested Travel Pocket state:

```txt
Inactive
Active
Frozen
Expired
Closed
```

State changes must be explicit and traceable.

---

## Funding Rules

Funding must be intentional.

Required checks:

- owner review is completed
- selected asset is supported
- selected amount is valid
- trip or daily limits are configured
- expiry is configured
- source account is valid

The Travel Pocket must not refill itself automatically.

---

## Limit Rules

The manager must enforce:

```txt
available balance
per-action limit
daily limit
trip limit
expiry
freeze status
```

If any check fails, the action must not continue.

---

## Freeze Rules

Freeze must be fast and reliable.

A frozen Travel Pocket must reject future requests until explicitly unfrozen by the owner.

Unfreeze must require owner review.

---

## Expiry Rules

An expired Travel Pocket must stop new activity.

Reactivation must require owner review and a new configuration.

---

## Failure Rules

The manager must fail closed when:

- Travel Pocket state is missing
- stored state is corrupted
- limit calculation fails
- owner authority result is missing
- expiry cannot be verified
- freeze state cannot be verified

Fail closed means the action does not continue.

---

## Testing Requirements

Required tests:

- cannot use Travel Pocket while inactive
- cannot use Travel Pocket while frozen
- cannot use Travel Pocket after expiry
- cannot exceed per-action limit
- cannot exceed daily limit
- cannot exceed trip limit
- cannot continue with corrupted state
- release safety gate fails if basic manager is wired

---

## Release Gate Requirements

Release builds must fail if any of the following are true:

```txt
BasicTravelPocketManager is wired
Travel Pocket limits are optional
freeze state can be ignored
expiry state can be ignored
state integrity is not checked
```

---

## Related Issues

- Issue #4: Implement production Travel Pocket accounting
- Issue #6: Add CI release safety enforcement and security gates

---

## Current Status

Status: planning complete, implementation pending.

Real funds remain blocked.
