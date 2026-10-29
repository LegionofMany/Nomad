# Nomad Android Reference Scaffold

This folder is the Android-native landing zone for rebuilding proven open-source mobile wallet architecture under the Nomad Protocol brand.

It is intentionally a scaffold. Production code should be reviewed before release.

## Purpose

Nomad Android is intended to become a native Android implementation of Nomad Wallet with:

- Non-custodial wallet creation and restore
- Explicit transaction review
- Travel Mode
- NFC off by default
- Spending caps
- Clock unlock integration
- Optional network privacy transport
- Blockpages411 destination-risk checks

## Package identity

```txt
protocols.voltaire.nomad
```

## Initial modules

```txt
android-nomad/
  app/
    src/main/java/protocols/voltaire/nomad/
      NomadApplication.kt
      MainActivity.kt
      core/
      wallet/
      network/
      security/
      travel/
      ui/
      blockpages/
```

## Upstream reference rules

The public Samourai Wallet Android repository may be studied for general Android wallet design patterns, mobile app organization, wallet lifecycle, backup and restore UX, address derivation structure, fee review UX, QR flows, and offline wallet state handling.

Nomad should not import high-risk transaction privacy services into core wallet functionality. Nomad's privacy model should focus on user custody, local security, clear consent, destination warnings, travel controls, and safer transaction review.

## Next build step

Add Gradle project files and a minimal Kotlin activity once the Expo app foundation is stable.
