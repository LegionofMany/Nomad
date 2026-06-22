# Nomad Overlay Layer Guardrails

Nomad is a branded overlay layer that sits on top of a cloned wallet core. The cloned wallet should own wallet engine responsibilities. Nomad should own the experience, security workflows, travel workflows, BlockPages safety, Voltaire ecosystem, recovery, insights, and watch interfaces.

## Core architecture rule

Do not turn Nomad into the base wallet engine.

The base cloned wallet should handle:

- seed and key management
- wallet creation and import
- signing
- chain/RPC connections
- balances
- send and receive primitives
- swap/liquidity primitives
- transaction history
- wallet lock and unlock primitives

The Nomad overlay should handle:

- branded Nomad dashboard and navigation
- Travel Pocket experience
- Time Sets and recovery UX
- Owner Authority workflows
- Emergency Freeze workflows
- BlockPages safety checks and scanner UX
- Voltaire Protocols hub
- Insights and spending dashboards
- Nomad Watch controls
- POS approval flow
- security-centered wallet experience

## Design parameters

Keep every page inside the approved Nomad concept:

- dark Web3 wallet interface
- neon green and blue accents
- secure, non-custodial feel
- Voltaire Protocols foundation
- BlockPages protection layer
- travel-ready global wallet experience
- security-first recovery and authority workflows
- mobile-first card-based layout

## 26-page concept map

Each page has a purpose and should not be removed or flattened without approval.

1. Portfolio / Home: main Nomad wallet overview and command surface.
2. Wallets: asset inventory and custom asset management.
3. Send Bitcoin: outgoing transaction flow.
4. Receive Bitcoin: receiving address and QR flow.
5. Swap: asset conversion layer.
6. Travel Pocket: regional stable-value travel spending layer.
7. Security Center: protection overview and security modules.
8. Settings: user preferences and account controls.
9. Nomad Insights Overview: asset, spending, and freedom score analytics.
10. Nomad Insights Spending: category spending and budget analytics.
11. Recovery Center: recovery status and protection command center.
12. Voltaire Protocols Hub: protocol architecture and ecosystem status.
13. BlockPages Safety: identity, wallet, and web protection dashboard.
14. Time Clock Access: locked wallet time-cycle access screen.
15. Unlock Wallet: completion of time-set unlock flow.
16. Recover Lost Wallet: 24 Time Sets recovery input flow.
17. Verify Recovery Sequence: verification of recovery time sequence.
18. Wallet Recovered: successful wallet restoration confirmation.
19. Owner Authority Approval: approval wait-state for authority-based recovery.
20. Address Safety Detail: BlockPages address safety results.
21. Top Up Travel Pocket: travel pocket funding asset selection.
22. Approve POS Transaction: tap-to-pay approval flow.
23. Create Owner Authority: authority setup and permission concept.
24. BlockPages URL Scanner: phishing/drainer URL risk scanner.
25. Emergency Freeze: urgent wallet/travel/asset freeze controls.
26. Nomad Watch: wearable device control and emergency actions.

## Audit protocol before every push

Before changing files:

1. Read the target file or route being changed.
2. Check whether the route already exists in `mobile/nomad/routes/nomadRoutes.ts`.
3. Confirm the change keeps the Nomad overlay separate from the cloned wallet engine.
4. Confirm the change does not delete or weaken the concept of any of the 26 pages.
5. Prefer additive/shared-component changes before large rewrites.

After changing files:

1. Confirm the changed route is still registered if it is a screen.
2. Confirm barrel exports are intact if adding shared files.
3. Confirm the app still mounts through the overlay route registry.
4. Report exactly what changed and what still needs local compile/runtime testing.

## Component migration rule

When replacing repeated UI with shared components, preserve the meaning of the page first. Shared components should reduce duplicate code without erasing page-specific purpose, labels, warnings, workflows, or calls to action.

## Adapter rule

All future integration with the cloned wallet should happen through adapter contracts, not by hardcoding cloned-wallet internals directly into Nomad screens.

The adapter layer should map cloned wallet capabilities into Nomad concepts such as:

- portfolio assets
- receive addresses
- send transaction review
- swap quote and execution
- lock/unlock state
- travel pocket balances
- BlockPages scan results
- recovery status
- owner authority status
- watch pairing status

## Production readiness note

The current Nomad layer is a visual and interaction overlay. It must not be treated as production wallet security until the cloned wallet core, secure storage, signing flows, backend APIs, BlockPages integrations, and device protections are connected and audited.
