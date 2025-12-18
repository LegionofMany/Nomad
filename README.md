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
* Threat model & simulations: ✅ Complete
* External audit / pen test: ⏳ Planned
* White paper: ⏳ In progress

This repository represents a **v1-complete architecture**, pending external review and documentation finalization.

---

## 📄 Documentation

* Threat Model
* Worst-Case Scenario Simulations
* White Paper (coming soon)

Nomad intentionally separates **documentation** from **marketing**.

---

## ⚠️ Disclaimer

Nomad is non-custodial software. Users are responsible for safeguarding their recovery materials. There is no support backdoor and no account recovery by Nomad.

---

## 🤝 Contributing

Contribution guidelines will be published after the initial security audit.

---

## 🧠 Philosophy

> *Security should feel calm. Power should feel deliberate. Travel should feel safe.*

Nomad is built to move through the world with you — without rushing you.

