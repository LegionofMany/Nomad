# Nomad Travel Abroad POS Scenario

This document defines the real-world Nomad Travel Mode use case: a wallet owner is abroad and attempts to buy something at a point-of-sale terminal.

## Example user story

```txt
A Nomad user is traveling abroad.
They may be on a beach, at an airport, in London, at a cafe, or inside a hotel.
They walk up to a POS terminal to buy something.
They tap using NFC.
Nomad receives a payment request.
Nomad does not approve automatically.
The wallet owner reviews the request.
The wallet owner approves or denies.
Only the capped Travel Pocket may be used.
```

## Core rule

```txt
The POS can request payment.
The POS cannot approve payment.
NFC can request payment.
NFC cannot approve payment.
Only the wallet owner can approve after review.
```

## Travel Mode assumptions

Before POS use, the wallet owner may have:

- Enabled Travel Mode
- Selected travel region
- Selected preferred stable-value asset
- Funded a Travel Pocket
- Set daily and trip spending caps
- Enabled NFC for Travel Mode

## London cafe example

```txt
Location: London, United Kingdom
Merchant: Cafe or retail POS
Request source: NFC
Preferred asset: GBPT or stable sandbox equivalent
Amount: 18.75
Network: Stablecoin sandbox during beta
```

Nomad should:

1. Detect the POS request
2. Convert it into a TravelPaymentIntent
3. Show merchant, amount, asset, region, and network
4. Check Travel Mode is enabled
5. Check NFC is enabled for Travel Mode
6. Check asset/region fit
7. Check Travel Pocket balance
8. Check daily cap
9. Check trip cap
10. Ask owner for confirmation
11. Approve only the reviewed request if the owner confirms
12. Deny safely if anything fails

## Beach vendor example

```txt
Location: beach travel market
Merchant: local vendor POS
Request source: NFC
Preferred asset: region-specific stable-value asset
Amount: small local purchase
```

Nomad should behave the same way: request, review, cap check, owner approval, and then beta/demo debit only during closed beta.

## What must never happen

Nomad must never allow:

- POS terminal automatic approval
- NFC automatic approval
- Silent signing
- Background approval
- Travel Pocket bypass
- Main-wallet direct POS pull
- Auto-conversion without review
- Real-funds settlement while beta/dev services are active

## Closed beta behavior

During closed beta:

```txt
POS request: simulated
NFC request: simulated
Travel Pocket debit: simulated
Real funds: disabled
Owner approval: required
```

## Production behavior later

Production POS behavior requires:

- Real Android NFC implementation
- Production Travel Pocket accounting
- Production wallet engine
- Production stablecoin settlement
- Production owner confirmation
- Region-aware asset rules
- External security audit
- Release signing
