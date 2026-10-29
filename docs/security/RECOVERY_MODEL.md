# Nomad Recovery Model

Nomad recovery must restore wallet access without giving Nomad custody of user funds.

## Core rule

```txt
Recovery restores owner access. It does not give custody to Nomad.
```

## Supported recovery concepts

Nomad may support multiple recovery paths over time:

1. Standard recovery phrase
2. Clock-based recovery assist
3. Device-secured recovery state
4. Hardware wallet recovery
5. Future social or guardian recovery, only after separate review

## Production requirements

Production recovery must:

1. Validate recovery phrase locally
2. Never send recovery phrase to a server
3. Never log recovery phrase
4. Never display recovery phrase after onboarding unless owner explicitly requests it
5. Require owner confirmation before replacing active wallet state
6. Clear failed recovery sessions safely
7. Lock wallet after repeated invalid recovery attempts
8. Show clear warnings before restore overwrites local wallet state

## Clock unlock relationship

Clock unlock is an access-control layer, not a substitute for seed custody.

Clock unlock may help the user unlock or recover access to the local app state, but it must not replace proper wallet backup.

## Recovery flow

```txt
Owner starts recovery
   ↓
Recovery session begins
   ↓
Owner enters recovery phrase or approved recovery method
   ↓
Local validation
   ↓
Owner confirmation
   ↓
Wallet state restored
   ↓
Recovery session cleared
```

## Forbidden behavior

Production recovery must never:

1. Upload recovery phrase
2. Email recovery phrase
3. Store recovery phrase in plaintext
4. Let support staff recover funds
5. Let NFC trigger recovery
6. Let merchant requests trigger recovery
7. Auto-restore without owner confirmation

## Release requirement

Production recovery requires tests for valid restore, invalid restore, lockout behavior, and safe session clearing.
