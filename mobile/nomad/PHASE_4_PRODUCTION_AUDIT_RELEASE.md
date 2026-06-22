# Phase 4 Production Audit and Release Plan

Phase 4 is the final release gate for Nomad. It must only begin after the selected base wallet engine is integrated, the live Nomad services are connected behind adapters, and Phase 2D local compile/audit checks are passing.

Nomad must not be treated as production-ready until every Phase 4 gate is passed and signed off by the development/security team.

## Phase 4 goal

Prepare the complete Nomad mobile app for real users by validating custody, signing, broadcast, recovery, privacy, device behavior, legal readiness, app-store readiness, and operational support.

## Required starting condition

Before Phase 4 starts, the repository should have:

- Phase 1 overlay foundation completed.
- Phase 2A adapter contracts hardened.
- Phase 2B cloned-wallet bridge scaffold completed.
- Phase 2C screen readiness audit completed.
- Phase 2D local compile/audit pass completed.
- Phase 2E selected wallet engine integrated through concrete adapters.
- Phase 3 live services implemented behind adapters.
- All demo-only wallet paths removed or isolated from production builds.

## Gate 1: Build and type safety audit

Run and pass:

```bash
npm install
npm run typecheck
npm run mobile:typecheck
npm run audit:nomad
cd mobile
npm install
npm run typecheck
npx expo start
```

Acceptance criteria:

- No TypeScript errors.
- No unresolved imports.
- No route registration errors.
- Expo launches successfully.
- All 26 Nomad screens open without runtime crashes.
- GitHub Actions checks are green.

## Gate 2: Wallet custody audit

The selected base wallet engine must be reviewed for:

- Secure wallet creation.
- Secure wallet import.
- Secure seed/private-key storage.
- No raw seed/private key values in React component state.
- No raw seed/private key values in logs.
- No raw seed/private key values in AsyncStorage/plaintext storage.
- Correct session lock behavior.
- Correct unlock behavior.
- Correct backup/recovery wording.
- Correct behavior after app restart.

Acceptance criteria:

- Nomad screens never directly store or derive secrets.
- All custody operations remain inside the wallet engine.
- Demo fallback seed paths are removed from production builds.

## Gate 3: Signing and broadcast audit

Review Send, Swap, POS Approval, Travel Pocket top-up, and any future payment paths.

Acceptance criteria:

- User approval is required before signing.
- Drafts are clearly shown before execution.
- Signing happens only inside the selected wallet engine.
- Broadcasting happens only through approved engine/provider paths.
- Failed signing, rejected signing, missing provider, unsupported chain, expired session, and insufficient funds states are handled.
- Transaction history is indexed from the wallet engine or trusted provider layer, not guessed by the UI.

## Gate 4: Receive address and QR audit

Acceptance criteria:

- Receive addresses come from the selected wallet engine.
- QR values match the selected asset and chain.
- Unsupported asset/chain states are handled.
- Address copy/share actions are tested.
- No placeholder address values remain in production.

## Gate 5: Recovery and Owner Authority audit

Review Time Sets, Recovery Center, Lost Wallet Recovery, Verify Recovery Sequence, Wallet Recovered, Owner Authority Approval, and Create Owner Authority.

Acceptance criteria:

- Recovery language does not promise impossible fund recovery.
- Recovery cannot bypass wallet-engine custody rules.
- Owner Authority approvals are authenticated.
- Abuse cases are documented.
- Rate limiting and replay protections are planned or implemented.
- HH:MM:SS Time Set behavior is reconciled with the wallet/recovery backend.

## Gate 6: Emergency Freeze and security audit

Review Security Center, Emergency Freeze, Nomad Watch emergency actions, and backend enforcement.

Acceptance criteria:

- Freeze is enforced by wallet/backend policy, not only local UI state.
- Pause spending is enforced by the payment/action layer.
- Emergency actions require appropriate authentication.
- False positive/false lockout recovery path is documented.
- Freeze events are auditable.

## Gate 7: BlockPages privacy and scanner audit

Review BlockPages Safety, URL Scanner, Address Safety Detail, and any live BlockPages APIs.

Acceptance criteria:

- URL/address scanner requests minimize personal data.
- Scanner responses are explainable to users.
- Risk labels have clear meanings.
- False positive and reporting workflows exist.
- Privacy policy covers scanner behavior.
- No sensitive wallet data is sent unless explicitly required and approved.

## Gate 8: Travel Pocket and POS audit

Review Travel Mode, Top Up Travel Pocket, POS Approval, stable-value rails, and regional behavior.

Acceptance criteria:

- Travel Pocket balance comes from real wallet/service state.
- Funding actions require user approval.
- POS approval has clear merchant, amount, currency, and risk data.
- Regional currency conversion and fees are visible.
- Offline/declined/expired requests are handled.

## Gate 9: Nomad Watch and device audit

Review Nomad Watch connected-device behavior.

Acceptance criteria:

- Device pairing is authenticated.
- Device sync is encrypted or otherwise secured by the selected device service.
- Emergency actions from the watch are confirmed and auditable.
- Lost/stolen watch behavior is documented.
- Battery, firmware, sync, and device session states are real or clearly disabled.

## Gate 10: Mobile QA and route smoke test

Manual smoke test required for all 26 screens:

1. Portfolio
2. Wallets
3. Send Bitcoin
4. Receive Bitcoin
5. Swap
6. Travel Mode / Travel Pocket
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

Acceptance criteria:

- Every screen opens.
- Every primary CTA routes correctly.
- Loading, error, empty, locked, and offline states are acceptable.
- No screen exposes secrets.
- No screen implies live behavior when only demo/local behavior exists.

## Gate 11: Legal, compliance, and support readiness

Before release, the project needs:

- Privacy policy.
- Terms of service.
- Support contact/process.
- Wallet risk disclosure.
- Recovery limitation disclosure.
- Regional availability statement.
- App-store metadata.
- Security reporting process.

## Gate 12: Testnet and release rollout

Recommended rollout:

1. Internal local build.
2. Internal TestFlight / Android internal testing.
3. Closed beta with testnet only.
4. Limited production pilot.
5. Public launch only after final security signoff.

Acceptance criteria:

- Crash reporting is active.
- Error reporting is active.
- Rollback plan exists.
- Release checklist is signed by development/security leads.

## Final release signoff

Nomad can only be marked production-ready when:

- Phase 2E wallet engine integration is complete.
- Phase 3 live services are complete or disabled behind clear production flags.
- All Phase 4 gates pass.
- Demo-only paths are removed from production.
- Security review is complete.
- Legal/support/release assets are complete.

## Handoff note

This file is a production release plan. It does not make the current repository production-ready by itself. It gives the developer the final gate checklist needed to complete the full Nomad build safely.