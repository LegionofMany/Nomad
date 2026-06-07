# Simple Nomad Webflow

Nomad should feel simple to the user, even though the wallet has strong safety boundaries underneath.

## Main user flow

```txt
1. Open Nomad
2. Enter time clock authority
3. Travel Mode detects or uses selected region
4. Nomad selects the regional stablecoin
5. User taps NFC at POS
6. POS creates payment request
7. Nomad shows clear review
8. User approves with time clock authority
9. Travel Pocket pays within limits
10. Receipt / result is shown
```

## What the user sees

The user should not see complex protocol language during payment.

They should see:

```txt
Where am I paying?
How much?
Which regional stablecoin?
Which Travel Pocket?
What is the daily/trip limit?
Approve or deny?
```

## Core screens

### 1. Open Door

Purpose: prevent theft.

```txt
Enter your Nomad time clock to open your wallet.
```

### 2. Travel Mode

Purpose: prepare spending while abroad.

```txt
Travel region: auto-detected or selected
Stablecoin: automatically matched to region
Travel Pocket: capped balance only
NFC: off unless enabled
```

### 3. POS Request

Purpose: show what the merchant is asking for.

```txt
Merchant
Location
Amount
Regional stablecoin
Network or rail
```

### 4. Review

Purpose: make the request understandable.

```txt
This is a request, not approval.
Review before continuing.
```

### 5. Time Clock Approval

Purpose: owner proves authority.

```txt
Use your Nomad time clock to approve this payment.
```

### 6. Result

Purpose: show what happened.

```txt
Approved / Denied
Travel Pocket remaining
Daily limit remaining
Receipt reference
```

## Regional stablecoin behavior

Nomad is regional by design.

```txt
Location / selected region
   ↓
RegionalStableAssetResolver
   ↓
Preferred stablecoin
   ↓
Travel Pocket payment review
```

Examples:

```txt
Canada -> CADC
United States -> USDC
United Kingdom -> GBPT
Eurozone -> EUROC
Australia -> AUDD
UAE -> AED_STABLE
Japan -> JPYC
Singapore -> XSGD
Fallback -> USDC
```

## Theft prevention

The time clock is required because possession of the phone is not enough.

Nomad protects against:

```txt
Stolen phone
Accidental NFC tap
Rogue POS terminal
Background request
Social engineering
```

## Simple product rule

```txt
NFC can request.
Only the owner can approve.
Travel Pocket limits the damage.
Home wallet stays protected.
```
