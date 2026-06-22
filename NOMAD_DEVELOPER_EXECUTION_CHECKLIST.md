# Nomad Developer Execution Checklist

This checklist is the practical task board for the developer who will finish piecing Nomad together.

Nomad's mission has not changed: Nomad is the branded wallet overlay and protection layer. The selected base wallet engine remains responsible for custody, account derivation, signing, broadcasting, providers, balances, and canonical transaction history.

## Current handoff status

- Phase 1: Overlay Foundation — complete.
- Phase 2A: Adapter Contract Hardening — complete.
- Phase 2B: Cloned-Wallet Bridge Scaffold — complete.
- Phase 2C: Screen Readiness Audit — complete.
- Phase 2D: Local Compile/Audit Execution — ready for developer/local machine.
- Phase 2E: Base Wallet Engine Integration — prepared, not completed.
- Phase 3: Live Nomad Services — prepared, not completed.
- Phase 4: Production Audit/Release — prepared, not completed.

## Start here

1. Read `NOMAD_FINAL_HANDOFF_PACKAGE.md`.
2. Read `DEV_HANDOFF.md`.
3. Read `NOMAD_HANDOFF_CONSISTENCY_AUDIT.md`.
4. Read `NOMAD_PHASE_ROADMAP.md`.
5. Run the local audit commands from `mobile/nomad/PHASE_2D_LOCAL_AUDIT_CHECKLIST.md`.
6. Record every TypeScript, dependency, Expo, or runtime issue before making structural changes.

## Phase 2D execution tasks

### 2D.1 Fresh clone and install

- Clone the repository.
- Install root dependencies.
- Install mobile dependencies.
- Confirm Node and Expo versions.
- Confirm the mobile app can start in Expo.

Expected commands:

```bash
npm install
cd mobile
npm install
npm run typecheck
npm run audit:nomad
npm run start
```

From the repository root:

```bash
npm run audit:nomad
```

### 2D.2 Route smoke test

Manually open or route through all 26 Nomad screens:

1. Portfolio
2. Wallets
3. Send Bitcoin
4. Receive Bitcoin
5. Swap
6. Travel Mode
7. Security Center
8. Settings
9. Nomad Insights
10. Nomad Insights Spending
11. Recovery Center
12. Voltaire Protocols
13. BlockPages Safety
14. Time Clock Access
15. Unlock Wallet
16. Recover Lost Wallet
17. Verify Recovery Sequence
18. Wallet Recovered
19. Owner Authority Approval
20. Address Safety Detail
21. Top Up Travel Pocket
22. Approve POS Transaction
23. Create Owner Authority
24. BlockPages URL Scanner
25. Emergency Freeze
26. Nomad Watch

For each screen, verify:

- route opens without crashing;
- back/navigation action works;
- primary action button has a valid route or safe local action;
- loading/error/empty state does not break layout;
- the screen does not store private keys, seed phrases, or signing logic.

### 2D.3 Fix compile/runtime errors only

During Phase 2D, do not redesign the product. Fix only:

- TypeScript errors;
- missing imports/exports;
- invalid route names;
- broken component props;
- dependency/version issues;
- obvious runtime crashes;
- screen layout issues caused by missing data.

Do not move custody, signing, seed handling, or broadcast logic into Nomad screens.

## Phase 2E wallet-engine integration tasks

### 2E.1 Select the base wallet engine

The base engine must provide:

- secure wallet creation/import;
- secure seed/private-key storage;
- chain/account derivation;
- supported chain/account listing;
- receive address generation;
- balances and assets;
- transaction history;
- transaction draft review;
- user approval before signing;
- signing inside the wallet engine/provider;
- transaction broadcasting;
- lock/unlock/session state;
- testnet support;
- compatible open-source license.

### 2E.2 Implement concrete adapter bridge

Start from:

```txt
mobile/nomad/adapters/clonedWalletAdapterTemplate.ts
```

Implement a production adapter that satisfies:

- `NomadWalletAdapter`
- `NomadTravelAdapter` where wallet data is required
- `NomadSwapAdapter` where wallet execution is required
- `NomadSettingsAdapter` for session/profile state
- any additional provider overrides required by the selected engine

### 2E.3 Connect through provider, not screens

The integration path must remain:

```txt
Selected base wallet engine
    -> concrete Nomad adapters
    -> NomadAdaptersProvider
    -> Nomad hooks
    -> 26 Nomad screens
```

Screens should not import the base wallet engine directly.

### 2E.4 Remove unsafe demo custody fallback

Before production, remove or hard-disable demo/local seed fallback behavior from the local wallet service. No production build may rely on plaintext seed fallback behavior.

## Phase 3 live service tasks

### 3.1 BlockPages live scanner

Connect live URL/address risk scoring behind the safety adapter. Keep privacy and audit logging clear.

### 3.2 Travel Pocket service

Connect real funding, regional currency/spend rules, limits, and transaction handoff through adapters.

### 3.3 POS approval flow

Connect POS approval to a real payment action request, then route final signing/execution through the wallet engine.

### 3.4 Emergency Freeze enforcement

Connect freeze state to real wallet-engine protections and backend enforcement where applicable.

### 3.5 Owner Authority and recovery backend

Connect real approval, signer/quorum, recovery sequence, and audit trail services.

### 3.6 Nomad Watch sync

Connect watch/device state, sync status, emergency actions, spending limits, and travel state.

### 3.7 Voltaire Protocols live status

Connect live protocol status, uptime, network/service health, and ecosystem cards.

### 3.8 Swap quote provider

Connect real quote providers. Final signing and broadcast must stay inside the wallet engine.

## Phase 4 production release tasks

Before public release, complete:

- root/mobile TypeScript pass;
- Expo/mobile build pass;
- custody audit;
- signing/broadcast audit;
- receive address/QR audit;
- recovery attack-path audit;
- emergency freeze audit;
- BlockPages privacy/security audit;
- Travel Pocket/POS audit;
- Nomad Watch/device audit;
- 26-screen QA pass;
- legal/privacy/terms review;
- testnet rollout;
- staged mainnet rollout;
- app-store readiness.

## Non-negotiable guardrails

Nomad may:

- display wallet state;
- request quotes;
- prepare reviewable drafts;
- route approvals;
- show risk/safety state;
- manage overlay UX for travel, recovery, freeze, watch, and settings.

Nomad must not:

- store seed phrases;
- derive accounts;
- hold private keys;
- sign transactions in screens;
- broadcast transactions from screens;
- bypass user approval;
- collapse the 26-screen product into a generic wallet shell.

## Completion definition

Nomad is complete only when:

1. all 26 screens pass mobile QA;
2. local and CI typechecks pass;
3. the selected wallet engine is integrated through adapters;
4. demo wallet custody fallback is removed or disabled for production;
5. live services are connected or explicitly feature-flagged;
6. all Phase 4 audits pass;
7. the final release build is signed off by the developer and owner.
