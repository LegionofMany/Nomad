# Nomad Roadmap

Nomad will move through controlled phases from GitHub-ready scaffold to closed beta, expanded beta, public beta, production candidate, and public production release.

## Current phase

```txt
Phase: Closed beta / test mode scaffold
Real funds: Disabled
Vercel: Watching repository
GitHub-ready development state: In progress
```

## Phase 1 — GitHub-ready closed beta scaffold

Goal: Make the repository understandable, reviewable, and safe for invited testers.

Status: In progress

Required:

- [x] Root README cleanup
- [x] Developer onboarding guide
- [x] Architecture overview
- [x] Closed beta plan
- [x] Phased rollout plan
- [x] Feature implementation standard
- [x] Security docs
- [x] Production blockers
- [x] Capability flags
- [x] Release safety gate
- [x] Beta tester guide
- [x] Test plan
- [ ] Android build activation
- [ ] Vercel-facing beta page
- [ ] Feedback intake form
- [ ] GitHub Actions safety workflow

## Phase 2 — Expanded beta

Goal: Open more test capabilities to a larger invited group.

Required:

- [ ] Buildable Android module
- [ ] Demo wallet UI flow
- [ ] Travel Mode UI flow
- [ ] Travel Pocket UI flow
- [ ] NFC request simulation UI
- [ ] Owner confirmation UI
- [ ] Blockpages safety preview UI
- [ ] Feedback process
- [ ] Basic tests

## Phase 3 — Public beta / testnet

Goal: Public testing with testnet or sandbox-only flows.

Required:

- [ ] Public beta landing page
- [ ] Testnet wallet flow
- [ ] Testnet/sandbox asset flow
- [ ] Public feedback channel
- [ ] Issue triage process
- [ ] CI checks
- [ ] Public beta release notes

## Phase 4 — Production candidate

Goal: Replace development services with production-grade implementations.

Required:

- [ ] Production wallet engine
- [ ] Android Keystore secure storage
- [ ] Production owner confirmation gateway
- [ ] Android NFC implementation
- [ ] Blockpages411 production API client
- [ ] Production Travel Pocket accounting
- [ ] Stablecoin settlement implementation
- [ ] Recovery implementation
- [ ] Dependency audit
- [ ] External security audit
- [ ] Release signing

## Phase 5 — Public production release

Goal: Real-funds release after audit and approval.

Required:

- [ ] Legal/compliance review
- [ ] Incident response process
- [ ] Production monitoring
- [ ] Release approval
- [ ] Public release notes
- [ ] User education docs
- [ ] Support process

## Non-negotiable safety rules

- Real funds remain disabled until Phase 5 approval
- NFC cannot approve payment
- Owner confirmation cannot be skipped
- Travel Pocket cannot pull from the main wallet automatically
- Development services cannot ship in production builds
- Silent signing is never allowed
- Background approval is never allowed

## Current next priorities

1. Add GitHub Actions safety workflow
2. Add Vercel-facing beta page/document
3. Add Android build activation notes
4. Add feedback intake form
5. Add basic tests/checklists for core beta flows
