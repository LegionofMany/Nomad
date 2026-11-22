/**
 * connectBroker.ts
 *
 * Connects Nomad Connect's approval gate to an on-screen dialog. Like the
 * transaction approval broker it FAILS CLOSED: if no dialog is mounted, or
 * another dialog is already open, the request is declined and nothing is signed.
 */

import type { ConnectApprovalGate, ConnectReview } from "../../src/connect";

export type ConnectUiState =
  | { type: "approval"; review: ConnectReview; resolve: (approved: boolean) => void }
  | { type: "notice"; title: string; message: string; close: () => void };

type Listener = (state: ConnectUiState | null) => void;

let listener: Listener | null = null;
let current: ConnectUiState | null = null;

export const connectGate: ConnectApprovalGate = {
  request(review) {
    return new Promise<boolean>((resolve) => {
      if (!listener || current) {
        resolve(false);
        return;
      }
      const state: ConnectUiState = {
        type: "approval",
        review,
        resolve: (approved) => {
          if (current !== state) return;
          current = null;
          listener?.(null);
          resolve(approved === true);
        },
      };
      current = state;
      listener(state);
    });
  },
};

/** Tells the owner how a request ended. Dropped if another dialog is already open. */
export function showConnectNotice(title: string, message: string): void {
  if (!listener || current) return;
  const state: ConnectUiState = {
    type: "notice",
    title,
    message,
    close: () => {
      if (current !== state) return;
      current = null;
      listener?.(null);
    },
  };
  current = state;
  listener(state);
}

/** The dialog calls this on mount. Unmounting declines any open approval. */
export function subscribeConnect(next: Listener): () => void {
  listener = next;
  return () => {
    if (listener === next) {
      const open = current;
      listener = null;
      current = null;
      if (open?.type === "approval") open.resolve(false);
    }
  };
}
