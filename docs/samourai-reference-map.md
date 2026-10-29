# Samourai Reference Map for Nomad Wallet

This document records how Nomad may use the public Samourai Wallet Android repository as a reference while preserving Nomad's own protocol identity, safety model, and compliance posture.

## Source reviewed

- Upstream repository: `Samourai-Wallet/samourai-wallet-android`
- Default branch observed: `develop`
- License observed: The Unlicense / public-domain style grant

## Goal

Nomad should borrow general wallet architecture patterns from a mature Android wallet codebase, but Nomad must remain a travel-first, non-custodial, multi-network wallet under Voltaire Protocols.

Nomad is not a mixer, tumbler, laundering tool, or obfuscation service.

## Safe architecture patterns to adapt

The following concepts are safe to study and reimplement inside Nomad:

1. Android/mobile wallet package organization
2. Wallet bootstrap and onboarding sequence
3. Backup and restore flows
4. Address derivation organization
5. Transaction build/review/sign/broadcast separation
6. Fee review and user confirmation screens
7. Offline-first wallet state handling
8. Optional network privacy transport patterns
9. Watch-only and address-book style concepts
10. QR scan / receive / send UX patterns

## Features not to carry forward

The following Samourai-adjacent privacy or obfuscation concepts should not be ported into Nomad core:

1. Mixing / Whirlpool-style coordination
2. Ricochet-style multi-hop obfuscation services
3. STONEWALL / entropy-boosting spend modes
4. Collaborative spend modes marketed as concealing transaction history
5. Any feature positioned as avoiding compliance review, tracing, or lawful screening

## Nomad replacement features

Instead of mixer-style privacy tooling, Nomad should focus on lawful user protection:

1. Explicit transaction consent
2. Human-readable transaction simulation
3. Address and URL safety checks
4. Phishing and drainer warnings
5. Travel-mode spending caps
6. NFC off by default
7. Emergency freeze
8. Local-only key custody
9. Optional Tor/VPN transport as a network privacy setting, not transaction obfuscation
10. Blockpages411 risk checks for wallet reputation and destination warnings

## Rebrand targets

All copied or adapted code must be renamed and reorganized around Nomad:

- `Samourai` -> `Nomad`
- `com.samourai.wallet` -> `protocols.voltaire.nomad`
- Product identity -> `Nomad Wallet`
- Protocol identity -> `Nomad Protocol`
- Visual language -> dark theme, hyper blue, hyper green

## Proposed Nomad Android structure

```txt
android-nomad/
  app/
    src/main/
      java/protocols/voltaire/nomad/
        MainActivity.kt
        NomadApplication.kt
        core/
        wallet/
        network/
        security/
        travel/
        ui/
        blockpages/
      res/
        values/
        drawable/
        mipmap/
  build.gradle
  settings.gradle
```

## Legal and security notes

The upstream license permits copying and modification, but Nomad should still keep this reference map and attribution record for transparency.

No production Nomad build should ship any borrowed code until it is reviewed for:

1. License compatibility
2. Branding removal
3. Security posture
4. Dependency age and vulnerability status
5. Regulatory risk
6. Fit with Nomad's travel-first product model

## Implementation rule

Do not overwrite the existing Expo/TypeScript Nomad app. Add Android-native reference work under a separate directory such as `android-nomad/` or translate safe patterns into the existing `mobile/` app module.
