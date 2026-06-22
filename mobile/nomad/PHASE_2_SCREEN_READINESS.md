# Phase 2C Screen Readiness Checklist

This checklist prepares the 26 Nomad overlay screens for developer handoff before the wallet engine is connected.

Nomad remains the overlay layer. The base wallet engine remains responsible for custody, accounts, secure storage, signing, broadcasting, providers, balances, transaction history, and secure unlock.

## Phase 2C goal

Every Nomad screen should be ready for real wallet integration by showing safe loading, error, locked, empty, and pending states without pretending to control production wallet actions.

## Global readiness rules

- Screens may request adapter data, quotes, drafts, approvals, scans, sync status, and route changes.
- Screens must not store custody material or implement signer/broadcast logic.
- Transaction screens may create reviewable drafts only until the wallet engine completes signing and broadcast.
- Emergency Freeze may show request state now; final enforcement must come from the wallet engine or backend service.
- Recovery and Owner Authority may show progress and approval states now; production recovery must be backed by the secure wallet/recovery engine.
- BlockPages safety screens may show local scan output now; production scoring must come from the live BlockPages scanner.
- Travel Pocket may show local/demo spend state now; production spend limits, rails, and regional conversion must come from live services.

## Screen-by-screen readiness

| # | Route | Area | Adapter | Phase 2C readiness action |
|---:|---|---|---|---|
| 1 | Portfolio | wallet | wallet | Confirm locked-wallet fallback, balance loading state, empty asset state, and retry action. |
| 2 | Wallets | wallet | wallet | Confirm zero-assets state, custom asset warning copy, and receive/send route guards. |
| 3 | SendBitcoin | wallet | wallet | Confirm send only creates a draft; add rejected/insufficient/locked copy from wallet adapter failure codes. |
| 4 | ReceiveBitcoin | wallet | wallet | Confirm receive address comes from adapter and QR placeholder is marked replaceable by wallet engine. |
| 5 | Swap | wallet | swap | Confirm quote loading, expired quote, unsupported pair, and draft-only swap handoff states. |
| 6 | TravelMode | travel | travel | Confirm disabled Travel Pocket state, region/currency fallback, and local/demo notice until live rails connect. |
| 7 | SecurityCenter | security | security | Confirm scan loading/error states and separate overlay status from real wallet enforcement. |
| 8 | Settings | settings | settings | Confirm logout only locks current wallet session through adapter. |
| 9 | NomadInsights | insights | insights | Confirm empty analytics state and fallback copy when pricing/history are not available. |
| 10 | NomadInsightsSpending | insights | insights | Confirm empty spending state and no assumption of real bank/card data. |
| 11 | RecoveryCenter | recovery | recovery | Confirm recovery progress copy does not imply custody recovery without the real wallet engine. |
| 12 | VoltaireProtocols | protocols | protocols | Confirm protocol telemetry is placeholder/service state until live backend connects. |
| 13 | BlockPagesSafety | blockpages | safety/security | Confirm safety score is local/demo until live BlockPages backend connects. |
| 14 | TimeClockAccess | recovery | recovery | Confirm countdown supports future HH:MM:SS upgrade and locked-wallet messaging. |
| 15 | UnlockWallet | recovery | recovery | Confirm unlock completion depends on recovery adapter state, not screen-owned custody logic. |
| 16 | RecoverLostWallet | recovery | recovery | Confirm sequence entry is adapter-owned and no recovery secret handling happens in UI. |
| 17 | VerifyRecoverySequence | recovery | recovery | Confirm verification is adapter-owned and production validation remains backend/wallet-engine owned. |
| 18 | WalletRecovered | recovery | recovery | Confirm completion state is display-only until production recovery engine is connected. |
| 19 | OwnerAuthorityApproval | recovery | recovery | Confirm pending/cancel states and no production approval enforcement in UI alone. |
| 20 | AddressSafetyDetail | blockpages | safety | Confirm scanner loading/error states and route back to Send when safe. |
| 21 | TopUpTravelPocket | travel | travel/wallet | Confirm top-up only prepares intent/draft until wallet signs and live rails settle. |
| 22 | ApprovePOSTransaction | travel | wallet | Confirm POS approval creates a draft only and does not broadcast. |
| 23 | CreateOwnerAuthority | recovery | recovery | Confirm authority creation is request state only until backend notification/enforcement connects. |
| 24 | BlockPagesURLScanner | blockpages | safety | Confirm URL scanner handles blank, risky, safe, error, and loading states. |
| 25 | EmergencyFreeze | security | security | Confirm freeze action is overlay request state until wallet/backend enforcement connects. |
| 26 | NomadWatch | watch | watch/security/recovery | Confirm sync/error/disconnected states and emergency actions remain adapter requests. |

## Phase 2C acceptance criteria

- All 26 pages remain registered in `mobile/nomad/audit/screenCoverage.ts`.
- All 26 pages remain marked `wired`.
- `ownsKeysOrSigning` remains `false` for every page.
- Send, Swap, POS, and Travel top-up continue to create drafts/intents only.
- Every page has a reasonable loading/error/empty/locked or pending state.
- No screen imports signer or broadcast implementation directly.

## Developer verification commands

```bash
npm install
npm run audit:nomad
cd mobile
npm run typecheck
npx expo start
```

## Remaining after Phase 2C

Once this checklist is satisfied, continue to Phase 2D local compile/audit fixes, then Phase 2E base wallet selection and adapter implementation.
