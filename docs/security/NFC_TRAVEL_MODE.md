# NFC Travel Mode Security Model

Nomad Travel Mode allows NFC to trigger a payment request, not a payment approval.

## Core rule

```txt
NFC may request. The owner must approve.
```

## NFC default state

NFC must be disabled by default for Travel Mode.

The wallet owner must explicitly enable NFC travel requests for a session.

## Allowed NFC behavior

NFC may:

1. Detect a nearby payment request
2. Parse merchant-provided payment details
3. Create a `TravelPaymentIntent`
4. Pass that intent to the Travel Payment Coordinator
5. Display a review screen to the owner

## Forbidden NFC behavior

NFC must never:

1. Approve a payment
2. Sign a transaction
3. Debit a Travel Pocket
4. Access the main wallet directly
5. Broadcast a transaction
6. Bypass owner confirmation
7. Increase spending caps
8. Enable itself silently

## NFC payment flow

```txt
NFC payload
   ↓
NfcPaymentGateway.parseNfcPayload()
   ↓
TravelPaymentIntent
   ↓
TravelPaymentCoordinator.reviewPayment()
   ↓
OwnerConfirmationGateway.requestConfirmation()
   ↓
TravelPaymentCoordinator.recordOwnerApproval()
   ↓
Travel Pocket debit
```

## Payload validation

Production NFC payload parsing must validate:

1. Destination is present
2. Amount is present and numeric
3. Asset is supported
4. Network is supported
5. Region is compatible with Travel Mode
6. Merchant label is displayed as untrusted text
7. Raw payload is sanitized
8. Payload size is capped

## Release requirement

A release build must fail if `DevelopmentNfcPaymentGateway` is wired into the production container.
