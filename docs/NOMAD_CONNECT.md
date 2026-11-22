# Nomad Connect v1 (testnet)

How Zonycs, Reqrium, Syaxio and Guardian Trader talk to Nomad. Nomad holds the keys.
The apps only ask. The owner approves each ask on the phone.

Code: `src/connect/`. Tests: `src/connect/__tests__/connect.test.ts`.

## The four requests

| kind     | what the app gets                                              | what Nomad checks                                  |
|----------|----------------------------------------------------------------|----------------------------------------------------|
| `signin` | a signed message proving control of the wallet address         | owner taps approve                                 |
| `pay`    | a transaction hash                                             | engine approval screen (amount, destination, fee)  |
| `prove`  | a Reqrium-signed claim plus a wallet signature bound to the app| owner taps approve; no documents leave Nomad       |
| `read`   | public addresses only                                          | owner taps approve                                 |

## Rules Nomad enforces

1. The app id must be in the registry (`registry.ts`) and the request must come from that app's exact origin.
2. Each app may only make the kinds of request listed for it.
3. A request lives at most 10 minutes and its `id` can be used once.
4. Nothing is signed until the owner approves.
5. The answer goes only to the registered origin and callback path, never an address taken from the request.
6. `https` only, except `localhost` for development.

## Request shape (JSON)

```json
{
  "v": 1,
  "id": "random 16-128 chars",
  "nonce": "random 16-128 chars, issued and remembered by the app server",
  "kind": "signin",
  "app": { "id": "zonycs", "origin": "https://zonycs.example" },
  "issuedAt": "2026-11-22T10:00:00.000Z",
  "expiresAt": "2026-11-22T10:05:00.000Z"
}
```

Send it to the phone as `nomad://connect?r=<base64url of the JSON>` (link or QR code).
Use `encodeConnectLink` from `src/connect`.

## For the Zonycs (Express) backend

1. Create `id` and `nonce`, store the nonce against the user's session.
2. When the answer arrives at `/nomad/callback#r=...`, the page posts it to your server.
3. Verify with the shared code:

```ts
import { verifySignIn } from "<nomad>/src/connect";
const ok = verifySignIn(res.message, res.signature, res.address)
  && res.nonce === storedNonce
  && res.message.includes(`Nonce: ${storedNonce}`);
```

4. The wallet address is now the user's identity. No password is stored.

## For Reqrium (Next.js)

Reqrium keeps its documents. Nomad never receives them.

1. After you verify a person, build an attestation:
   `{ v:1, issuer:"reqrium", subject:<wallet address>, claim:"verified_person"|"verified_business", issuedAt, expiresAt }`
2. Sign `buildAttestationMessage(attestation)` with the Reqrium signing key (EIP-191 `signMessage`).
3. Give the user `{ attestation, signature }`. Nomad stores it (`addAttestation`).
4. Put the key's address in the registry under `issuers`. Keep the key in a secrets manager, never in the repo.
5. Other apps check a presentation with `verifyPresentation(...)`, which proves the claim is real, current,
   belongs to this wallet, and was shown to THIS app for THIS request.

## Before any release

- Replace the localhost origins in `registry.ts` with the real https origins.
- Add Reqrium's production signing address.
- Add the Syaxio read-only scope for business history (not built yet).
- Spending limits and spouse co-approval for `pay` (Travel Pocket) are not built yet.
- Real funds stay off until recovery is built and the code has an independent security review.
