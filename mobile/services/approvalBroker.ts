/**
 * approvalBroker.ts
 *
 * Connects the wallet engine's ApprovalGate to the on-screen approval dialog.
 * It FAILS CLOSED: if no dialog is mounted, or another approval is already
 * open, the request is declined and nothing is signed.
 */

import type { ApprovalGate, TransactionReview } from "../../src/engine/types";

export interface PendingApproval {
  review: TransactionReview;
  resolve: (approved: boolean) => void;
}

type Listener = (pending: PendingApproval | null) => void;

let listener: Listener | null = null;
let current: PendingApproval | null = null;

export const approvalGate: ApprovalGate = {
  requestApproval(review) {
    return new Promise<boolean>((resolve) => {
      if (!listener || current) {
        resolve(false);
        return;
      }
      const pending: PendingApproval = {
        review,
        resolve: (approved) => {
          if (current !== pending) return;
          current = null;
          listener?.(null);
          resolve(approved === true);
        },
      };
      current = pending;
      listener(pending);
    });
  },
};

/** The dialog calls this on mount. Unmounting declines any open request. */
export function subscribeApprovals(next: Listener): () => void {
  listener = next;
  return () => {
    if (listener === next) {
      const open = current;
      listener = null;
      open?.resolve(false);
    }
  };
}
