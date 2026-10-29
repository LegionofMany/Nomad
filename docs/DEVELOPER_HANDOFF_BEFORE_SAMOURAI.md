# Developer Handoff Before Samourai Clone

## Purpose

This document summarizes what is complete, what remains, and what should happen before Samourai Wallet is cloned and evaluated as a foundation path.

---

## Current Status

```txt
G1 Developer Readiness: Complete
G2 Production Replacement Planning: Complete
G3 Android Scaffold Verification: In progress
Production-ready: No
Ready for developer handoff: Yes, with clear blockers
Ready for real funds: No
Ready for Samourai clone review: Yes, as a separate review path
```

---

## Completed Work

### G1 Developer Readiness

- README and project overview updated
- Developer onboarding updated
- Android build activation guide added
- Architecture diagrams added
- Wallet flow architecture added
- Clock authority flow architecture added
- Travel Pocket flow architecture added
- Samourai foundation evaluation added
- Repository safety workflow added
- Android structure validation workflow added

### G2 Production Replacement Planning

- Android Keystore implementation plan added
- Owner authority check plan added
- Travel Pocket implementation plan added
- Production wallet engine implementation plan added
- Post-G2 production readiness audit added

### G3 Android Scaffold Verification

- Android Gradle settings verified
- Root Gradle plugins activated
- App module Gradle file added
- Android manifest verified
- MainActivity verified
- NomadApplication verified
- Android string, color, and theme resources added
- Source dependency audit started

---

## Remaining Before Production Implementation

The developer should continue with:

1. Travel layer source audit
2. Wallet layer source audit
3. UI/controller source audit
4. Local Android build attempt
5. Fix compile errors discovered by build
6. Add unit test harness
7. Add ReleaseSafetyGate tests
8. Add Travel Pocket limit tests
9. Add owner authority tests
10. Add secure storage tests

---

## Production Blockers Still Open

Real funds remain blocked until these are complete:

1. `ProductionWalletEngine`
2. `AndroidKeystoreSecureStorageGateway`
3. `ProductionOwnerConfirmationGateway`
4. `ProductionTravelPocketManager`
5. Production Android request gateway
6. Production Blockpages API client
7. Full tests and CI checks
8. Release signing
9. External audit

---

## Samourai Clone Instructions

When Samourai Wallet is cloned, treat it as a separate foundation review path.

Do not directly merge it into Nomad.

First review:

- license
- repository history
- Android architecture
- wallet engine boundaries
- storage model
- transaction review model
- backup/recovery model
- modules safe to reuse
- modules not aligned with Nomad

Samourai should be evaluated as a reference/foundation layer, not blindly adopted.

---

## Recommended Developer Starting Point

A developer should begin with:

```txt
1. Clone Nomad
2. Open android-nomad/ in Android Studio
3. Attempt debug build
4. Record build errors
5. Complete travel, wallet, and UI source audits
6. Add test harness
7. Begin Android Keystore implementation
```

---

## Final Handoff Statement

Nomad has a strong production-readiness structure, but it is not production-ready yet.

The correct next engineering goal is to make the Android scaffold build locally, then replace the development implementations one by one in the planned order.

Real funds remain blocked.
