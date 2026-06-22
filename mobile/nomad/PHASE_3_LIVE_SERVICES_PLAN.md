# Phase 3 Live Nomad Services Plan

Phase 3 turns the Nomad overlay from local/demo state into live service-backed experiences.

This phase should begin only after Phase 2D local audit is passing and the Phase 2E wallet-engine integration path is selected. Some Phase 3 service contracts can be prepared before the final wallet engine is fully wired, but production activation depends on the wallet engine enforcing custody, signing, session, and policy rules.

## Phase 3 goal

Nomad becomes a live protection, travel, recovery, watch, and protocol overlay.

The selected wallet engine still owns custody, accounts, signing, transaction broadcast, chain providers, balances, and canonical transaction history.

Nomad owns live service orchestration, user warnings, approvals, policy requests, routing, and human-readable protection UX.

```txt
Wallet engine / backend services
        ↓
Concrete Nomad service adapters
        ↓
NomadAdaptersProvider
        ↓
Nomad hooks
        ↓
26 Nomad screens
```

## Phase 3A: BlockPages live safety services

### Screens affected

- `BlockPagesSafetyScreen`
- `BlockPagesURLScannerScreen`
- `AddressSafetyDetailScreen`
- `SecurityCenterScreen`

### Required service work

- Connect live URL scanning endpoint.
- Connect live address/wallet risk scoring endpoint.
- Return normalized risk levels: `safe`, `watch`, `danger`, `unknown`.
- Add source labels for detected risks: phishing, drainer, impersonation, mixer/tumbler exposure, scam report, contract exploit, malicious approval, spoofed domain.
- Add privacy rules so scans do not leak unnecessary wallet identity.
- Add request timeout, retry, and offline behavior.

### Acceptance checks

- URL scanner shows live result or clear offline/error state.
- Address scanner shows live result or clear offline/error state.
- Safety Center reflects live safety state instead of local-only demo values.
- No private keys, seed phrases, or signing payloads are sent to BlockPages services.

## Phase 3B: Travel Pocket live funding and regional spending

### Screens affected

- `TravelModeScreen`
- `TopUpTravelPocketScreen`
- `PortfolioScreen`
- `SettingsScreen`
- `NomadWatchScreen`

### Required service work

- Connect real Travel Pocket balance source.
- Connect region/currency detection or user-selected region.
- Connect funding route through wallet engine draft/sign/broadcast flow.
- Connect spending limits and pause-spending policy.
- Connect local stable-value rail metadata where supported.
- Add clear unsupported-region state.

### Acceptance checks

- Travel Pocket balance comes from live wallet/service data.
- Top-up creates a wallet-engine-approved transaction flow, not local-only demo state.
- Regional spending rules are visible and enforceable.
- Unsupported countries or rails show clear messaging.

## Phase 3C: POS approval and payment-action handoff

### Screens affected

- `ApprovePOSTransactionScreen`
- `NomadWatchScreen`
- `SecurityCenterScreen`

### Required service work

- Connect POS request ingestion service.
- Validate merchant, amount, currency, region, and device/session context.
- Hand approved payments to the wallet engine for user approval/signing.
- Add rejection, expiration, suspicious merchant, and offline states.
- Add optional Nomad Watch approval sync.

### Acceptance checks

- POS approvals expire safely.
- No payment signs without final wallet-engine approval.
- Suspicious merchant warnings block or require stronger confirmation.
- Watch approval cannot bypass wallet/session policy.

## Phase 3D: Emergency Freeze and pause-spending enforcement

### Screens affected

- `EmergencyFreezeScreen`
- `SecurityCenterScreen`
- `NomadWatchScreen`
- `SettingsScreen`

### Required service work

- Connect freeze requests to wallet/backend policy enforcement.
- Support scoped freeze states: all, travel pocket, cards/POS, swaps, sends.
- Add owner-authority notification path when freeze activates.
- Add unfreeze policy with authentication and optional delay.
- Log freeze actions for audit trail.

### Acceptance checks

- Freeze status is enforced below the UI layer.
- Sends, swaps, POS, and Travel Pocket actions respect freeze scope.
- Emergency actions are logged.
- A compromised UI alone cannot silently unfreeze funds.

## Phase 3E: Owner Authority and recovery backend

