export type Balance = {
  symbol: string;
  amount: number;
  fiatApproxUSD: number;
};

export type ClockTime = {
  hour: number; // 1–12
  minute: number; // multiples of 5
};

export type WalletStatus = "no_wallet" | "locked" | "unlocked" | "recovery";

export type Portfolio = {
  evmAddress: string;
  balances: Balance[];
};
