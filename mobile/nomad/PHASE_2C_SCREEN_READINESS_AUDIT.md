# Phase 2C Screen Readiness Audit

This file is the developer handoff audit for the 26 Nomad overlay screens.

Phase 2C does not make Nomad production-ready by itself. It documents the current readiness state of every screen before the selected wallet engine and live services are connected.

## Readiness legend

| Status | Meaning |
| --- | --- |
| Ready for engine integration | Screen is wired through a Nomad hook/adapter and can receive live data once a concrete adapter is injected. |
| Needs live adapter | Screen is structurally ready but currently uses local/demo adapter data. |
| Needs production enforcement | Screen displays or requests a protective action, but backend/device/wallet policy must enforce it later. |
| Needs local verification | TypeScript, Expo bundling, and runtime behavior must be verified locally or in CI. |

## Required local verification

Run these commands before Phase 2E engine integration:

```bash
npm install
npm run audit:nomad
cd mobile
npm install
npm run typecheck
npx expo start
```

Connector-only work cannot prove TypeScript or Expo runtime success. Treat this file as an architecture and handoff audit, not a compiled build certificate.

## Screen readiness matrix

| # | Route | Area | Adapter path | Current readiness | Phase 2 / Phase 3 action |
| ---: | --- | --- | --- | --- | --- |
| 1 | `Portfolio` | Wallet | `useNomadWallet` -> wallet adapter | Ready for engine integration | Replace portfolio, balance, asset, and transaction summary data with cloned-wallet engine output. |
| 2 | `Wallets` | Wallet | `useNomadWallet` -> wallet adapter | Ready for engine integration | Connect real assets, chains, account labels, token metadata, and hidden/custom asset persistence. |
| 3 | `SendBitcoin` | Wallet | `useNomadWallet.createTransaction` | Needs live adapter | Keep review-draft behavior, then hand draft to live engine for signing/broadcast after user approval. |
| 4 | `ReceiveBitcoin` | Wallet | `useNomadWallet.getReceiveAddress` | Needs live adapter | Replace placeholder receive address/QR value with engine-derived addresses per chain/account. |
| 5 | `Swap` | Wallet / liquidity | `useNomadSwap` -> swap adapter | Needs live adapter | Replace demo quote with real quote provider and route accepted quote into live wallet signing flow. |
| 6 | `TravelMode` | Travel | `useNomadTravel` | Needs live adapter | Connect live Travel Pocket region, currency rail, spend limits, and settlement policy. |
| 7 | `SecurityCenter` | Security | `useNomadSecurity` | Needs production enforcement | Connect real device/session risk, policy status, recovery status, and freeze enforcement. |
| 8 | `Settings` | Settings | `useNomadSettings` | Ready for engine integration | Connect profile, notification preferences, app configuration, and real logout/session handling. |
| 9 | `NomadInsights` | Insights | `useNomadInsights` | Needs live adapter | Replace demo analytics with live portfolio, spending, travel, and freedom-score data. |
| 10 | `NomadInsightsSpending` | Insights | `useNomadInsights` | Needs live adapter | Connect real merchant/category data, transaction history, budgets, and recurring payment detection. |
| 11 | `RecoveryCenter` | Recovery | `useNomadRecovery` | Needs production enforcement | Connect real recovery backend, signer status, abuse prevention, and time-lock rules. |
| 12 | `VoltaireProtocols` | Protocols | `useNomadProtocols` | Needs live adapter | Connect live Voltaire Protocols telemetry, uptime, nodes, services, and status feed. |
| 13 | `BlockPagesSafety` | BlockPages | `useNomadBlockPagesSafety` | Needs live adapter | Connect live BlockPages privacy/risk backend and real report/scanner counts. |
| 14 | `TimeClockAccess` | Recovery | `useNomadRecovery` | Needs production enforcement | Reconcile Time Set behavior with full HH:MM:SS if required and enforce unlock policy in wallet engine. |
| 15 | `UnlockWallet` | Recovery / lock gate | `useNomadRecovery` | Needs production enforcement | Ensure unlock state comes from secure engine session state, not visual state alone. |
| 16 | `RecoverLostWallet` | Recovery | `useNomadRecovery` | Needs production enforcement | Connect sequence capture to secure validation backend; do not expose or store seed material in UI. |
| 17 | `VerifyRecoverySequence` | Recovery | `useNomadRecovery` | Needs production enforcement | Replace local sequence checks with production recovery validation and rate limits. |
| 18 | `WalletRecovered` | Recovery | `useNomadRecovery` | Needs production enforcement | Connect final recovered state to engine session restoration and user safety checklist. |
| 19 | `OwnerAuthorityApproval` | Recovery | `useNomadRecovery` | Needs production enforcement | Connect approvals to real notification/signature/guardian service. |
| 20 | `AddressSafetyDetail` | BlockPages | `useNomadSafety` | Needs live adapter | Connect live address risk scoring, chain labels, sanctions/phishing lists, and send-precheck handoff. |
| 21 | `TopUpTravelPocket` | Travel | `useNomadTravel` + `useNomadWallet` | Needs live adapter | Connect real funding quote, rails, spend-pocket settlement, and final engine signing handoff. |
| 22 | `ApprovePOSTransaction` | Travel / POS | `useNomadWallet.createTransaction` | Needs production enforcement | Connect merchant payload verification, device approval, risk check, and final signed payment flow. |
| 23 | `CreateOwnerAuthority` | Recovery | `useNomadRecovery` | Needs production enforcement | Connect real authority creation, contact verification, consent, notifications, and revocation. |
| 24 | `BlockPagesURLScanner` | BlockPages | `useNomadSafety` | Needs live adapter | Connect live URL/drainer/phishing backend and persistent scam report flow. |
| 25 | `EmergencyFreeze` | Security | `useNomadSecurity` | Needs production enforcement | Connect freeze actions to live wallet/session/backend policy and audit logging. |
| 26 | `NomadWatch` | Watch | `useNomadWatch` | Needs live adapter | Connect real watch pairing, sync, battery, firmware, travel status, and emergency actions. |

