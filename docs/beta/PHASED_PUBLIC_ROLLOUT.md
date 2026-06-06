# Nomad Phased Public Rollout

Nomad will be built with capabilities in place, then opened progressively as testing grows.

## Core principle

```txt
Build the full system.
Expose capabilities by phase.
Unlock only what the current testing level can safely support.
```

## Capability states

```txt
HIDDEN
INTERNAL_TEST
CLOSED_BETA
PUBLIC_BETA
PRODUCTION_LOCKED
PRODUCTION_READY
```

## Phase 0 — Internal scaffold

Audience: project builders only

Enabled:

- Architecture review
- Documentation review
- Android scaffold
- Demo service wiring
- Safety reports

Hidden:

- Public tester onboarding
- Real NFC hardware
- Real stablecoin settlement
- Production wallet engine

## Phase 1 — Closed beta

Audience: invited testers

Enabled:

- Demo wallet creation
- Demo wallet restore
- Clock unlock demo
- Travel Mode setup
- Travel Pocket simulation
- NFC request simulation
- Owner confirmation simulation
- Blockpages safety messaging simulation
- Feedback collection

Locked:

- Real funds
- Real private keys with value
- Real merchant settlement
- Silent signing
- Background approval

## Phase 2 — Expanded beta

Audience: larger tester group

Enabled:

- Buildable Android app
- Tester onboarding flow
- Guided Travel Mode scenario
- Beta feedback form
- Blockpages safety preview
- More UI screens
- Simulated regional stable-value selection

Still locked:

- Real settlement
- Main-wallet direct NFC spending
- Production signing

## Phase 3 — Public beta / testnet

Audience: public testers

Enabled:

- Public beta landing page
- Testnet-only wallet flows
- Testnet or sandbox asset rails
- NFC request demo with explicit approval
- Public feedback channel
- Issue triage process

Still locked:

- Mainnet funds
- Production merchant acceptance
- Unaudited production wallet engine

## Phase 4 — Production candidate

Audience: auditors, selected partners, controlled pilot

Enabled only after replacements:

- Production wallet engine
- Android Keystore secure storage
- Production owner confirmation
- Real NFC integration
- Real Blockpages411 API client
- Production Travel Pocket accounting
- CI/security checks
- Release signing

Still gated:

- Public real-funds launch

## Phase 5 — Public production release

Audience: public users

Enabled only after:

- External audit
- Legal/compliance review
- Incident response plan
- Production monitoring
- Release approval

## Unlock rule

A capability may move forward only when:

1. Required docs exist
2. Required tests exist
3. Safety gate allows it
4. Release checklist is updated
5. Prior phase feedback is reviewed
6. No critical blockers remain

## Never bypass

The following may never be unlocked without production replacements and audit:

- Real funds
- Real private key custody
- Production signing
- Merchant settlement
- Main-wallet direct NFC spending
- Background approval
- Silent signing
