# Nomad Release Audit Checklist

This checklist must be completed before any Nomad build is used with real funds.

## Release status

```txt
REAL_FUNDS_ALLOWED = false
```

No release may change this status until all checklist sections are complete.

## 1. Development implementation removal

Confirm release build does not wire:

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

## 2. Key management

- Audited entropy source
- Android Keystore or equivalent secure storage
- No plaintext seed persistence
- No private key logging
- No seed phrase sent to any server
- Secure wallet restore path
- Secure wallet deletion path

## 3. Owner confirmation

- No auto-confirm behavior
- Confirmation required for every payment
- Amount shown
- Asset shown
- Destination shown
- Network shown
- Fee estimate shown
- Safety warnings shown
- Travel Pocket impact shown

## 4. NFC Travel Mode

- NFC disabled by default
- NFC opt-in required
- NFC creates `TravelPaymentIntent` only
- NFC cannot approve
- NFC cannot sign
- NFC cannot debit
- NFC cannot broadcast
- NFC cannot access main wallet directly

## 5. Travel Pocket

- Main wallet isolated
- Pocket funding requires owner approval
- Available balance enforced
- Daily limit enforced
- Trip limit enforced
- Expiry enforced
- Disabled pocket cannot debit
- Emergency disable available

## 6. Blockpages411 safety

- Production API connected
- Destination safety displayed
- Link safety displayed
- Failure mode is safe
- Safety client never approves automatically
- No sensitive wallet secrets sent to safety API

## 7. Recovery

- Recovery phrase validated locally
- Recovery phrase never uploaded
- Recovery phrase never logged
- Invalid recovery lockout tested
- Recovery session clearing tested
- Owner confirmation required before restore

## 8. Testing

Required tests:

1. Travel Pocket cannot exceed available balance
2. Travel Pocket cannot exceed daily cap
3. Travel Pocket cannot exceed trip cap
4. NFC cannot bypass owner confirmation
5. Owner denial prevents debit
6. Missing Travel Pocket prevents payment
7. Disabled Travel Mode prevents NFC payment
8. Development services are not wired in release build
9. Recovery phrase invalid path locks safely
10. Secure storage fails closed

## 9. Build and deployment

- Gradle build passes
- Dependency audit passes
- Static analysis passes
- Release signing configured
- Versioning configured
- CI checks enforced
- Security docs present
- Threat model reviewed

## 10. External audit

Before real funds:

- Internal review complete
- External security review complete
- Dependency review complete
- Wallet library review complete
- NFC flow review complete
- Recovery flow review complete
- Stablecoin payment flow review complete

## Final release rule

If any section is incomplete, the build is not approved for real funds.
