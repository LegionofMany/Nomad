# Nomad Time Clock Authority

Nomad uses a time clock authority model to reduce theft risk during wallet access, payment approval, and recovery.

## Security purpose

The time clock is not only a visual unlock style.

It is a theft-prevention boundary.

A stolen phone, rogue merchant terminal, accidental NFC tap, or social engineering attempt should not be enough to move value.

## Core rule

```txt
Request does not equal approval.
Possession does not equal authority.
NFC does not equal approval.
The owner must provide the correct time clock authority for the action.
```

## Supported authority purposes

Nomad time clock authority can be used for:

1. Opening the wallet door
2. Approving a reviewed payment
3. Recovering the home wallet

## Open wallet door

For everyday access, the owner uses the configured time clock position to open the wallet door.

This protects against casual theft and unauthorized access if the device is physically taken.

## Approve reviewed payment

For payment approval, the owner must first see a reviewed request.

The reviewed request should show:

- Merchant or destination
- Amount
- Asset
- Network
- Region
- Travel Pocket impact
- Warnings

Only after review can the time clock authority be used to approve that specific payment.

## Recover home wallet

Home wallet recovery uses a 24-time-set recovery system.

This is separate from ordinary payment approval and ordinary wallet opening.

## NFC and POS protection

At a POS terminal, NFC can create a request only.

Nomad must prevent:

- POS automatic approval
- NFC automatic approval
- Accidental tap approval
- Background approval
- Silent signing
- Main-wallet direct pull

## Travel Mode protection

When abroad, Nomad may automatically resolve a regional stable-value asset based on location.

The regional asset selection does not approve payment.

The payment still requires:

1. Travel Mode enabled
2. NFC enabled for Travel Mode
3. Travel Pocket balance
4. Daily/trip cap review
5. Owner time clock authority

## Developer rule

Do not weaken the time clock authority boundary.

Development implementations may validate structure only, but production implementations must use audited secure storage, rate limits, lockout policy, and recovery rules.
