# Nomad Phase 2D — Local Compile and Audit Checklist

Phase 2D is the local validation pass for the Nomad overlay and adapter bridge. This phase does not connect the production wallet engine yet. Its purpose is to give the developer a clean, repeatable process to prove the current repository installs, typechecks, and launches before Phase 2E wallet-engine integration begins.

## Current phase position

```txt
Phase 1  — Overlay Foundation                         Complete
Phase 2A — Adapter contract hardening                  Complete
Phase 2B — Cloned-wallet bridge scaffold               Complete
Phase 2C — Screen readiness audit                      Complete
Phase 2D — Local compile and audit pass                In progress
Phase 2E — Base wallet engine selection/integration    Pending
Phase 3  — Live Nomad services                         Planned
Phase 4  — Production audit and release                Planned
```

## Goal

By the end of Phase 2D, the developer should be able to answer:

1. Does the root TypeScript project install and typecheck?
2. Does the mobile Expo project install and typecheck?
3. Does the mobile app launch in Expo?
4. Do all 26 Nomad overlay screens route without crashing?
5. Are any errors caused by the overlay, adapters, missing dependencies, or the local/demo wallet service?
6. Are there any blocker issues before connecting the selected wallet engine?

## Required environment

Recommended baseline:

- Node.js LTS
- npm matching the lockfile/runtime used by the project
- Expo CLI through `npx expo`
- iOS Simulator, Android Emulator, or Expo Go device
- GitHub access to `LegionofMany/Nomad`

## Fresh clone setup

```bash
git clone <repo-url>
cd Nomad
```

Install root dependencies:

```bash
npm install
```

Install mobile dependencies:

```bash
cd mobile
npm install
cd ..
```

## Root checks

Run the root TypeScript check:

```bash
npm run typecheck
```

Expected result:

- Passes with no TypeScript errors, or
- Fails with clear file/line errors to be patched before Phase 2E.

## Mobile checks

Run the mobile TypeScript check:

```bash
cd mobile
npm run typecheck
```

Or from repo root:

```bash
npm run mobile:typecheck
```

Expected result:

- Passes with no TypeScript errors, or
- Fails with import/type/runtime-boundary errors to be patched before Phase 2E.

## Full Nomad audit command

From repo root:

```bash
npm run audit:nomad
```

This should run both root and mobile typechecks.

## Expo launch check

From the mobile directory:

```bash
cd mobile
npm run start
```

or:

```bash
cd mobile
npx expo start
```

Then test one of:

- Expo Go physical device
- Android emulator
- iOS simulator
- Web preview, if supported by the dependencies

## Manual route smoke test

The developer should click through the 26 Nomad screens and confirm each route loads without a red screen.

### Wallet and transaction draft group

- Portfolio
- Wallets
- SendBitcoin
- ReceiveBitcoin
- Swap
- ApprovePOSTransaction

Confirm:

- No screen attempts to sign or broadcast.
- Send/Swap/POS only create reviewable drafts.
- Receive uses adapter-provided addresses and is ready for real wallet replacement.

### Travel group

- TravelMode
- TopUpTravelPocket

Confirm:

- Travel Pocket reads adapter state.
- Top-up flow remains a draft/request, not a live transfer.

### Security group

- SecurityCenter
- EmergencyFreeze

Confirm:

- Freeze state is overlay/local only until real wallet enforcement is connected.
- No private-key logic exists in the screen layer.

### Recovery group

- RecoveryCenter
- TimeClockAccess
- UnlockWallet
- RecoverLostWallet
- VerifyRecoverySequence
- WalletRecovered
- OwnerAuthorityApproval
- CreateOwnerAuthority

Confirm:

- Recovery flow uses adapter state.
- Time Set UI and backend time precision mismatch is documented.
- No seed phrase is displayed or reconstructed in the Nomad UI.

### BlockPages group

- BlockPagesSafety
- BlockPagesURLScanner
- AddressSafetyDetail

Confirm:

- URL/address checks use safety adapter paths.
- Live BlockPages backend remains a Phase 3 item.

### Insights / protocol / settings / watch group

- NomadInsights
- NomadInsightsSpending
- VoltaireProtocols
- Settings
- NomadWatch

Confirm:

- Screens load from hooks/adapters.
- Demo values are clearly replaceable by live adapters.
- Nomad Watch emergency actions remain overlay signals until real device/wallet enforcement exists.

## Known items to verify during Phase 2D

### 1. Local/demo seed fallback

The current local wallet service includes a demo fallback seed path for unsupported WebCrypto environments. This must be removed or replaced before production.

Phase 2D action:

- Locate the fallback.
- Confirm it is not used in production builds.
- Open a blocker issue if it remains reachable.

### 2. Time Set precision mismatch

Nomad UI expects a full HH:MM:SS style Time Set flow, while older local recovery types may only store hour/minute.

Phase 2D action:

- Confirm current type behavior.
- Decide whether to extend the base type before Phase 2E or leave it for the wallet engine integration.

### 3. QR receive mock

Receive screens are adapter-ready but require real wallet-engine addresses before production.

Phase 2D action:

- Confirm QR generation and address display do not claim to be final production receive flows.

### 4. Swap mock

Swap quote and draft flow are local/demo only.

Phase 2D action:

- Confirm no swap is signed or broadcast.
- Mark real swap provider as Phase 3 unless selected wallet engine includes it in Phase 2E.

### 5. BlockPages mock

Safety scans are adapter-backed but not live backend scans.

Phase 2D action:

- Confirm demo scan results are clearly replaceable.
- Keep live risk API integration in Phase 3.

## Error report template

When the developer finds an error, record it like this:

```md
## Error title

Area: root | mobile | screen | adapter | service | dependency
Command: npm run typecheck | npm run audit:nomad | npx expo start
File:
Line:
Error:
Expected behavior:
Actual behavior:
Suggested fix:
Blocking Phase 2E? yes/no
```

## Completion criteria

Phase 2D is complete when:

- Root dependencies install.
- Mobile dependencies install.
- `npm run typecheck` is attempted and results are documented.
- `npm run mobile:typecheck` is attempted and results are documented.
- `npm run audit:nomad` is attempted and results are documented.
- Expo launch is attempted and results are documented.
- All 26 routes are smoke-tested or any failing routes are listed.
- Any TypeScript/import/runtime issues are patched or converted into clear GitHub issues.

## Phase 2D output expected

At the end of this phase, the developer should produce either:

```txt
Phase 2D passed — ready for Phase 2E wallet engine integration.
```

or:

```txt
Phase 2D completed with blockers — see listed issues before Phase 2E.
```

## Boundary reminder

Nomad may display, request, draft, route, protect, and coordinate.

The selected wallet engine must derive, store, sign, broadcast, index, and enforce custody-level controls.
