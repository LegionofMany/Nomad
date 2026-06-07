# Owner Authority Check Plan

## Purpose

This document defines the plan for replacing the development owner-check layer with a production-grade owner authority check.

The owner authority check is the boundary between a prepared action and an allowed action.

---

## Current Development State

Current development component:

```txt
DevelopmentOwnerConfirmationGateway
```

This is acceptable for scaffold testing only.

It must not be used for production release flows.

---

## Target Production Component

Required production class:

```txt
ProductionOwnerConfirmationGateway
```

The class should implement the existing boundary:

```txt
OwnerConfirmationGateway
```

---

## Core Rule

```txt
A request can ask for review.
Only the owner can allow the reviewed action.
```

The owner check must be explicit, action-specific, and single-use.

---

## Required Review Context

Before the owner check, Nomad must show:

- action type
- account or asset affected
- amount, if applicable
- destination or recipient reference, if applicable
- network or rail, if applicable
- fee or estimate, if available
- Travel Pocket impact, if applicable
- warning state, if applicable

The owner must be able to cancel before the action continues.

---

## Clock Authority Integration

Production owner checks should integrate with Nomad clock authority.

Daily unlock and owner check are separate.

```txt
Daily unlock = interface access
Owner check = reviewed action authority
```

A successful daily unlock must not create standing authority for sensitive actions.

---

## Suggested Implementation Shape

```txt
ProductionOwnerConfirmationGateway
   |
   |-- receives action context
   |-- presents owner review screen
   |-- requests clock check
   |-- optionally requests device check
   |-- returns single-use result
   |-- clears result after action completes or cancels
```

---

## Failure Rules

The gateway must fail closed when:

- review context is missing
- clock check fails
- device check fails
- owner cancels
- result expires
- action context changes after review
- app moves to background during review

Fail closed means the action does not continue.

---

## Testing Requirements

Required tests:

- daily unlock does not allow a sensitive action
- owner denial cancels the action
- result cannot be reused
- changed action context invalidates result
- expired result cannot continue
- missing review context fails closed
- release safety gate fails if development owner check is wired

---

## Release Gate Requirements

Release builds must fail if any of the following are true:

```txt
DevelopmentOwnerConfirmationGateway is wired
owner check can be bypassed
result persists beyond one action
review context is optional for sensitive actions
```

---

## Related Issues

- Issue #3: Implement production owner confirmation gateway
- Issue #6: Add CI release safety enforcement and security gates

---

## Current Status

Status: planning complete, implementation pending.

Real funds remain blocked.