### Screens affected

- `RecoveryCenterScreen`
- `TimeClockAccessScreen`
- `UnlockWalletScreen`
- `RecoverLostWalletScreen`
- `VerifyRecoverySequenceScreen`
- `WalletRecoveredScreen`
- `OwnerAuthorityApprovalScreen`
- `CreateOwnerAuthorityScreen`

### Required service work

- Connect Owner Authority creation to real backend/contact/device channel.
- Connect approval request notifications.
- Add approval, rejection, expiration, and revoked states.
- Connect recovery sequence validation to real recovery policy.
- Add rate limits, anti-abuse checks, and audit logs.
- Reconcile Time Set model with full HH:MM:SS product behavior if required.

### Acceptance checks

- Recovery screens never imply funds are recoverable without the actual wallet policy.
- Owner Authority approvals expire and can be revoked.
- Recovery attempts are rate-limited and logged.
- Locked wallet behavior remains enforced by wallet engine/session policy.

## Phase 3F: Nomad Watch live device sync

### Screens affected

- `NomadWatchScreen`
- `ApprovePOSTransactionScreen`
- `EmergencyFreezeScreen`
- `TravelModeScreen`
- `SecurityCenterScreen`

### Required service work

- Connect live device pairing state.
- Connect battery, firmware, last sync, and connection status.
- Connect watch action bridge for emergency lock, pause spending, owner alert, and panic mode.
- Add lost device, revoked device, and stale sync states.
- Add device-level authorization checks.

### Acceptance checks

- Watch actions cannot bypass wallet engine policy.
- Lost/revoked devices cannot approve payments.
- Stale watch sync is visible.
- Emergency watch actions are reflected in Security Center and Emergency Freeze.

## Phase 3G: Voltaire Protocols live status

### Screens affected

- `VoltaireProtocolsScreen`
- `PortfolioScreen`
- `SettingsScreen`

### Required service work

- Connect live service status for Voltaire ecosystem modules.
- Add navigation metadata for active projects.
- Add uptime, node/service, region, and incident states.
- Add fallback status when service endpoint is unavailable.

### Acceptance checks

- Protocol status is not hardcoded.
- Offline/maintenance states are clear.
- External links/routes are validated before opening.

## Phase 3H: Swap quote provider and execution handoff

### Screens affected

- `SwapScreen`
- `PortfolioScreen`
- `SecurityCenterScreen`

### Required service work

- Connect live quote provider.
- Return quote expiry, route, price impact, minimum received, provider name, and fees.
- Hand accepted swaps to wallet engine for final approval/signing/broadcast.
- Respect freeze/security policy before execution.
- Add quote expired, insufficient balance, unsupported pair, and provider unavailable states.

### Acceptance checks

- Swap quote is live or clearly unavailable.
- No swap broadcasts without wallet-engine approval.
- Price impact and fees are visible.
- Freeze and security warnings can block risky swaps.

## Phase 3I: Service observability and audit trail

### Required service work

- Add service error taxonomy.
- Add non-sensitive audit logging.
- Add request IDs for support/debugging.
- Add privacy rules for user/wallet data.
- Add environment separation: local, staging, production.

### Acceptance checks

- Errors are actionable for support.
- Logs do not expose private keys, seed phrases, raw recovery secrets, or unnecessary wallet identity.
- Production services are clearly separated from local/staging.

## Phase 3 completion criteria

Phase 3 is complete only when:

- BlockPages scanning is live or connected to a staging service with production-shaped responses.
- Travel Pocket uses live wallet/service data.
- POS approval uses real request ingestion and wallet-engine approval handoff.
- Emergency Freeze is enforced below the UI layer.
- Owner Authority and recovery are backed by real policy services.
- Nomad Watch has real device/session state or a production-shaped device service stub.
- Voltaire Protocols status is service-backed.
- Swap quote and execution handoff are service-backed.
- All service errors have loading, empty, offline, and failure states.
- No Nomad service receives private keys or seed phrases.

## Developer note

Phase 3 should be implemented behind adapters first. Do not wire screens directly to raw service clients. Keep this path:

```txt
Service client
    → concrete adapter
    → NomadAdaptersProvider
    → hook
    → screen
```

That keeps the overlay replaceable, testable, and safe for the final production audit.
