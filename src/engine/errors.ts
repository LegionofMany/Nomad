/**
 * engine/errors.ts
 *
 * Typed failures for the Nomad wallet engine. Codes match
 * `NomadAdapterFailureCode` in mobile/nomad/adapters/walletAdapter.ts so the
 * overlay can show a clear, recoverable message.
 */

export type EngineFailureCode =
  | "unsupported_chain"
  | "wallet_locked"
  | "expired_session"
  | "missing_provider"
  | "rejected_signing"
  | "broadcast_failed"
  | "not_implemented"
  | "invalid_request";

export class NomadEngineError extends Error {
  readonly code: EngineFailureCode;
  readonly recoverable: boolean;

  constructor(code: EngineFailureCode, message: string, recoverable = false) {
    super(message);
    this.name = "NomadEngineError";
    this.code = code;
    this.recoverable = recoverable;
  }
}

export const invalid = (message: string) => new NomadEngineError("invalid_request", message, true);
export const locked = () => new NomadEngineError("wallet_locked", "The wallet is locked. Unlock it first.", true);
export const noProvider = (what: string) =>
  new NomadEngineError("missing_provider", `No ${what} provider is connected to the wallet engine.`, true);

export function toFailure(error: unknown): { code: EngineFailureCode; message: string; recoverable: boolean } {
  if (error instanceof NomadEngineError) {
    return { code: error.code, message: error.message, recoverable: error.recoverable };
  }
  return { code: "broadcast_failed", message: error instanceof Error ? error.message : "Unknown engine failure", recoverable: false };
}
