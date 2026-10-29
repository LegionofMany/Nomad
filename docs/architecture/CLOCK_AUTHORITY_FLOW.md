# Nomad Clock Authority Flow

## Purpose

This document defines Nomad's clock-based authority model for daily unlock, recovery, and owner confirmation.

The clock model is not cosmetic. It is part of Nomad's security and consent architecture.

---

## Core Principle

```txt
The clock interface expresses owner intent.
```

Nomad uses clock-based interaction to slow down sensitive actions, reduce accidental approval, and create a consistent authority pattern across wallet unlock, recovery, and transaction confirmation.

---

## Authority Layers

Nomad separates authority into three layers:

```txt
Daily Unlock
   ↓
Owner Confirmation
   ↓
Recovery Authority
```

Each layer has a different purpose and must not be collapsed into another layer.

---

## 1. Daily Unlock

Daily unlock is used for normal access to the wallet interface.

### Intended Behavior

```txt
User opens Nomad
   ↓
Clock interface appears
   ↓
User rotates to daily unlock time
   ↓
Clock validator checks input
   ↓
Wallet interface unlocks if valid
```

### Requirements

- Daily unlock should be fast enough for daily use.
- Daily unlock must not reveal recovery material.
- Daily unlock must not authorize signing by itself.
- Repeated failed attempts must be rate-limited.
- Failure messaging must remain calm and non-revealing.

### Important Boundary

```txt
Daily unlock grants interface access.
Daily unlock does not grant transaction approval.
```

---

## 2. Owner Confirmation

Owner confirmation is required before sensitive actions such as payment approval, signing, debit, or broadcast.

### Intended Behavior

```txt
Sensitive action prepared
   ↓
Human-readable review shown
   ↓
Warnings displayed
   ↓
Clock confirmation requested
   ↓
Optional biometric / device confirmation
   ↓
Single-use approval granted
   ↓
Action proceeds or cancels
```

### Required Context Display

Before owner confirmation, Nomad must display:

- Asset
- Amount
- Destination
- Network
- Fee estimate
- Merchant or recipient label, if available
- Blockpages411 warning context, if available
- Travel Pocket impact, if applicable

### Requirements

- Owner confirmation must be explicit.
- Owner confirmation must be action-specific.
- Owner confirmation must be single-use.
- Owner confirmation must fail closed.
- Owner confirmation must not be bypassed by NFC, QR, merchant payloads, or background services.

### Important Boundary

```txt
A request can ask for confirmation.
A request cannot confirm itself.
```

---

## 3. Recovery Authority

Recovery authority is used only when a user must restore wallet access.

### Intended Behavior

```txt
User chooses restore
   ↓
Recovery flow begins
   ↓
User enters required recovery time sets
   ↓
Recovery input is validated locally
   ↓
Wallet accounts are restored
   ↓
Secure storage is re-established
```

### Requirements

- Recovery must be separate from daily unlock.
- Recovery must not be triggered automatically after failed daily unlock attempts.
- Recovery material must never be logged.
- Recovery material must never be sent to a server.
- Recovery must fail closed if required recovery data is incomplete or invalid.

### Important Boundary

```txt
Recovery restores access.
Recovery is not a shortcut for daily convenience.
```

---

## 24-Time-Set Recovery Model

Nomad's recovery model uses 24 time sets as the user-facing recovery abstraction.

The production implementation must define how those time sets map to wallet recovery material without exposing raw private keys or weakening standard recovery safety.

### Requirements

- 24 time sets must be stored offline by the user.
- Screenshots and cloud storage should be discouraged or blocked where possible.
- Recovery export must be advanced-only and heavily warned if supported.
- Visual recovery display must be time-limited.
- Recovery must remain compatible with external audit review.

---

## Failure Modes

### Forgotten Daily Unlock

Expected behavior:

- Rate-limit attempts.
- Do not reveal correct input pattern.
- Do not automatically open recovery.
- Provide calm recovery guidance.

### Incorrect Owner Confirmation

Expected behavior:

- Cancel the pending action.
- Do not sign.
- Do not debit.
- Do not broadcast.

### Partial Recovery Loss

Expected behavior:

- Recovery fails closed.
- Nomad does not offer degraded or insecure recovery paths.

---

## Production Clock Authority Contract

Production components should support:

```txt
validateDailyUnlock(input)
requestOwnerConfirmation(actionContext)
validateOwnerConfirmation(input, actionContext)
startRecovery()
validateRecoveryTimeSets(input)
rateLimitFailure(scope)
```

---

## Safety Invariants

Nomad must enforce:

- Daily unlock does not equal transaction approval.
- Owner confirmation does not persist beyond the current action.
- Recovery is separate from daily unlock.
- Failed unlock attempts do not leak authority hints.
- NFC cannot bypass owner confirmation.
- Background services cannot approve actions.
- Recovery material never leaves the device during restore.

---

## Blocked Until Production

The following remain blocked until production implementation and audit:

- Real-funds signing based on clock authority
- Production recovery mapping
- Biometric/passcode integration
- Mainnet approval flows
- Advanced recovery export

---

## Related Issues

- Issue #2: Android Keystore Secure Storage
- Issue #3: Production Owner Confirmation Gateway
- Issue #6: CI Release Safety Enforcement
