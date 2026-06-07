# Nomad Test Plan

This test plan defines the minimum checks required before Nomad moves from closed beta into expanded beta, public beta, and production candidate phases.

## Current test phase

```txt
Phase: Closed beta / test mode
Real funds: Disabled
Primary focus: UX, safety behavior, feature boundaries, and release gating
```

## Test categories

1. Wallet demo flow
2. Clock unlock
3. Travel Mode
4. Travel Pocket
5. NFC request simulation
6. Owner confirmation
7. Blockpages411 safety preview
8. Release safety gate
9. Capability flags
10. Documentation and beta messaging

## Wallet demo flow tests

- [ ] Demo wallet can be created
- [ ] Demo wallet can be restored with test data
- [ ] Demo wallet clearly identifies itself as test/demo
- [ ] No real private key with value is required
- [ ] No production settlement is available

## Clock unlock tests

- [ ] Valid clock unlock succeeds in demo flow
- [ ] Invalid clock unlock fails
- [ ] Repeated failed attempts trigger lockout or recovery-required state
- [ ] Clock unlock does not replace recovery phrase custody
- [ ] Clock unlock cannot approve payment by itself without payment review context

## Travel Mode tests

- [ ] Travel Mode starts disabled
- [ ] User can enable Travel Mode in beta flow
- [ ] User can select region
- [ ] User can select preferred travel asset
- [ ] Spending cap is shown clearly
- [ ] Travel Mode can be disabled

## Travel Pocket tests

- [ ] Travel Pocket can be funded with test/demo balance
- [ ] Available balance is enforced
- [ ] Daily limit is enforced
- [ ] Trip limit is enforced
- [ ] Disabled pocket cannot be debited
- [ ] Expired pocket cannot be debited once expiry is implemented
- [ ] Travel Pocket cannot automatically pull from main wallet

## NFC request simulation tests

- [ ] NFC starts disabled for Travel Mode
- [ ] NFC can be enabled for Travel Mode test flow
- [ ] NFC payload creates `TravelPaymentIntent`
- [ ] NFC payload does not approve payment
- [ ] NFC payload does not debit Travel Pocket
- [ ] NFC payload does not access main wallet
- [ ] Invalid payload fails safely

## Owner confirmation tests

- [ ] Owner confirmation is requested after payment review
- [ ] Owner approval allows simulated debit
- [ ] Owner denial prevents debit
- [ ] Missing confirmation prevents debit
- [ ] Confirmation screen displays amount, asset, destination, network, warnings, and pocket impact before production release

## Blockpages411 safety preview tests

- [ ] Destination safety message is shown
- [ ] Link safety message is shown
- [ ] Safety warning does not auto-approve payment
- [ ] Missing safety API fails safely in production implementation

## Release safety gate tests

- [ ] Development services block real-funds release
- [ ] In-memory storage blocks real-funds release
- [ ] Owner auto-confirm blocks real-funds release
- [ ] NFC bypass flag blocks release
- [ ] Direct Travel Pocket/main-wallet access blocks release
- [ ] Release gate explains blockers clearly

## Capability flag tests

- [ ] Closed beta capabilities are visible
- [ ] Hidden capabilities are not exposed to beta users
- [ ] Production-locked capabilities remain locked
- [ ] Capability state is shown in development UI
- [ ] Public beta promotion requires checklist update

## Documentation tests

- [ ] README accurately reflects current phase
- [ ] Developer onboarding exists
- [ ] Architecture overview exists
- [ ] Closed beta plan exists
- [ ] Phased rollout plan exists
- [ ] Production blockers exist
- [ ] Release audit checklist exists
- [ ] Feature implementation standard exists

## Exit criteria for expanded beta

- [ ] Android build path is activated or documented clearly
- [ ] Beta tester guide complete
- [ ] Feedback intake process defined
- [ ] Travel Mode demo path documented
- [ ] Release safety gate visible in app
- [ ] No real-funds path exposed

## Exit criteria for public beta

- [ ] Testnet or sandbox flow available
- [ ] CI checks in place
- [ ] Core tests pass
- [ ] Public beta warnings visible
- [ ] Issue triage process ready
- [ ] Privacy/security disclaimers reviewed

## Exit criteria for real funds

- [ ] Production wallet engine complete
- [ ] Android Keystore storage complete
- [ ] Production owner confirmation complete
- [ ] Production NFC implementation complete
- [ ] Production Blockpages411 API client complete
- [ ] Production Travel Pocket accounting complete
- [ ] External audit complete
- [ ] Release signing complete
- [ ] Legal/compliance review complete
