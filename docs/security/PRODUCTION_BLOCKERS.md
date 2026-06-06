# Nomad Production Blockers

Nomad is currently in development. The Android-native layer contains deliberate scaffolding so the Samourai-inspired wallet architecture can be upgraded into Nomad without pretending it is production-ready.

No Nomad build may be used with real funds until every blocker below is resolved, reviewed, and documented.

## Absolute release blockers

### 1. Replace development storage

Development class:

```txt
android-nomad/app/src/main/java/protocols/voltaire/nomad/security/InMemorySecureStorageGateway.kt
```

Required production replacement:

```txt
AndroidKeystoreSecureStorageGateway
```

Requirements:

- Use Android Keystore or equivalent OS-backed protected storage
- Never persist seed material in plaintext
- Never store recovery phrase in app logs or UI state
- Fail closed if secure storage is unavailable
- Add tests proving `isProductionSafe()` is true only for audited storage

### 2. Replace development owner confirmation

Development class:

```txt
android-nomad/app/src/main/java/protocols/voltaire/nomad/security/DevelopmentOwnerConfirmationGateway.kt
```

Required production replacement:

```txt
ProductionOwnerConfirmationGateway
```

Requirements:

- No auto-confirm behavior
- Integrate clock unlock
- Support device biometric or passcode confirmation
- Require confirmation for every payment approval
- Display amount, asset, destination, network, merchant label, fee estimate, and warnings

### 3. Replace development wallet engine

Development class:

```txt
android-nomad/app/src/main/java/protocols/voltaire/nomad/wallet/DevelopmentWalletEngine.kt
```

Required production replacement:

```txt
ProductionWalletEngine
```

Requirements:

- Use audited key generation
- Use secure seed derivation
- Use network-specific account derivation
- Separate prepare/review/approve steps
- Never sign silently
- Never expose private key material to UI

### 4. Replace development NFC gateway

Development class:

```txt
android-nomad/app/src/main/java/protocols/voltaire/nomad/travel/DevelopmentNfcPaymentGateway.kt
```

Required production replacement:

```txt
AndroidNfcPaymentGateway
```

Requirements:

- NFC off by default
- User must enable NFC for Travel Mode
- NFC may only create `TravelPaymentIntent`
- NFC must never approve, sign, debit, or broadcast
- NFC payloads must be validated and sanitized

### 5. Replace development Blockpages safety client

Development class:

```txt
android-nomad/app/src/main/java/protocols/voltaire/nomad/blockpages/DevelopmentBlockpagesSafetyClient.kt
```

Required production replacement:

```txt
BlockpagesApiSafetyClient
```

Requirements:

- Connect to Blockpages411 production API
- Show transparent safety signal to user
- Fail safely if unavailable
- Never approve actions automatically
- Cache only non-sensitive safety metadata

### 6. Replace development Travel Pocket accounting

Development class:

```txt
android-nomad/app/src/main/java/protocols/voltaire/nomad/travel/BasicTravelPocketManager.kt
```

Required production replacement:

```txt
ProductionTravelPocketManager
```

Requirements:

- Link to real wallet balances
- Enforce available balance
- Enforce daily cap
- Enforce trip cap
- Enforce expiry
- Support emergency disable
- Keep main wallet isolated from NFC spending

## Required production documents

Before release, the repository must include:

```txt
SECURITY.md
docs/security/THREAT_MODEL.md
docs/security/PRODUCTION_BLOCKERS.md
docs/security/KEY_MANAGEMENT.md
docs/security/OWNER_CONFIRMATION.md
docs/security/NFC_TRAVEL_MODE.md
docs/security/TRAVEL_POCKET.md
docs/security/RECOVERY_MODEL.md
docs/security/RELEASE_AUDIT_CHECKLIST.md
```

## Required automated checks

Before release, CI must verify:

1. No development-only implementation is wired into release container
2. No plaintext seed fallback exists
3. No auto-confirm owner approval is enabled
4. NFC cannot bypass owner confirmation
5. Travel Pocket debit cannot exceed caps
6. Main wallet cannot be debited by NFC directly
7. Dependency audit passes
8. Tests pass
9. Release signing is configured
10. Security docs exist

## Release rule

If any development class is still wired into the production service container, the build must be considered unsafe for real funds.
