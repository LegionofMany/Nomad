# Nomad Key Management Security Model

Nomad is a non-custodial wallet. The wallet owner must remain in control of wallet keys at all times.

## Core rule

```txt
Keys belong to the wallet owner, not Nomad.
```

## Production requirements

Production key management must provide:

1. Audited entropy source
2. Secure seed generation
3. Secure seed derivation
4. Android Keystore-backed protection
5. No plaintext seed persistence
6. No private key logging
7. No private key display in UI
8. Explicit owner confirmation before signing
9. Clear separation between prepare, review, approve, sign, and submit
10. Fail-closed behavior if secure storage is unavailable

## Development state

Current development files are scaffolds only:

```txt
DevelopmentWalletEngine
InMemorySecureStorageGateway
```

They must not be wired into any release build.

## Key custody model

```txt
Recovery phrase / seed
   ↓
Secure derivation
   ↓
Encrypted local storage
   ↓
Owner confirmation gate
   ↓
Transaction signing
```

## Forbidden behavior

Production builds must never:

1. Generate keys with weak randomness
2. Store wallet seed in plaintext
3. Send private keys to a server
4. Sign from background state
5. Let NFC trigger signing directly
6. Let a merchant trigger signing directly
7. Reuse approval from a prior request
8. Log seed phrases, private keys, or derived secrets

## Travel Pocket relationship

The main wallet may fund a Travel Pocket only after explicit owner review and approval.

NFC Travel Mode must never access the main wallet directly.

## Release requirement

A release build must fail if development key storage or development wallet engine is wired into production services.
