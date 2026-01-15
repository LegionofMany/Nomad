# Nomad Wallet

## Phase One White Paper

**Version:** 1.0 (Phase One)

---

## 1. Introduction

Nomad is a non-custodial cryptocurrency wallet designed for real-world use, particularly for people who travel, move between regions, and require both security and usability. Nomad prioritizes deliberate action, user understanding, and explicit consent over speed or abstraction.

This document describes the architecture, security model, and design philosophy of Nomad Phase One. It is not a marketing document. It exists to explain *how* Nomad works, *why* certain design decisions were made, and *what risks remain*.

---

## 2. Design Philosophy

Nomad is built on the following principles:

* **Non-custodial by default**: Users always control their keys.
* **Calm security**: Security mechanisms should reduce anxiety, not increase it.
* **Explicit consent**: Nothing moves without clear user approval.
* **Damage limitation**: No single mistake should result in catastrophic loss.
* **Honest boundaries**: Residual risks are documented, not hidden.

Nomad intentionally avoids features that introduce hidden trust, silent automation, or irreversible complexity.

---

## 3. Architecture Overview

Nomad is composed of several independent but cooperating layers:

1. **Key Management Layer** — Secure key storage and signing
2. **Clock Authority Layer** — User-controlled unlock mechanism
3. **Network Layer** — Blockchain interaction and confirmation
4. **Travel & Spending Layer** — NFC and card-based payments
5. **Recovery Layer** — Offline recovery mechanisms
6. **UX & Trust Layer** — Language, onboarding, and user education

Each layer is designed to fail safely and independently.

---

## 4. Key Management

Private keys are generated and stored locally using the device’s secure enclave or keystore when available. Keys never leave the device and are never transmitted to Nomad or any third party.

Nomad supports multiple chains through adapters, including:

* Bitcoin (BTC)
* Ethereum (ETH)
* Hedera (HBAR)
* ERC-20 tokens

Nomad does not restrict assets to regional stablecoins. Stablecoins are used optionally for spending convenience.

---

## 5. Clock-Based Authority Model

Instead of passwords or PINs, Nomad uses a clock-based authority model.

### 5.1 Daily Unlock

For everyday use, users unlock actions by rotating a clock interface to a specific time known only to them. This is done in a single smooth motion.

Security is enhanced through:

* Rate limiting
* Directional and velocity variance
* Subtle UI randomization

The system appears simple but provides higher entropy than traditional PIN-based unlocks.

### 5.2 Separation of Unlock and Recovery

The daily unlock time is distinct from recovery mechanisms. Forgetting an unlock time does not endanger funds.

---

## 6. Recovery System

Nomad uses a 24-time-set recovery system. During setup, users create multiple recovery time configurations that can be used offline to restore access on a new device.

Key properties:

* Recovery is offline
* No cloud storage
* No customer support backdoor
* No single point of failure

If all recovery material is lost, funds are unrecoverable. This is an explicit and documented risk.

---

## 7. Transaction Signing & Approvals

Every transaction requires explicit user approval.

Nomad enforces:

* Human-readable transaction summaries
* Clear network identification
* No silent or background signing
* No blanket approvals

High-risk approvals are flagged before signing.

---

## 8. Travel Mode & Payments

Travel Mode is an optional feature designed for real-world payments.

### 8.1 Prefunded Spending

Users choose an amount to pre-fund for travel or daily spending. Only this balance is exposed to NFC or card-based payments.

### 8.2 NFC Controls

* NFC is off by default
* Explicit tap-to-enable
* Region and amount limits
* Auto-expiry
* Instant freeze capability

Travel Mode cannot drain the main wallet.

---

## 9. Threat Model Summary

Nomad’s threat model considers:

* Device compromise
* Malicious applications
* Network spoofing
* Rogue merchants
* Social engineering
* Human error

No single attack vector allows silent full-wallet loss. Damage is intentionally capped where possible.

---

## 10. Worst-Case Scenarios

Worst-case simulations demonstrate that:

* Travel losses are limited to prefunded balances
* Stolen devices do not expose main wallet funds
* Malicious approvals require explicit user action
* Recovery remains possible without third-party trust

Residual risks are documented and accepted.

---

## 11. Phase One Scope & Limitations

Phase One intentionally excludes:

* Automated DeFi strategies
* High-frequency trading tools
* Custodial recovery
* Background signing

These exclusions are deliberate to preserve clarity and safety.

---

## 12. Phase Two Outlook

Future phases may include:

* Additional networks
* Advanced clock modes
* Hardware wallet pairing
* Expanded payment integrations

Phase Two features will not alter Phase One security guarantees.

---

## 13. Conclusion

Nomad Phase One is a complete, production-ready wallet architecture designed around user intent, safety, and transparency. It favors deliberate action over automation and documentation over assumption.

Users are encouraged to understand the system before entrusting it with meaningful value.

---

## Disclaimer

Nomad is non-custodial software. Users are solely responsible for safeguarding their recovery materials. Nomad provides no account recovery, guarantees, or insurance.
