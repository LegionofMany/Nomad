# Nomad Wallet Flow

## Purpose

This document defines the expected wallet flow for Nomad from setup through transaction review. It is a production contract for future wallet-engine implementation.

Nomad must remain non-custodial. The app may prepare and review wallet actions, but it must never silently approve, sign, or broadcast without explicit owner authority.

---

## Core Rule

```txt
Prepare != Approve
Approve != Sign unless owner confirmation is valid
Sign != Broadcast unless the user approves broadcast context
```

Nomad separates wallet actions into deliberate stages.

---

## High-Level Flow

```txt
User intent
   ↓
Wallet action request
   ↓
Wallet engine prepares action
   ↓
Human-readable review
   ↓
Risk / destination warnings
   ↓
Owner confirmation gateway
   ↓
Signing authority unlocked for this action only
   ↓
Broadcast or cancellation
   ↓
Receipt / state update
```

---

## Wallet Creation Flow

```txt
Start create wallet
   ↓
Generate wallet entropy using audited source
   ↓
Derive seed / accounts using production derivation rules
   ↓
Create recovery flow
   ↓
Confirm recovery understanding
   ↓
Store encrypted wallet material using production secure storage
   ↓
Initialize wallet profile
   ↓
Show dashboard
```

### Requirements

- Key generation must use audited cryptographic primitives.
- Private key material must never be exposed to UI models.
- Recovery must be completed before real funds are allowed.
- Development/demo wallets must not be used for production.

---

## Wallet Restore Flow

```txt
Start restore
   ↓
Enter approved recovery material
   ↓
Validate recovery format
   ↓
Derive accounts locally
   ↓
Store encrypted wallet material using secure storage
   ↓
Show restored dashboard
```

### Requirements

- Restore must happen locally.
- Recovery material must not be logged.
- Recovery material must not be sent to any server.
- Restore must fail closed if secure storage is unavailable.

---

## Send Flow

```txt
User chooses Send
   ↓
Enter destination, asset, network, and amount
   ↓
Wallet engine prepares transfer
   ↓
Fee estimate and transaction summary created
   ↓
Blockpages411 / destination context check
   ↓
Warnings displayed
   ↓
Owner confirmation required
   ↓
Production wallet engine signs only this prepared action
   ↓
Broadcast through selected network provider
   ↓
Display receipt / pending state
```

### Requirements

- Destination, asset, amount, network, and fee must be displayed.
- Network mismatch warnings must be visible.
- Destination warnings must not automatically block or approve unless policy requires hard block.
- User must be able to cancel before signing.
- Signing authorization is single-use.

---

## Receive Flow

```txt
User chooses Receive
   ↓
Select asset / network
   ↓
Wallet derives or retrieves receive address
   ↓
Display address and QR
   ↓
Optional copy/share action
```

### Requirements

- Address must match selected network.
- UI must clearly show asset and network.
- Address reuse policy must be documented per chain.

---

## Production Wallet Engine Contract

A production wallet engine must support these stages:

```txt
createWallet()
restoreWallet()
getActiveAccount()
prepareTransfer()
reviewPreparedTransfer()
approveAndSignTransfer()
broadcastTransfer()
```

The development engine may support only a subset, but production must separate review, approval, signing, and broadcast.

---

## Safety Invariants

Nomad must enforce:

- No silent signing
- No plaintext private-key exposure
- No server-side recovery
- No automatic broadcast without user review
- No development wallet engine in release builds
- No real-funds mode until production blockers are cleared

---

## Blocked Until Production

The following remain blocked until production implementation and audit:

- Real private-key custody
- Real signing
- Real broadcast for user funds
- Real mainnet funds
- Automated account recovery

---

## Related Issues

- Issue #1: Production Wallet Engine
- Issue #2: Android Keystore Secure Storage
- Issue #3: Production Owner Confirmation Gateway
- Issue #6: CI Release Safety Enforcement
