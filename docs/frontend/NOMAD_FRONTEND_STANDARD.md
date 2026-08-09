# Nomad Frontend Standard

This document protects the approved Nomad Wallet direction from future visual regressions. It applies to the complete 28-route Nomad interface and the 18 approved product renders that define the core experience.

## Product identity

- Product: Nomad Wallet.
- Foundation: Voltaire Protocols.
- Wider product hub: Arkrilium Labs ecosystem.
- Safety product: Reqrium. Do not show the retired BlockPages411 name in user-facing copy.
- Release posture: closed beta and test mode. Real-funds readiness must never be inferred from visual polish.

## Locked visual direction

- Deep black/navy base rather than a flat black page.
- Neon blue is the primary navigation and wallet color.
- Green is controlled and reserved for secure, active, and positive states.
- Purple identifies ecosystem and protocol surfaces.
- Gold/yellow signals review or limited availability; red signals danger or frozen state.
- Rounded glass panels use thin luminous borders, restrained glow, and clear spacing.
- Use purpose-built SVG/vector icons. Do not ship placeholder letters, unrelated Unicode symbols, or emoji as primary navigation artwork.
- Keep type compact, readable, and hierarchical. Large display figures must shrink safely on phone widths.

## Responsive shell

### Desktop and tablet web

- Use the persistent Nomad sidebar supplied by `mobile/ui/NomadShell.tsx`.
- Keep page content in a centered, bounded reading column.
- Do not stretch a phone scaffold to the browser width.
- The active section must remain visible in navigation.
- Hide the duplicate mobile bottom navigation on desktop.

### Mobile and native

- Preserve the approved card-stack composition.
- Keep the primary bottom navigation unobstructed and sticky in the web preview.
- Respect safe areas and prevent content from sitting behind navigation.
- Horizontal asset and ecosystem rails may scroll; core forms and security actions may not require horizontal scrolling.

## Core navigation

Primary destinations are Home, Wallets, Travel, Security, Recovery, Insights, Reqrium, Nomad Watch, and Settings. Web routes must remain stable through the linking map in `mobile/App.tsx`.

## Home / Portfolio requirements

- Nomad shield and wordmark.
- `Built on Voltaire Protocols` foundation label.
- Honest system-status pill driven by actual local state.
- Portfolio value, privacy toggle, 24-hour movement, compact chart, and BTC/HBAR/XRP/XLM asset rail.
- Send, Receive, Swap, and Travel actions.
- Travel Pocket limits and expiry controls.
- Security Center status summary.
- Arkrilium Labs ecosystem entry points, including Reqrium.

## Safety and interaction rules

- Web preview may open on Portfolio, while native wallet-status gating remains enforced.
- No visual control may bypass owner confirmation.
- NFC or QR may request payment but may not approve it.
- Preview balances and local-only checks must be identified honestly.
- Disabled, unavailable, limited, warning, and frozen states must remain visibly distinct.
- Every interactive control needs a meaningful accessibility label.

## Acceptance checks

Before a frontend change reaches `main`:

1. Root TypeScript audit passes.
2. Mobile TypeScript audit passes.
3. Security tests pass.
4. Expo web export completes.
5. Portfolio, Wallets, Travel, Security, Recovery, Reqrium, Watch, and Settings routes are checked at phone and desktop widths.
6. No retired user-facing brand name appears.
7. No content is clipped, covered by navigation, or wider than the viewport.
8. Existing wallet, recovery, freeze, and owner-authority boundaries remain intact.

