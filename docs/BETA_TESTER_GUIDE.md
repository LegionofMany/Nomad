# Nomad Beta Tester Guide

Welcome to the Nomad Wallet closed beta.

This beta is for testing product flow, safety messaging, Travel Mode, NFC request simulation, Travel Pocket behavior, and owner confirmation.

Do not use real funds.

## Beta status

```txt
Closed beta: Enabled
Test mode: Enabled
Real funds: Disabled
Production audit: Pending
```

## What you can test

You can test:

1. Nomad branding and navigation
2. Demo wallet creation
3. Demo wallet restore with test data
4. Clock unlock concept
5. Travel Mode setup
6. Travel Pocket allowance simulation
7. NFC request simulation
8. Owner confirmation simulation
9. Blockpages411 safety messaging
10. Release safety warnings

## What you must not use

Do not use:

1. Real funds
2. Real private keys with value
3. Real seed phrases tied to funds
4. Real merchant settlement
5. Production payment acceptance
6. Main wallet direct NFC spending

## Core concept to understand

```txt
NFC request does not equal payment approval.
```

NFC can trigger a request. The wallet owner must review and approve before any simulated Travel Pocket debit.

## Travel Pocket concept

The Travel Pocket is a prefunded allowance for travel spending.

It protects the main wallet by limiting what can be used during Travel Mode.

Testers should check that:

- Travel Pocket amount is visible
- Daily cap is visible
- Trip cap is visible
- Payment cannot exceed available allowance
- Payment cannot exceed caps
- Travel Pocket is separate from main wallet

## Owner confirmation concept

Owner confirmation is the approval layer.

A tester should see that:

- Payment request is reviewed first
- Confirmation is required
- Denial prevents debit
- Approval permits only the reviewed action

## Safety warnings to look for

Testers should look for clear messages that say:

- Closed beta / test mode
- Real funds disabled
- Development services active
- Production audit pending
- NFC cannot approve automatically
- Travel Pocket protects main wallet

## Feedback format

Please report feedback using this structure:

```txt
Area tested:
What happened:
What you expected:
Was the warning clear?
Was anything confusing?
Screenshot or notes:
Severity: low / medium / high / critical
```

## Critical feedback examples

Mark as critical if:

- App appears to allow real funds
- App implies production readiness
- NFC appears to approve automatically
- Owner confirmation can be skipped
- Travel Pocket appears to pull from main wallet automatically
- Warnings are missing or unclear

## Beta success question

At the end of testing, you should be able to explain:

```txt
Nomad is a travel wallet where NFC can request payment, but the wallet owner must approve, and spending comes from a capped Travel Pocket rather than the main wallet.
```
