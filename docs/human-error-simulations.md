# Nomad Wallet — Human Error & Worst-Case Simulations

## Phase One · Pre-Audit Validation

This document simulates **realistic human error and stress scenarios** to validate Nomad’s safety assumptions. These are not penetration tests. They focus on how real users behave under pressure.

Each scenario includes:

* Situation
* Likely user behavior
* Expected Nomad response
* Damage boundary
* Pass / fail criteria

---

## Scenario A: Rushed First-Time Setup

**Situation**: User installs Nomad while distracted and attempts to rush setup.

**Likely Behavior**:

* Skips reading instructions
* Tries to proceed without understanding recovery

**Expected Nomad Response**:

* Mandatory recovery setup enforced
* Confirmation screens slow progression
* No wallet use until setup completion

**Damage Boundary**:

* No funds can be deposited before recovery exists

**Pass Criteria**:

* User cannot reach main wallet without completing recovery

---

## Scenario B: Forgotten Daily Unlock Time

**Situation**: User forgets their clock-based daily unlock.

**Likely Behavior**:

* Repeated unlock attempts
* Panic

**Expected Nomad Response**:

* Rate-limited unlock attempts
* No escalation to recovery automatically
* Calm messaging

**Damage Boundary**:

* Funds remain safe

**Pass Criteria**:

* No lockout of recovery
* No forced reset

---

## Scenario C: Lost Phone While Traveling

**Situation**: Phone lost with Travel Mode previously enabled.

**Likely Behavior**:

* Panic
* Assumption that full wallet is exposed

**Expected Nomad Response**:

* Travel Mode balance only exposed
* Auto-expiry or freeze instructions available
* Main wallet protected

**Damage Boundary**:

* Loss limited to prefunded travel balance

**Pass Criteria**:

* Main wallet inaccessible without unlock or recovery

---

## Scenario D: Accidental Wrong Network Transaction

**Situation**: User attempts to send funds on the wrong network.

**Likely Behavior**:

* Misreads network selector

**Expected Nomad Response**:

* Clear network labeling
* Human-readable warning
* Explicit confirmation required

**Damage Boundary**:

* User must explicitly approve error

**Pass Criteria**:

* No silent cross-network loss

---

## Scenario E: Social Engineering Attempt

**Situation**: User is told to "verify" or "resync" wallet by a third party.

**Likely Behavior**:

* Attempts to export recovery

**Expected Nomad Response**:

* Recovery export disabled by default
* Secondary confirmation required
* Time-limited visibility

**Damage Boundary**:

* No background exfiltration

**Pass Criteria**:

* Export friction prevents impulsive loss

---

## Scenario F: NFC Misuse Anxiety

**Situation**: User worries NFC could auto-charge without consent.

**Likely Behavior**:

* Avoids feature entirely

**Expected Nomad Response**:

* NFC off by default
* Manual enable
* Spending limits visible

**Damage Boundary**:

* No background payments

**Pass Criteria**:

* NFC cannot trigger without user action

---

## Scenario G: Partial Recovery Loss

**Situation**: User loses some (but not all) recovery materials.

**Likely Behavior**:

* Attempts partial recovery

**Expected Nomad Response**:

* Requires full recovery set
* No degraded recovery path

**Damage Boundary**:

* Prevents false sense of safety

**Pass Criteria**:

* Recovery either succeeds fully or not at all

---

## Scenario H: User Panic After Reading Loss Stories

**Situation**: User reads about wallet hacks online and panics.

**Likely Behavior**:

* Tries to rapidly move funds

**Expected Nomad Response**:

* Clear transaction summaries
* No batch approvals
* Manual confirmations

**Damage Boundary**:

* Panic does not amplify loss

**Pass Criteria**:

* Each action remains deliberate

---

## Simulation Outcome Summary

Nomad Phase One is designed so that:

* Panic slows actions instead of accelerating them
* Losses are capped where possible
* No single mistake empties the wallet
* Recovery is serious, not convenient

These simulations should be revisited after beta feedback.
