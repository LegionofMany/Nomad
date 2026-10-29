# Nomad Phase 2 Wallet Engine Handoff

Nomad Phase 1 is the overlay. Phase 2 prepares the repository for the cloned or imported wallet engine without requiring that engine to be selected first.

## Phase 2A: contract hardening status

Completed in this pass:

- Added explicit wallet chain types.
- Added wallet account types.
- Added wallet session state types.
- Added adapter failure codes for unsupported chains, locked wallet, expired sessions, missing providers, rejected signing, failed broadcast, unimplemented methods, and invalid requests.
- Added optional wallet adapter methods for supported chains, accounts, transaction history, signing, and broadcasting.
- Added broadcast result typing.
- Expanded transaction draft typing with chain/account/intent/approval metadata.
- Expanded safety scan results with provider and checked-at metadata.

## Phase 2B: cloned-wallet bridge template status

Completed in this pass:

- Added `mobile/nomad/adapters/clonedWalletAdapterTemplate.ts`.
- Added `ClonedWalletEngineBridge` so devs can map a selected wallet engine into the Nomad adapter boundary.
- Exported the template from the adapter barrel.
- Kept all sensitive operations unimplemented unless a real engine is passed in.

## Required cloned wallet responsibilities

The selected base wallet must provide:

- Secure wallet creation and import.
- Private key and seed storage.
- Account derivation.
- Real receive address generation.
- Real balances and transaction history.
- Chain provider and RPC management.
- Transaction signing.
- Transaction broadcasting.
- Provider error handling and retry strategy.
- Production-safe lock and unlock session behavior.

## Nomad overlay responsibilities

Nomad may request and display:

- Wallet balances and assets.
- Receive addresses returned by the engine.
- Reviewable transaction drafts.
- Swap quote handoff drafts.
- POS approval handoff drafts.
- Travel Pocket state.
- Safety scan results.
- Recovery status.
- Owner Authority status.
- Nomad Watch status.
- Settings and user preference state.

Nomad must not store or derive:

- Raw seed phrases.
- Raw private keys.
- Signing keys.
- Recovery secrets.
- RPC credentials in screen state.

## Integration path

1. Select the base wallet repository.
2. Import or clone the wallet engine into the repo.
3. Create a concrete adapter file beside `clonedWalletAdapterTemplate.ts`.
4. Map the engine methods into `ClonedWalletEngineBridge`.
5. Inject the concrete adapter through `NomadAdaptersProvider`.
6. Run:

```bash
npm install
npm run audit:nomad
cd mobile
npm run typecheck
npx expo start
```

7. Remove or block all local/demo wallet paths before production.

## Current limitation

This repository now has the Phase 2 adapter shape and template, but the real wallet engine is not connected yet. Production wallet custody remains incomplete until a secure wallet engine replaces the local demo wallet service.
