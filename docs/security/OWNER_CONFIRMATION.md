# Owner Confirmation Security Model

Nomad treats every payment request as untrusted until the wallet owner explicitly confirms it.

## Core rule

```txt
Request does not equal approval.
```

NFC taps, QR scans, manual payment entries, merchant requests, and prepared transfers may create a reviewable intent. None of them may approve or move value by themselves.

## Confirmation methods

Nomad supports the following confirmation methods at the interface level:

```txt
CLOCK_UNLOCK
DEVICE_BIOMETRIC
DEVICE_PASSCODE
HARDWARE_CONFIRMATION
```

Development builds currently use:

```txt
DevelopmentOwnerConfirmationGateway
```

Production builds must replace it with:

```txt
ProductionOwnerConfirmationGateway
```

## Required production behavior

A production owner confirmation screen must display:

1. Amount
2. Asset
3. Destination
4. Network
5. Merchant label, when available
6. Fee estimate
7. Travel Pocket source
8. Spending cap impact
9. Blockpages411 safety signal
10. Warnings and reason codes

## Forbidden behavior

Production builds must never:

1. Auto-confirm payments
2. Hide destination details
3. Confirm from background state
4. Confirm from NFC alone
5. Confirm from QR alone
6. Reuse old confirmations for new requests
7. Skip confirmation because the amount is small
8. Let a merchant decide confirmation outcome

## Approval flow

```txt
TravelPaymentIntent
   ↓
TravelPaymentCoordinator.reviewPayment()
   ↓
OwnerConfirmationGateway.requestConfirmation()
   ↓
OwnerConfirmationResult
   ↓
TravelPaymentCoordinator.recordOwnerApproval()
   ↓
Travel Pocket debit
```

## Release requirement

A release build must fail if `DevelopmentOwnerConfirmationGateway` is wired into the production container.
