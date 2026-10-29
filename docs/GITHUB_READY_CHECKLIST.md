# Nomad GitHub Readiness Checklist

This document tracks whether the Nomad repository is ready for GitHub handoff, continued development, build activation, and eventual production review.

## Current status

```txt
Repository: LegionofMany/Nomad
Default branch: main
Product: Nomad Wallet / Nomad Protocol
Status: GitHub-ready scaffold and architecture
Production real-funds status: blocked
```

Nomad is GitHub-ready for continued development, review, and iteration.

Nomad is not yet production-ready for real funds.

## Completed GitHub-ready foundation

- [x] Existing Nomad repository used directly
- [x] Samourai reference map documented
- [x] Nomad Android-native scaffold added under `android-nomad/`
- [x] Nomad package identity established as `protocols.voltaire.nomad`
- [x] Voltaire Protocols branding added
- [x] Expo/mobile app preserved
- [x] Android-native path kept separate from Expo app
- [x] Security docs added
- [x] Production blockers documented
- [x] Release safety gate added
- [x] Development safety report added

## Completed Nomad architecture modules

- [x] Wallet engine interface
- [x] Development wallet engine
- [x] Address manager interface
- [x] Clock unlock interface
- [x] Basic clock unlock manager
- [x] Secure storage gateway interface
- [x] Development storage implementation
- [x] Owner confirmation gateway
- [x] Development owner confirmation gateway
- [x] Travel Mode manager
- [x] Travel payment intent model
- [x] Travel payment policy
- [x] Travel payment coordinator
- [x] Travel payment scenario runner
- [x] Travel Pocket model
- [x] Travel Pocket manager
- [x] NFC payment gateway
- [x] Development NFC gateway
- [x] Blockpages411 safety client interface
- [x] Development Blockpages411 safety client
- [x] Service container wiring
- [x] MainActivity scaffold display

## Completed security documents

- [x] `SECURITY.md`
- [x] `docs/security/THREAT_MODEL.md`
- [x] `docs/security/PRODUCTION_BLOCKERS.md`
- [x] `docs/security/KEY_MANAGEMENT.md`
- [x] `docs/security/OWNER_CONFIRMATION.md`
- [x] `docs/security/NFC_TRAVEL_MODE.md`
- [x] `docs/security/TRAVEL_POCKET.md`
- [x] `docs/security/RECOVERY_MODEL.md`
- [x] `docs/security/RELEASE_AUDIT_CHECKLIST.md`

## GitHub-ready but not production-ready

The following components are intentionally development-only:

```txt
InMemorySecureStorageGateway
DevelopmentOwnerConfirmationGateway
DevelopmentWalletEngine
DevelopmentNfcPaymentGateway
DevelopmentBlockpagesSafetyClient
BasicTravelPocketManager
BasicTravelPaymentCoordinator
BasicTravelPaymentPolicy
BasicTravelModeManager
BasicClockUnlockManager
```

These are allowed for scaffold, architecture, UI wiring, and development testing.

They are not allowed for real funds.

## Remaining GitHub-readiness work

These tasks make the repository easier for a developer or Codex-style agent to build and continue:

- [ ] Root README cleanup and rewrite
- [ ] Android build activation instructions
- [ ] `android-nomad/app/build.gradle` activation
- [ ] CI workflow for docs/security checks
- [ ] Test plan folder
- [ ] Architecture diagram document
- [ ] Developer onboarding guide
- [ ] Issue roadmap
- [ ] Milestone roadmap

## Remaining production work

These tasks are required before real funds:

- [ ] Production wallet engine
- [ ] Android Keystore-backed storage
- [ ] Production owner confirmation gateway
- [ ] Real Android NFC integration
- [ ] Real Blockpages411 API client
- [ ] Production Travel Pocket accounting
- [ ] Stablecoin payment rails
- [ ] Secure recovery implementation
- [ ] Automated tests
- [ ] Dependency audit
- [ ] External security audit
- [ ] Release signing
- [ ] CI enforcement

## Final GitHub handoff rule

A GitHub-ready Nomad repository must be understandable by a developer opening the repo for the first time.

Before final handoff, the repo should include:

```txt
README.md
SECURITY.md
docs/GITHUB_READY_CHECKLIST.md
docs/samourai-reference-map.md
docs/nomad-samourai-upgrade-plan.md
docs/security/*
android-nomad/README.md
android-nomad/app/src/main/java/protocols/voltaire/nomad/*
```

## Current verdict

```txt
GitHub-ready for continued development: YES
GitHub-ready for production release: NO
Real funds allowed: NO
Next best step: root README cleanup and developer onboarding guide
```
