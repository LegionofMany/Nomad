# Nomad Environment Setup

This file gives the developer a clean setup path for validating the Nomad handoff build.

## Repository

Repository: `LegionofMany/Nomad`

Primary handoff files:

- `NOMAD_FINAL_HANDOFF_PACKAGE.md`
- `DEV_HANDOFF.md`
- `NOMAD_DEVELOPER_EXECUTION_CHECKLIST.md`
- `PRODUCTION_BLOCKERS.md`
- `NOMAD_PHASE_ROADMAP.md`
- `mobile/nomad/PHASE_2D_LOCAL_AUDIT_CHECKLIST.md`
- `mobile/nomad/PHASE_2E_BASE_ENGINE_SELECTION.md`
- `mobile/nomad/PHASE_3_LIVE_SERVICES_PLAN.md`
- `mobile/nomad/PHASE_4_PRODUCTION_AUDIT_RELEASE.md`

## Prerequisites

The developer should have:

- Node.js LTS.
- npm.
- Git.
- Expo tooling as required by the mobile package.
- iOS Simulator or Android Emulator, or a physical test device.
- GitHub access to the private repository.

Use the Node version selected by the dev team for the cloned wallet engine. If the selected base wallet requires a specific Node version, align the repo before integration.

## Fresh Clone

```bash
git clone git@github.com:LegionofMany/Nomad.git
cd Nomad
```

If using HTTPS instead of SSH:

```bash
git clone https://github.com/LegionofMany/Nomad.git
cd Nomad
```

## Root Install

```bash
npm install
```

## Mobile Install

```bash
cd mobile
npm install
```

Return to root when needed:

```bash
cd ..
```

## Root TypeScript Check

From the repo root:

```bash
npm run typecheck
```

## Mobile TypeScript Check

From the repo root:

```bash
npm run mobile:typecheck
```

Or from `mobile`:

```bash
cd mobile
npm run typecheck
```

## Full Nomad Audit Command

From the repo root:

```bash
npm run audit:nomad
```

This is expected to run the root and mobile TypeScript checks.

## Expo Start

From `mobile`:

```bash
cd mobile
npm run start
```

Then open in the selected simulator, emulator, or physical device.

## 26-Screen Smoke Test

After Expo starts, the developer should confirm that each Nomad screen renders and routes correctly:

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

## Expected Result for Handoff Acceptance

The handoff build is accepted for developer integration when:

- `npm install` succeeds at root.
- `npm install` succeeds in `mobile`.
- `npm run audit:nomad` completes or errors are captured in an issue.
- Expo starts or startup errors are captured in an issue.
- All 26 screens are reviewed.
- Any compile/runtime issues are filed under the Phase 2D GitHub issue.

## Error Report Template

When an error appears, create or update the Phase 2D issue with:

```txt
Command:
Directory:
Node version:
npm version:
Platform:
Full error:
First file referenced:
Likely owner: root / mobile / adapter / screen / dependency / Expo
Blocking severity: low / medium / high / release-blocking
```

## Important Boundary During Setup

Do not solve setup issues by moving wallet secrets, signing logic, or custody into Nomad screens.

Nomad screens should remain presentation and workflow layers. Wallet-engine behavior must stay behind adapters.
