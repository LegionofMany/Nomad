# Audit Backwards: v5 -> v6

## v5 audit result

v5 successfully added the production workflow layer:

- BullMQ / Redis queue.
- API + worker separation.
- Audit status and report endpoints.
- Persistent JSON report storage.
- JSONL audit logging.
- Admin recent-scan summary.
- Frontend polling and operator panel.

## Remaining v5 weakness found before moving forward

v5 detected wallet requests and decoded dangerous calldata, but it did not yet enrich or simulate the transaction against a real chain state.

That meant v5 could say:

- A wallet requested `eth_sendTransaction`.
- The calldata looked like `approve`, `setApprovalForAll`, `permit`, or `transferFrom`.
- A typed-data signature contained permit/approval language.

But v5 could not yet answer:

- Which chain is involved?
- Is an RPC configured for read-only simulation?
- Would `eth_call` evaluate or revert?
- What token contract is the approval targeting?
- What is the spender/operator?
- What is the current allowance or NFT operator approval state?

## v6 forward update

v6 adds chain-aware read-only enrichment and simulation:

- Multi-chain registry.
- Safe RPC URL validation.
- Optional read-only `eth_call` simulation.
- Optional `eth_estimateGas` check.
- ERC20 token metadata lookup.
- ERC20 allowance lookup.
- NFT `isApprovedForAll` lookup.
- Permit/Permit2 typed-data risk summary.
- Chain simulation findings added to risk scoring.
- Frontend report display for chain simulation.
- New fake max approval QA fixture.

## Production note

Chain simulation is disabled by default. Enable only after configuring trusted RPC endpoints:

```env
ENABLE_CHAIN_SIMULATION=true
ETHEREUM_RPC_URL=https://your-trusted-rpc
```

The simulation remains read-only. It does not sign or broadcast transactions.
