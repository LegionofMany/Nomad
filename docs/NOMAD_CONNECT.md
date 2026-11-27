# Nomad Connect v1 (testnet)

How Zonycs, Reqrium, Syaxio and Guardian Trader talk to Nomad. Nomad holds the keys.
The apps only ask. The owner approves each ask on the phone.

Code: `src/connect/`. Tests: `src/connect/__tests__/connect.test.ts`.

## The five requests

| kind     | what the app gets                                              | what Nomad checks                                  |
|----------|----------------------------------------------------------------|----------------------------------------------------|
| `signin` | a signed message proving control of the wallet address         | owner taps approve                                 |
| `pay`    | a transaction hash                                             | engine approval screen (amount, destination, fee)  |
| `prove`  | a Reqrium-signed claim plus a wallet signature bound to the app| owner taps approve; no documents leave Nomad       |
| `read`   | public addresses only                                          | owner taps approve                                 |
| `buy`    | two signatures (acceptance + permit) for one escrowed order    | owner sees the amount; contract and token are pinned |

### `buy` (pay for an escrowed marketplace order)

The app sends only `orderHash`, `amount` (base units), `permitNonce`, `deadline` and `chainId`. Nomad
builds both EIP-712 messages itself, using the escrow contract and token pinned for that app in the
registry (`BuyPolicy`), so a request can never redirect payment. Nomad refuses a wrong chain, an amount
over the app's cap, and a deadline that is past or more than 30 minutes away. Nomad sends nothing to
the network: the app's server relays the signatures (gasless). The money goes into escrow, not to the
seller. The engine will only sign the `BuyerAcceptance` and `Permit` message shapes.

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

## What is already wired (testnet preview)

**Zonycs** (`Seller-Block-marketplace`)
- Backend: `POST /auth/nomad/request` and `POST /auth/nomad/verify` (`backend/src/services/nomadConnect.ts`,
  handlers in `authController.ts`). The one-time request lives in the existing `auth_nonces` table, and a
  successful answer starts the normal cookie session.
- Frontend: "Sign in with Nomad" button on `/sign-in`, answer page at `/sign-in/nomad`.
- The wallet signs the site's origin, taken from `FRONTEND_APP_URL`. That value must be exactly the address the
  phone has registered for Zonycs (`EXPO_PUBLIC_ZONYCS_URL`).

**Reqrium** (`blockpage411`)
- Sign in: `POST /api/nomad/request` and `POST /api/nomad/verify`, answer page at `/nomad/callback`. It starts the same
  `token` / `refresh_token` cookies as the normal wallet login. The site's origin comes from `APP_URL` or `NEXT_PUBLIC_APP_URL`.
- Verified proof: `POST /api/nomad/attestation` (signed-in wallet only, and only if an admin has set that exact wallet's
  `kycStatus` to `verified`). Signs with `REQRIUM_ATTESTATION_PRIVATE_KEY`. "Add my verified proof to Nomad" button on `/kyc-verify`.
- The proof names the signed-in wallet. A person who verified with a different wallet must verify the Nomad wallet itself
  (or a wallet-linking step must be added later).

**Keeping wording in step.** Each project keeps its own copy of the signed text. All three test it against the same literal
("golden") strings. If you change `src/connect/messages.ts`, change the copies in Zonycs and Reqrium too.

**Phone settings** (in `mobile/eas.json`, `preview` env): `EXPO_PUBLIC_ZONYCS_URL`, `EXPO_PUBLIC_REQRIUM_URL`,
`EXPO_PUBLIC_SYAXIO_URL`, `EXPO_PUBLIC_GUARDIAN_TRADER_URL` (each app's exact https address; the phone trusts only that origin)
and `EXPO_PUBLIC_REQRIUM_ISSUER_ADDRESS` (the ADDRESS of Reqrium's attestation key, never the key).

## Before any release

- Replace the localhost origins in `registry.ts` with the real https origins.
- Add Reqrium's production signing address.
- Add the Syaxio read-only scope for business history (not built yet).
- Spending limits and spouse co-approval for `pay` (Travel Pocket) are not built yet.
- Real funds stay off until recovery is built and the code has an independent security review.
