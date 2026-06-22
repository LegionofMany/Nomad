# Nomad Phase 1 Wiring Audit

Nomad is the overlay layer. The cloned wallet remains the wallet engine for private keys, seed storage, signing, chain providers, balances, transaction history, and broadcast. Phase 1 connects Nomad screens to adapter contracts without moving wallet-engine responsibilities into the UI.

## Current overlay route status

The route registry mounts the Nomad overlay from `mobile/nomad/routes/nomadRoutes.ts` and includes the full current mobile route set:

- Foundation: `Lock`, `ClockUnlock`
- Wallet: `Portfolio`, `Wallets`, `SendBitcoin`, `ReceiveBitcoin`, `Swap`
- Travel: `TravelMode`, `TopUpTravelPocket`, `ApprovePOSTransaction`
- Security: `SecurityCenter`, `EmergencyFreeze`
- Recovery: `RecoveryCenter`, `TimeClockAccess`, `UnlockWallet`, `RecoverLostWallet`, `VerifyRecoverySequence`, `WalletRecovered`, `OwnerAuthorityApproval`, `CreateOwnerAuthority`
- Settings: `Settings`
- Insights: `NomadInsights`, `NomadInsightsSpending`
- Voltaire: `VoltaireProtocols`
- BlockPages: `BlockPagesSafety`, `BlockPagesURLScanner`, `AddressSafetyDetail`
- Watch: `NomadWatch`

## Adapter boundaries completed

The overlay adapter layer now has typed contracts for:

- Wallet data and transaction drafts
- Travel Pocket state
- Recovery and Time Set state
- Owner Authority request state
- Recovery sequence state
- Security and emergency freeze state
- Insights and spending state
- Swap quotes and swap drafts
- Voltaire Protocols state
- Nomad Watch state
- BlockPages URL and address safety scanning
- Settings state

## Screen wiring completed

The following screen groups now read through Nomad hooks/adapters instead of staying fully static:

- Portfolio and Wallets
- Send, Receive, Swap, and POS Approval
- Travel Pocket and Top Up Travel Pocket
- Security Center and Emergency Freeze
- Recovery Center, Time Clock Access, Unlock Wallet, Lost Wallet Recovery, Verify Recovery Sequence, Wallet Recovered, Owner Authority Approval, and Create Owner Authority
- BlockPages Safety, URL Scanner, and Address Safety Detail
- Insights Overview and Spending
- Voltaire Protocols Hub
- Nomad Watch
- Settings

## Safety decisions preserved

- Nomad does not own private keys or seed phrases.
- Nomad does not sign or broadcast transactions.
- Send, Swap, and POS flows create reviewable transaction drafts only.
- Unlock is still handled through the Time Set / recovery path.
- BlockPages safety scans remain behind a safety adapter that can later call the live BlockPages backend.
- Emergency Freeze is overlay state until the cloned wallet engine connects transaction blocking controls.

## Local audit commands

Run these after pulling the latest commits:

```bash
npm install
npm run audit:nomad
npm --prefix mobile run start
```

Or from the mobile folder:

```bash
cd mobile
npm install
npm run audit:nomad
npm run start
```

## Known follow-up items

- Replace local adapter demo values with cloned-wallet engine adapters after the wallet is cloned into the repo.
- Replace QR mock with a real QR generator tied to the adapter receive address.
- Replace local BlockPages scan heuristics with the live BlockPages scanner backend.
- Replace swap quote mock with real liquidity/quote provider integration.
- Replace static transaction history and spending categories with cloned-wallet transaction history.
- Upgrade Time Set backend from hour/minute to the full HH:MM:SS model used in the recovery UI.
- Remove any demo-only seed fallback before production.
