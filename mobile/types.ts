export type Balance = {
  symbol: string;
  amount: number;
  fiatApproxUSD: number;
};

export type ClockTime = {
  hour: number; // 0-23 device-local hour
  minute: number; // 0-59
};

export type WalletStatus = "no_wallet" | "locked" | "unlocked" | "recovery";

export type Portfolio = {
  evmAddress: string;
  balances: Balance[];
};
