# Nomad Wallet

**Nomad** is a non-custodial, security-first crypto wallet designed for real-world travel and everyday use. It combines a calm, human-centered UX with strong security primitives, including a clock-based unlock mechanism, capped travel spending, and explicit user consent for every action.

---

## ✨ Key Principles

* **Non-custodial**: Keys never leave the user’s device
* **Clock-based unlock**: A single smooth motion to unlock actions
* **Explicit consent**: No silent signing or spending
* **Travel-safe by design**: NFC and card spending are capped and optional
* **Honest security**: Residual risks are documented, not hidden

---

## 🔐 Security Overview

* Secure enclave / keystore for private keys
* Gesture-based clock unlock (rate-limited, shoulder-surf resistant)
* 24 time-set offline recovery system
* Human-readable transaction summaries
* No blanket approvals

See the threat model and worst-case simulations in `/docs/security`.

---

## 🌍 Supported Assets & Networks

Nomad is **not limited to regional stablecoins**.

* Native assets: BTC, ETH, HBAR
* ERC-20 tokens (including major stablecoins)
* Multi-network support via adapters

Regional stablecoins are used **only** for travel and spending convenience.

---

## ✈️ Travel Mode & Payments

* NFC is **off by default**
* Explicit tap-to-enable
* Prefunded spending only
* Region- and amount-based limits
* Instant freeze and auto-expiry

Travel mode can never drain the main wallet.

---

## 🧭 Project Structure (High Level)

```
/src
  /identity        # Promises, language, core terms
  /onboarding      # First-run experience and tutorials
  /security        # Clock logic, signing, recovery
  /travel          # NFC, region logic, spending caps
  /network         # RPC handling, confirmations
/docs
  /security        # Threat model & simulations
```

---

## 🧪 Development Status

* Core wallet architecture: ✅ Complete
* UX & onboarding: ✅ Complete
# Nomad Wallet 🧭

Nomad is a next-generation, non-custodial, travel-first crypto wallet designed for global payments, regional stablecoin usage, and enhanced security.

## ✨ Key Features

- 🔐 Clock-based wallet unlock system
- 🕒 24-point recovery mechanism
- 🌍 Region-aware stablecoin routing
- 📡 NFC payment abstraction
- 🔑 Fully non-custodial
- 🧩 Modular security architecture

## 🏗 Project Structure

Nomad/
├─ wallet-core/      # Cryptography & key management
├─ security/         # Clock unlock, recovery, lockout
├─ travel/           # Travel Mode & region logic
├─ Mobile Dapp/      # React Native application
├─ docs/             # Documentation
├─ whitepaper/       # Whitepaper drafts


## 🚀 Development Status

- Phase A–D: ✅ Complete
- Phase E (UI polish): ⏳ In progress
- Phase F (audit & beta): ⏳ Pending

## ⚠️ Disclaimer

This software is provided for **educational and beta testing purposes only**.  
Do **not** use with real funds until audited.


## 📄 License
MIT License

