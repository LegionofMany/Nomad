# Nomad Travel Pocket Flow

## Purpose

Travel Pocket is Nomad's controlled spending layer for travel and payment use.

It separates everyday spending from the main wallet so payment requests, NFC flows, QR flows, and merchant flows cannot reach the main wallet directly.

---

## Core Rule

```txt
Main wallet = protected balance
Travel Pocket = limited spending balance
```

The Travel Pocket exists to reduce exposure, enforce limits, and keep payment activity deliberate.

---

## High-Level Flow

```txt
User funds Travel Pocket
   ↓
Travel Pocket stores limited spendable balance
   ↓
Payment request arrives
   ↓
Travel Pocket reviews balance and limits
   ↓
Owner confirmation is required
   ↓
Travel Pocket records approved spend
```

---

## Funding Flow

```txt
User opens Travel Mode
   ↓
Selects asset, region, and amount
   ↓
Nomad shows cap, expiry, and risk summary
   ↓
Owner confirmation required
   ↓
Travel Pocket is funded
```

### Funding Requirements

- Funding must be explicit.
- User must see asset, amount, region, cap, and expiry.
- Funding must not happen automatically.
- Travel Pocket must not pull funds silently from the main wallet.
- Main wallet balance remains isolated after funding.

---

## Spending Review Flow

```txt
Payment request received
   ↓
Validate request format
   ↓
Check Travel Mode status
   ↓
Check Travel Pocket balance
   ↓
Check transaction limit
   ↓
Check daily limit
   ↓
Check trip limit
   ↓
Check expiry / freeze status
   ↓
Show review screen
   ↓
Owner confirmation required
   ↓
Record approved spend
```

### Spending Requirements

- Payment requests can only request review.
- Payment requests cannot approve themselves.
- Payment requests cannot reach the main wallet directly.
- Payment requests cannot bypass Travel Pocket limits.
- Owner confirmation is required before spending is recorded.

---

## Limit Model

Travel Pocket must support:

```txt
Available Travel Pocket balance
Per-transaction limit
Daily spending limit
Trip-level spending limit
Expiry / auto-disable
Emergency freeze
```

All checks must pass before a spend is approved.

---

## Freeze Flow

```txt
User freezes Travel Pocket
   ↓
Travel Pocket state becomes frozen
   ↓
Future spending requests are blocked
   ↓
Main wallet remains unaffected
```

### Freeze Requirements

- Freeze must be fast and easy to find.
- Frozen Travel Pocket cannot spend.
- Unfreeze must require owner confirmation.
- Freeze must preserve history.

---

## Expiry Flow

```txt
Travel Pocket expiry reached
   ↓
Travel Pocket blocks spending
   ↓
User must review next action manually
```

### Expiry Requirements

- Expiry must fail closed.
- Expired Travel Pocket cannot be used for NFC payments.
- Re-enabling must require owner confirmation.

---

## Region and Stablecoin Guidance

Travel Pocket may support region-aware asset suggestions.

### Requirements

- Region suggestions are advisory only.
- Conversion must never happen silently.
- User must approve conversion explicitly.
- Nomad must show asset, region, quote, fees, and settlement warnings before conversion.

---

## Production Contract

A production Travel Pocket manager should support:

```txt
createTravelPocket(config)
fundTravelPocket(amount, asset, source)
reviewSpend(paymentIntent)
recordApprovedSpend(approvedPayment)
freezeTravelPocket(reason)
unfreezeTravelPocket(ownerConfirmation)
expireTravelPocket()
getTravelPocketState()
```

---

## Safety Invariants

Nomad must enforce:

- Travel Pocket cannot access the main wallet directly.
- Travel Pocket cannot exceed available balance.
- Travel Pocket cannot exceed transaction, daily, or trip limits.
- Expired Travel Pocket cannot spend.
- Frozen Travel Pocket cannot spend.
- NFC cannot bypass Travel Pocket review.
- Owner confirmation is required before spend approval.

---

## Blocked Until Production

The following remain blocked until production implementation and audit:

- Real Travel Pocket balances
- Real stablecoin settlement
- Real card or NFC settlement
- Mainnet spending
- Automatic region conversion

---

## Related Issues

- Issue #3: Production Owner Confirmation Gateway
- Issue #4: Production Travel Pocket Accounting
- Issue #5: Production NFC Payment Gateway
- Issue #6: CI Release Safety Enforcement
