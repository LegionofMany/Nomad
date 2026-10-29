# Nomad Vercel Beta Deployment Guide

This guide explains how the Nomad repository should be presented through Vercel during closed beta and later rollout phases.

## Current deployment purpose

```txt
Phase: Closed beta / test mode
Audience: invited testers, developers, reviewers
Real funds: disabled
Primary use: status page, beta instructions, safety messaging, feedback routing
```

## Vercel should communicate

Every Vercel-facing Nomad page should clearly show:

```txt
Nomad Wallet is in closed beta.
Test mode is enabled.
Real funds are disabled.
Use test data only.
Production audit is pending.
```

## Recommended Vercel pages

```txt
/
  Public/closed-beta status landing page

/beta
  Closed beta overview and tester instructions

/safety
  Safety model: NFC request, owner approval, Travel Pocket isolation

/roadmap
  Phased rollout from closed beta to production candidate

/feedback
  Tester feedback form or instructions
```

## Required Vercel beta sections

The beta site should include:

1. Product summary
2. Closed beta warning
3. Enabled beta features
4. Locked production features
5. Travel payment safety flow
6. Feedback instructions
7. GitHub repository status
8. Production blocker summary

## Enabled beta features to show

```txt
Demo wallet creation
Demo wallet restore
Clock unlock demo
Travel Mode setup
Travel Pocket simulation
NFC request simulation
Owner confirmation simulation
Blockpages411 safety messaging
```

## Locked production features to show

```txt
Real stablecoin settlement
Real private-key production custody
Production merchant acceptance
Main-wallet direct NFC spending
Silent signing
Background approval
```

## Deployment safety copy

Use this exact wording where appropriate:

```txt
Nomad is currently available only as a closed beta / test-mode scaffold. Do not use real funds, production private keys, or seed phrases tied to value. NFC request flows are simulated and require owner confirmation before any test-mode Travel Pocket debit.
```

## Vercel environment notes

Recommended environment variables for future beta frontend:

```txt
NEXT_PUBLIC_NOMAD_PHASE=closed_beta
NEXT_PUBLIC_REAL_FUNDS_ENABLED=false
NEXT_PUBLIC_TEST_MODE_ENABLED=true
NEXT_PUBLIC_FEEDBACK_URL=
NEXT_PUBLIC_GITHUB_REPO=LegionofMany/Nomad
```

## Go-live checklist for Vercel beta page

- [ ] Closed beta warning visible above the fold
- [ ] Real funds disabled warning visible
- [ ] Enabled beta features listed
- [ ] Locked features listed
- [ ] Feedback path included
- [ ] Safety docs linked
- [ ] Roadmap linked
- [ ] GitHub readiness checklist linked
- [ ] No production wallet claims
- [ ] No real-funds call to action

## Future public beta requirements

Before public beta Vercel pages are opened wider:

- [ ] Add public beta release notes
- [ ] Add public feedback channel
- [ ] Add testnet/sandbox status page
- [ ] Add known issues page
- [ ] Add privacy and data handling page
- [ ] Add support contact process
