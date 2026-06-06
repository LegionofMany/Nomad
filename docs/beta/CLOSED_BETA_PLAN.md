# Nomad Closed Beta Plan

Nomad closed beta is for controlled testing of the product flow, architecture, safety model, and user experience.

Closed beta is not a real-funds launch.

## Beta status

```txt
Product: Nomad Wallet / Nomad Protocol
Beta type: Closed beta
Real funds: Disabled
Test mode: Enabled
Primary goal: UX, architecture, safety, and travel flow validation
Repository: LegionofMany/Nomad
```

## What is opened for beta

Closed beta may open:

1. Demo wallet creation and restore flows
2. Clock unlock demo flow
3. Travel Mode setup
4. Travel Pocket allowance simulation
5. NFC payment request simulation
6. Owner confirmation simulation
7. Blockpages411 safety messaging simulation
8. Vercel preview pages
9. Documentation review
10. Tester feedback collection

## What remains blocked

Closed beta must still block:

1. Real funds
2. Real stablecoin settlement
3. Real production private keys
4. Production merchant acceptance
5. Main-wallet direct NFC spending
6. Silent signing
7. Background approval
8. Auto-confirm in production

## Required beta messaging

Every beta-facing surface should communicate:

```txt
Nomad is in closed beta.
Test mode is enabled.
Use test data only.
Real funds are disabled.
Production audit is pending.
```

## Closed beta goals

1. Validate Nomad onboarding flow
2. Validate clock unlock concept
3. Validate Travel Mode UX
4. Validate NFC request model
5. Validate Travel Pocket safety model
6. Validate owner approval flow
7. Validate Blockpages411 safety messaging
8. Validate GitHub/Vercel developer handoff
9. Collect tester feedback
10. Prepare production replacement roadmap

## Beta tester acceptance criteria

A tester is allowed into closed beta only if they understand:

1. This is not a production wallet
2. No real funds should be used
3. Feedback may be used to improve Nomad
4. Bugs and missing features are expected
5. Safety warnings should not be bypassed
6. Test data only

## Beta success criteria

Closed beta is successful when:

1. Testers understand the Travel Pocket model
2. Testers understand NFC does not approve payment
3. Testers can explain owner confirmation
4. Testers can identify real-funds warnings
5. The app/docs clearly block production use
6. Feedback has been captured and prioritized
7. Production blockers remain visible
8. Next implementation milestones are clear

## Exit criteria before public beta

Before public beta, Nomad needs:

- Buildable Android module
- Updated frontend/Vercel beta page
- Basic automated tests
- Real beta feedback form
- CI docs/security checks
- Clear release notes
- Production replacement roadmap

## Exit criteria before real funds

Before real funds, Nomad needs:

- Production wallet engine
- Android Keystore secure storage
- Real owner confirmation gateway
- Real NFC implementation
- Real Blockpages411 API client
- Real Travel Pocket accounting
- External audit
- Release signing
- Legal/compliance review
- Production incident response process
