# Samourai Wallet Foundation Evaluation

## Purpose

This document evaluates whether Nomad should use Samourai Wallet as an upstream foundation layer, with Nomad built on top as a travel-first, clock-authority, explicit-consent wallet layer.

This is an evaluation document only. No Samourai source code should be imported into Nomad until the review checklist below is complete.

---

## Proposed Layering Model

```txt
Samourai Wallet source / architecture
        ↓
Base Android wallet foundation
        ↓
Nomad overlay layer
        ↓
Clock authority
Travel Pocket
NFC request-only payments
Blockpages411 destination checks
Regional travel UX
Future multi-chain adapters
```

---

## Why This Could Help

Using an existing open-source wallet as a foundation may accelerate:

- Android wallet lifecycle implementation
- Bitcoin wallet handling
- Backup and restore patterns
- Transaction review patterns
- Security-oriented UX decisions
- Developer familiarity with a real wallet codebase

Nomad should only reuse what strengthens the project.

---

## Major Risks

### 1. License Risk

Before copying or forking any code, the Samourai Wallet license must be reviewed and documented.

Questions:

- What license governs the source code?
- Does the license allow copying, modification, redistribution, or commercial use?
- Does it require attribution?
- Does it require open-sourcing derivative work?
- Is the license compatible with Nomad's intended release model?

### 2. Product-Fit Risk

Samourai was designed primarily around Bitcoin privacy workflows. Nomad is a travel-first, explicit-consent, multi-chain-capable wallet.

Questions:

- Does Samourai's architecture make multi-chain support harder?
- Is the wallet model too Bitcoin-specific?
- Can Nomad cleanly separate its own overlay layer?

### 3. Compliance / Reputation Risk

Nomad must not import features that create compliance or reputation risk.

Excluded from Nomad core:

- Mixing flows
- Whirlpool-style flows
- Tumbler-style flows
- Compliance-avoidance logic
- Any feature that weakens explicit owner consent

### 4. Security Risk

Even open-source wallet code requires review. Reusing code does not remove the need for audit.

Questions:

- Is the code actively maintained?
- Are dependencies current?
- Are there known vulnerabilities?
- Can risky modules be removed cleanly?
- Does the architecture support Nomad's release safety gate?

---

## Safe Reuse Candidates

Potentially useful areas to study or adapt:

- Android project structure
- Wallet lifecycle organization
- Backup and restore UX references
- Transaction review flow boundaries
- Secure storage patterns
- Network request patterns
- Error handling patterns

---

## Nomad Overlay Requirements

If Samourai is used as a base layer, Nomad must still own these core behaviors:

- Clock-based unlock and recovery model
- Owner confirmation gateway
- Travel Pocket spending isolation
- NFC request-only payment model
- Blockpages411 warning and destination context
- Release safety gate
- Real-funds disabled until production blockers are cleared

---

## Evaluation Checklist

- [ ] Confirm official Samourai source repository
- [ ] Review license
- [ ] Document license obligations
- [ ] Identify reusable architecture components
- [ ] Identify excluded components
- [ ] Identify Bitcoin-specific assumptions
- [ ] Decide whether Nomad remains independent or layers on top
- [ ] Document migration strategy if layering is approved
- [ ] Keep real funds disabled during evaluation

---

## Decision Status

Current status: **Under evaluation**

No Samourai code should be imported until the checklist is complete.

---

## Decision Rule

Samourai may become a Nomad foundation layer only if it improves development speed without weakening:

- Nomad's explicit-consent security model
- Nomad's travel-first product direction
- Nomad's multi-chain roadmap
- Nomad's legal posture
- Nomad's auditability
