# Nomad Phase 2E Base Engine Selection and Integration Plan

Phase 2E is the point where a real wallet engine is selected and connected underneath the Nomad overlay.

This file is intentionally written so the developer can continue even before the final engine is chosen. It defines the selection criteria, integration path, required adapter methods, acceptance checks, and production blockers.

## Current status

| Area | Status |
| --- | --- |
| Nomad overlay screens | Complete for Phase 1 |
| Adapter contracts | Complete for Phase 2A |
| Cloned-wallet bridge template | Complete for Phase 2B |
| Screen readiness audit | Complete for Phase 2C |
| Local compile/audit checklist | Prepared for Phase 2D |
| Real wallet engine | Not selected / not connected |
| Production custody | Not ready |

## Phase 2E goal

Replace the local/demo wallet service with a production-grade wallet engine while preserving this boundary:

```txt
Base wallet engine
  owns custody, accounts, signing, broadcast, providers, balances, history

Nomad overlay
  owns UX, travel, protection, recovery, watch, settings, protocol status, and draft handoff
```

Nomad screens must not be rewritten to know the selected engine. The selected engine should connect through a concrete adapter that satisfies the Nomad adapter contracts.

## Engine selection criteria

The selected base wallet engine should support or be able to support:

1. Secure wallet creation and import.
2. Secure seed/private-key storage on iOS and Android.
3. Account derivation for the chains Nomad will launch with.
4. Receive address generation per chain/account.
5. Real balance reads.
6. Canonical transaction history.
7. Transaction draft creation or transaction request parsing.
8. User approval flow before signing.
9. Transaction signing.
10. Transaction broadcasting.
11. Wallet lock/unlock/session state.
12. Provider/RPC failover or a clear provider injection path.
13. Testnet support for pre-release validation.
14. Clear licensing that allows the intended use.
15. Maintained dependencies and a security posture acceptable for custody software.

## Required due diligence before choosing an engine

Before importing any base wallet, the developer should record:

- Repository URL.
- License.
- Last meaningful update.
- Supported chains.
- Mobile framework compatibility.
- Custody model.
- Key-storage approach.
- Signing architecture.
- Known audit history, if available.
- Dependency risk notes.
- Any parts that must be removed, disabled, or isolated.

## Recommended integration shape

Create a concrete adapter beside the existing template:

```txt
mobile/nomad/adapters/clonedWalletAdapterTemplate.ts
mobile/nomad/adapters/<selectedEngine>NomadAdapter.ts
```

The concrete adapter should map the chosen engine into:

```ts
NomadOverlayAdapters
```

At minimum, the first production integration must implement:

- `wallet.getSessionState`
- `wallet.getSupportedChains`
- `wallet.getAccounts`
- `wallet.getWalletBalance`
- `wallet.getAssets`
- `wallet.getReceiveAddress`
- `wallet.createTransaction`
- `wallet.getTransactionHistory`
- `wallet.signTransaction`
- `wallet.broadcastTransaction`
- `wallet.lockWallet`
- `wallet.unlockWallet`

Swap, POS, Travel Pocket top-up, and other money-moving overlays should continue to request drafts until the user approves signing through the selected wallet engine.

## Adapter injection path

Once a concrete adapter exists, inject it through:

```txt
mobile/nomad/adapters/NomadAdaptersProvider.tsx
```

The intended runtime path is:

```txt
Selected wallet engine
        ↓
Concrete Nomad adapter
        ↓
NomadAdaptersProvider
        ↓
Nomad hooks
        ↓
26 Nomad screens
```

## Demo service replacement checklist

Before production, the developer must either remove, hard-disable, or isolate the local/demo wallet service paths.

Verify and replace:

- Local demo wallet creation/import.
- Any demo fallback seed path.
- Mock receive address generation.
- Mock balances.
- Mock asset list.
- Mock transaction history.
- Draft-only send behavior where a production sign/broadcast flow is required.
- Draft-only swap behavior where a production sign/broadcast flow is required.
- POS approval mock behavior where a production wallet approval flow is required.

## Minimum Phase 2E acceptance checks

Phase 2E should not be marked complete until:

1. A base engine is selected and documented.
2. A concrete Nomad adapter is created.
3. The concrete adapter is injected through `NomadAdaptersProvider`.
4. Wallet session state comes from the real engine.
5. Receive addresses come from the real engine.
6. Balances come from the real engine.
7. Transaction history comes from the real engine.
8. Send creates a real wallet-engine transaction request.
9. Signing requires explicit user approval.
10. Broadcast result is returned by the engine and surfaced to Nomad.
11. Local/demo seed fallback is removed or unreachable in production builds.
12. `npm run audit:nomad` passes.
13. The 26-screen route smoke test passes.

## Phase 2E output

When complete, the repo should be describable as:

```txt
Nomad Phase 2E complete: the overlay is connected to a real wallet engine through production adapter boundaries, with custody and signing controlled by the base engine and Nomad screens remaining overlay-only.
```

## Phase 2E not included

Phase 2E does not complete all live Nomad services. The following remain Phase 3 unless the developer intentionally pulls them forward:

- Live BlockPages scanner backend.
- Live Travel Pocket rails.
- Live emergency freeze policy enforcement beyond the wallet-engine lock layer.
- Real Owner Authority notification backend.
- Real recovery backend.
- Real Nomad Watch device sync.
- Voltaire Protocols live service status backend.
- Production swap liquidity provider.

## Final warning

Do not ship this app as a production wallet until Phase 2E, Phase 3, and Phase 4 are complete and audited. Phase 2E connects custody; Phase 4 proves custody is safe enough for release.
