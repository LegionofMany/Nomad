# Nomad Upgrade Plan from Samourai Wallet

## Product direction

Nomad is intended to evolve from a proven, previously activated mobile wallet concept into a broader Voltaire Protocols wallet layer.

The working idea is:

```txt
Samourai Wallet DNA -> Nomad Wallet upgrade -> Nomad Protocol layer
```

Samourai provides a mature reference point for mobile non-custodial wallet architecture. Nomad upgrades the idea with travel-first UX, multi-network support, safer transaction review, Blockpages411 risk checks, clock unlock, and regional stable-value rails.

## Why Samourai is useful

Samourai Wallet was not just a concept. It represented a real mobile wallet product pattern with:

- Wallet onboarding
- Backup and recovery flows
- Bitcoin account/address derivation patterns
- Send and receive workflows
- Fee review UX
- QR workflows
- Offline wallet-state handling
- Mobile-first non-custodial design

Nomad should preserve the useful wallet architecture lessons while changing the product identity, risk model, and long-term protocol direction.

## Nomad upgrade principles

Nomad should upgrade the wallet into:

1. A non-custodial travel wallet
2. A multi-network wallet layer
3. A secure daily-use mobile wallet
4. A wallet with explicit transaction consent
5. A wallet that warns users before risky sends
6. A wallet connected to Blockpages411 destination intelligence
7. A wallet with NFC disabled by default
8. A wallet with spending caps and travel expiry
9. A wallet with clock unlock and recovery improvements
10. A Voltaire Protocols identity layer

## Migration model

The preferred implementation path is not a blind overwrite. The safer path is a staged upgrade:

### Phase 1 — Reference capture

Create documentation and native Android scaffold that records the upstream architecture areas worth preserving.

### Phase 2 — Package rebrand

Translate Android identity from the upstream package style into:

```txt
protocols.voltaire.nomad
```

### Phase 3 — Core wallet engine

Build a Nomad wallet engine inspired by proven mobile wallet separation:

```txt
wallet/
  WalletEngine
  WalletAccount
  AddressManager
  TransactionBuilder
  TransactionReviewer
  BroadcastClient
```

### Phase 4 — Nomad security layer

Add Nomad-specific security:

```txt
security/
  ClockUnlockManager
  LockoutPolicy
  RecoveryCoordinator
  SecureStorageGateway
  TransactionConsentPolicy
```

### Phase 5 — Travel layer

Add Nomad travel features:

```txt
travel/
  TravelModeManager
  RegionResolver
  SpendingCapPolicy
  StableValueRouter
  NfcPolicy
```

### Phase 6 — Blockpages411 risk checks

Add safety checks before sends:

```txt
blockpages/
  BlockpagesRiskClient
  DestinationRiskReport
  UrlRiskReport
  WalletReputationSignal
```

### Phase 7 — UI rebuild

Rebuild the UI around Nomad branding:

- Dark theme
- Hyper blue accents
- Hyper green confirmations
- Travel dashboard
- Clock unlock
- Human-readable transaction review
- Receive / Send / Scan
- Risk warning screens

## What Nomad should not become

Nomad should not be positioned as a tool for hiding funds, bypassing lawful review, or concealing transaction provenance.

Nomad privacy should mean:

- User custody
- Data minimization
- Local-first security
- Clear transaction consent
- Safer public-network transport
- Protection from phishing and drainers

## Repository rule

Existing Expo/TypeScript Nomad code remains intact.

Native Android work should live under:

```txt
android-nomad/
```

Any upstream-inspired work must be reviewed before production release.

## Immediate next steps

1. Add Android wallet engine interfaces
2. Add security layer interfaces
3. Add travel mode interfaces
4. Add Blockpages411 risk client interface
5. Add Gradle build activation
6. Add README section explaining Samourai-to-Nomad evolution
7. Add SECURITY.md
8. Add threat model
