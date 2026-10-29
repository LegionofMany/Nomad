# Security Policy

Nomad Wallet is a non-custodial wallet project under Voltaire Protocols. Security work must prioritize user custody, clear consent, local-first protection, and safe defaults.

## Current status

Nomad is in early development. Do not use this repository with real funds until the project has completed independent security review, mobile hardening, dependency review, and production key-management validation.

## Security principles

1. Private keys and seed material must never leave the user's device.
2. Sensitive wallet actions must require explicit user consent.
3. NFC and travel features must be off by default.
4. Spending limits must be conservative and user-visible.
5. Recovery flows must be documented and tested before production use.
6. Destination and link safety checks should inform the user before sensitive actions.
7. Demo fallbacks must never be shipped as production security.
8. Logs must never expose seed material, private keys, recovery phrases, or decrypted secrets.

## Known development risks

The current codebase contains demo scaffolding and placeholder implementations. These are acceptable for early UI and architecture work but must be replaced before production.

Known areas requiring hardening:

- Secure storage implementation
- Randomness source validation
- Clock unlock production policy
- Recovery flow validation
- Mobile OS keychain / keystore integration
- NFC implementation
- Transaction review and approval flow
- Network adapter security
- Dependency vulnerability scanning
- Build signing and release process

## Reporting security issues

Until a dedicated security contact is published, report issues privately to the repository owner. Do not open public issues containing exploit details, recovery phrases, private keys, or sensitive user data.

## Production release requirement

Before any production release, Nomad requires:

1. Threat model review
2. Dependency audit
3. Mobile secure-storage review
4. Wallet-core audit
5. Recovery-flow review
6. Build pipeline review
7. External security assessment
8. Clear user warnings and terms