## Cross-screen readiness checks

### Loading states

Most screens now receive loading/error state through hooks. Dev team should verify every screen visually handles loading without layout breakage.

Priority routes to verify first:

1. `Portfolio`
2. `Wallets`
3. `SendBitcoin`
4. `ReceiveBitcoin`
5. `Swap`
6. `TravelMode`
7. `RecoveryCenter`
8. `SecurityCenter`
9. `EmergencyFreeze`
10. `NomadWatch`

### Empty states

The cloned-wallet engine must define expected empty responses for:

- no wallet session
- no assets
- no transaction history
- no Travel Pocket balance
- no recovery signers
- no security alerts
- no BlockPages scan results
- no watch device paired

Screens should never crash when arrays are empty.

### Error states

All live adapters should return safe display errors. Do not leak provider URLs, private RPC details, key-storage internals, or raw backend stack traces into the UI.

Required standard error categories:

- wallet unavailable
- network unavailable
- quote expired
- address unavailable
- scan unavailable
- recovery locked
- approval expired
- watch disconnected

### Locked/session states

Wallet session state must come from the engine. Nomad screens may display locked state but must not bypass it.

Required behavior:

- locked wallet should not allow send, swap, POS, or top-up signing
- receive can show addresses only if the engine allows view-only receive while locked
- emergency freeze may remain available as a protective action if the engine supports it
- recovery pages must use production recovery policy, not visual state alone

### Offline states

Offline behavior should be defined before release:

- cached portfolio display may be allowed with stale-state labels
- no broadcast, swap, POS, or top-up should proceed offline
- BlockPages scanner should show unavailable/offline state
- watch sync should show last synced timestamp

## Demo/live replacement notes

These are the main local/demo replacements required before production:

1. Replace local wallet service with selected wallet engine or secure adapter.
2. Replace placeholder receive addresses and QR data with engine-derived addresses.
3. Replace transaction draft-only Send/Swap/POS flows with final engine approval/sign/broadcast handoff.
4. Replace local Travel Pocket state with live rail/pocket backend.
5. Replace local security/freeze state with enforceable wallet/backend policy.
6. Replace local recovery sequence state with production recovery service.
7. Replace local Owner Authority state with notification/guardian approval backend.
8. Replace BlockPages safety mocks with live scanner service.
9. Replace Voltaire Protocols demo telemetry with live backend status.
10. Replace Nomad Watch demo status with real device pairing/sync service.

## Key custody and signing audit

Phase 2C preserves the core boundary:

```txt
Nomad overlay may display, request, draft, and route.
The selected wallet engine must derive, store, sign, broadcast, and index.
```

No Phase 2C screen should own:

- private keys
- seed phrases
- account derivation
- signing
- broadcasting
- chain provider selection
- canonical transaction history indexing

## Phase 2C conclusion

The 26-screen Nomad overlay is ready for developer handoff and engine integration planning.

The next phase is Phase 2D: local compile/audit pass. After TypeScript and Expo issues are fixed, Phase 2E can begin by selecting or importing the base wallet engine and implementing concrete adapters beside `clonedWalletAdapterTemplate.ts`.
