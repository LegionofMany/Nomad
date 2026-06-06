# Travel Pocket Security Model

The Travel Pocket protects the main wallet during Travel Mode.

## Core rule

```txt
NFC spending must use a prefunded Travel Pocket, not the main wallet directly.
```

## Purpose

The Travel Pocket is a user-visible allowance for travel payments. It limits exposure by separating everyday travel spending from the main wallet balance.

## Required behavior

A Travel Pocket must enforce:

1. Available balance
2. Daily spending cap
3. Trip spending cap
4. Asset type
5. Region preference
6. Enabled/disabled state
7. Expiry date or session lifetime
8. Owner confirmation before debit

## Main wallet isolation

The main wallet may fund a Travel Pocket only after owner review and confirmation.

After funding, NFC payment requests may only interact with the Travel Pocket.

NFC must never debit the main wallet directly.

## Debit flow

```txt
TravelPaymentIntent
   ↓
TravelPaymentCoordinator.reviewPayment()
   ↓
TravelPocketManager.reviewDebit()
   ↓
OwnerConfirmationGateway.requestConfirmation()
   ↓
TravelPaymentCoordinator.recordOwnerApproval()
   ↓
TravelPocketManager.applyDebit()
```

## Forbidden behavior

A production Travel Pocket must never:

1. Allow debit above available balance
2. Allow debit above daily limit
3. Allow debit above trip limit
4. Allow debit after expiry
5. Allow disabled pocket debit
6. Allow NFC to increase limits
7. Allow merchant-supplied caps
8. Pull additional value from the main wallet automatically

## Emergency controls

Production Travel Pocket implementation must support:

1. Disable pocket
2. Disable NFC requests
3. Freeze all Travel Mode spending
4. Clear pending payment reviews
5. Show remaining allowance
6. Show recent travel debits

## Release requirement

A release build must fail if `BasicTravelPocketManager` is wired into the production container.
