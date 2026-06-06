# Nomad Wallet Threat Model

## Scope

This threat model covers the early Nomad Wallet architecture, including the Expo mobile prototype, Android-native scaffold, wallet-core logic, clock unlock, travel mode, and Blockpages411 safety signals.

Nomad is a non-custodial wallet. The primary asset at risk is the user's ability to safely control their wallet without exposing recovery material or approving harmful actions.

## Protected assets

1. Recovery phrase
2. Private keys
3. Seed-derived account material
4. Local unlock secret
5. Wallet metadata
6. Transaction intent
7. Travel-mode settings
8. Spending-cap configuration
9. User destination history
10. Blockpages411 safety responses

## Core assumptions

1. The user controls their own device.
2. The mobile operating system may be hostile if rooted, jailbroken, or infected.
3. Network calls may be observed or interrupted.
4. Users may be tricked by phishing links, fake airdrops, or malicious destination addresses.
5. Demo stubs are not production security.
6. Nomad should never rely on silent approvals.

## Threats

### T1 — Recovery phrase exposure

Risk: A user, app log, screenshot, clipboard, malicious keyboard, or compromised device exposes the recovery phrase.

Controls:

- Never log recovery phrases
- Avoid clipboard use
- Warn users during backup
- Require clear recovery education
- Use secure display flow
- Add production screenshot protection where supported

### T2 — Insecure local storage

Risk: Seed material or unlock state is stored in plaintext or weak storage.

Controls:

- Replace demo storage stubs
- Use Android Keystore / iOS Keychain equivalents
- Encrypt seed material with strong OS-backed keys
- Reject production builds that use in-memory or plaintext seed fallbacks

### T3 — Weak randomness

Risk: Wallet creation uses an insecure random source.

Controls:

- Require OS cryptographic randomness
- Fail closed if secure randomness is unavailable
- Add automated tests that reject Math.random-style fallbacks in production

### T4 — Silent or confusing transaction approval

Risk: A user approves an action without understanding destination, asset, amount, fees, or safety context.

Controls:

- Human-readable transaction review
- Explicit consent before value-moving actions
- Destination display with copy-resistant formatting
- Blockpages411 safety signals
- Clear warnings for unknown or suspicious destinations

### T5 — Clock unlock bypass

Risk: Clock unlock is treated as strong authentication when it is only one part of local access control.

Controls:

- Treat clock unlock as local ritual plus rate limit, not a replacement for OS-backed key protection
- Add lockout policy
- Add recovery flow
- Support 24-hour time selection
- Avoid demo fixed-date derivation in production

### T6 — Travel Mode abuse

Risk: NFC or travel settings allow unexpected spending.

Controls:

- NFC off by default
- Travel Mode opt-in only
- Spending caps
- Expiry times
- Region display
- Emergency disable
- No access to main wallet balance unless explicitly prefunded or approved

### T7 — Malicious links or destination addresses

Risk: User interacts with a malicious URL, fake airdrop, copied address, or wallet drainer.

Controls:

- Blockpages411 safety checks
- Link review before wallet connection
- No blind signing
- Explain destination risk to user
- Add reporting path for suspicious links and addresses

### T8 — Dependency compromise

Risk: A compromised npm, Gradle, or mobile dependency affects wallet behavior.

Controls:

- Lockfiles
- Dependency review
- CI security scanning
- Minimal dependency policy
- Pin critical packages
- Review build scripts

### T9 — Network manipulation

Risk: RPC or API responses are manipulated.

Controls:

- Multi-provider validation for high-value actions
- TLS only
- Clear network source labeling
- Retry and failure handling
- Avoid trusting a single API for irreversible decisions

### T10 — Brand confusion during Samourai-to-Nomad migration

Risk: Users confuse Nomad with upstream projects or assume upstream features exist in Nomad.

Controls:

- Clear Nomad branding
- Document reference use
- Remove upstream brand identity from production UI
- Document excluded features
- Publish Nomad-specific security model

## Production blockers

Nomad is not production-ready until the following are complete:

1. Secure storage replacement
2. Secure randomness enforcement
3. Production clock unlock design
4. Recovery flow validation
5. Transaction review flow
6. Destination safety checks
7. Dependency audit
8. Build/release signing
9. External security assessment
10. User-facing privacy and terms documentation
