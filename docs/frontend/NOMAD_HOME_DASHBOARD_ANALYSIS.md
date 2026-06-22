# Nomad Home Dashboard Front-End Analysis

Source design: uploaded Nomad mobile dashboard mockup.

## Page 1: Home / Portfolio Dashboard

This screen is the main unlocked wallet experience. It combines portfolio visibility, safety status, travel spending controls, security health, and the wider Voltaire Protocols ecosystem in one mobile-first dashboard.

### Locked visual direction

- Dark mobile Web3 wallet interface.
- Neon blue primary system color.
- Neon green for security, active state, positive market movement, and Travel Pocket controls.
- Purple and gold accents for Voltaire ecosystem modules.
- Rounded glass panels with thin glowing borders.
- Card stack layout optimized for a phone viewport.
- Bottom tab bar for primary app navigation.

## Section breakdown

### 1. Device/status bar

Purpose: establishes native mobile framing.

Elements:

- Time at top-left.
- Signal/Wi-Fi/battery cluster at top-right.
- Black safe-area background.

Implementation note: represented visually inside the React Native screen for now. A production Expo/native build can rely on the OS status bar instead.

### 2. Nomad header

Purpose: establishes product identity and system trust.

Elements:

- Blue shield/pulse Nomad icon.
- `NOMAD` wordmark.
- `Built on Voltaire Protocols` subtitle.
- `All Systems Secure` pill.
- Notification bell.

Security message:

- The top-right pill should never imply real-funds approval during beta.
- It only represents local safety posture until production audit approval.

### 3. Portfolio value card

Purpose: gives the user the main wallet snapshot.

Elements:

- Total Portfolio Value.
- Privacy/visibility icon placeholder.
- USD total.
- 24h movement indicator.
- Blue sparkline chart treatment.
- Asset row for BTC, HBAR, XRP, XLM, and More.

Current implementation:

- Uses live demo portfolio balances when available from `portfolio.balances`.
- Falls back to mock design values when no demo wallet portfolio is loaded.

Future implementation:

- Add real chart component only after production wallet-data service and audit gates are ready.
- Add privacy toggle state for hiding/showing balances.

### 4. Quick actions

Purpose: direct wallet action entry points.

Actions:

- Send.
- Receive.
- Swap.
- Travel.

Current implementation:

- Travel routes into the existing `TravelMode` screen.
- Send/Receive/Swap are front-end placeholders until the transaction review and owner-confirmation flows are production-ready.

Safety rule:

- No quick action should bypass owner confirmation.
- NFC can request, but cannot approve.

### 5. Travel Pocket card

Purpose: isolates travel spending from the main wallet.

Elements:

- Travel Pocket title and active/ready status.
- Balance.
- Daily limit.
- Trip limit.
- Expiry date.
- Progress bars.
- Manage Travel Pocket call-to-action.

Nomad product alignment:

- This directly supports the repo principle of main-wallet isolation from travel spending and capped Travel Pocket controls.
- The Travel Pocket card should be the primary place for travel limits, region settings, expiry controls, and stable-value rail preference.

Current implementation:

- Manage Travel Pocket routes to the existing `TravelMode` screen.
- Shows preferred stablecoin if one exists in state.

### 6. Security Center card

Purpose: makes safety posture visible without overwhelming the user.

Security statuses:

- Secure Storage: Secure.
- Owner Authority: Active.
- Device Integrity: Verified.
- Recovery Status: Ready.

Nomad product alignment:

- Reinforces explicit owner consent.
- Reinforces recovery and device-health concepts.
- Should stay connected to production readiness gates before real funds are enabled.

### 7. Voltaire Ecosystem card

Purpose: shows Nomad as one product inside the larger Voltaire Protocols ecosystem.

Modules shown:

- Nomad.
- AutoDeFi.
- BlockPages411.
- Sovereign Payroll.
- Guardian Trader.
- Quantum Lottery.
- Decentralized Retirement.

Implementation note:

- Current version is a horizontal ecosystem rail.
- Future version can deep-link to live Voltaire ecosystem products as those modules are connected.

### 8. Bottom navigation

Purpose: primary mobile navigation.

Tabs:

- Home.
- Wallets.
- Travel.
- Security.
- Settings.

Current implementation:

- Home is active.
- Travel routes to `TravelMode`.
- Security currently locks wallet as a safe placeholder action.

Future implementation:

- Add dedicated screens for Wallets, Security, and Settings.
- Replace placeholder icons with approved Nomad SVG/vector assets.

## Repository changes made

Updated:

```txt
mobile/screens/PortfolioScreen.tsx
```

Added:

```txt
docs/frontend/NOMAD_HOME_DASHBOARD_ANALYSIS.md
```

## Beta safety notes

This design is front-end only. It does not enable real funds, real stablecoin settlement, silent signing, main-wallet direct NFC spending, or production private-key custody.

The existing Nomad safety position remains unchanged:

```txt
Real funds: disabled
Production wallet engine: pending audit and replacement
Closed beta/demo mode: enabled
```
