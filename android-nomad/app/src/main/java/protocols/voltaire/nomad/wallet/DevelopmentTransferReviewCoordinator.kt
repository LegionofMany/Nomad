package protocols.voltaire.nomad.wallet

import java.util.UUID

/**
 * Closed-beta transfer review coordinator.
 *
 * This creates human-readable review records and requires owner approval before
 * a request can be marked approved. It does not sign or settle real payments.
 */
class DevelopmentTransferReviewCoordinator : TransferReviewCoordinator {
    private val reviews: MutableMap<String, WalletTransferReview> = mutableMapOf()

    override fun prepareReview(request: WalletTransferRequest): WalletTransferReview {
        val warnings = buildWarnings(request)
        val review = WalletTransferReview(
            reviewId = UUID.randomUUID().toString(),
            request = request,
            estimatedFee = demoFeeFor(request.network),
            warnings = warnings,
            requiresOwnerConfirmation = true
        )
        reviews[review.reviewId] = review
        return review
    }

    override fun approveReviewedTransfer(reviewId: String, ownerApprovalId: String): WalletTransferApprovalResult {
        val review = reviews[reviewId]
            ?: return WalletTransferApprovalResult(
                reviewId = reviewId,
                approved = false,
                message = "Review not found. Nothing was approved."
            )

        if (ownerApprovalId.isBlank()) {
            return WalletTransferApprovalResult(
                reviewId = reviewId,
                approved = false,
                message = "Owner approval is required. Nothing was approved."
            )
        }

        return WalletTransferApprovalResult(
            reviewId = review.reviewId,
            approved = true,
            message = "Closed-beta review approved. No real transaction was signed or settled."
        )
    }

    override fun denyReviewedTransfer(reviewId: String, reason: String): WalletTransferApprovalResult {
        return WalletTransferApprovalResult(
            reviewId = reviewId,
            approved = false,
            message = "Transfer review denied. Reason: ${reason.ifBlank { "not provided" }}"
        )
    }

    private fun buildWarnings(request: WalletTransferRequest): List<String> {
        val warnings = mutableListOf<String>()
        warnings += "Closed beta only. Real funds are disabled."
        warnings += "Owner confirmation is required before approval."

        if (request.source == WalletTransferSource.NFC) {
            warnings += "NFC can request payment, but it cannot approve payment."
        }

        if (request.source == WalletTransferSource.TRAVEL_MODE) {
            warnings += "Travel Mode must use capped Travel Pocket rules."
        }

        if (request.destination.isBlank()) {
            warnings += "Destination is missing."
        }

        return warnings
    }

    private fun demoFeeFor(network: WalletNetwork): String {
        return when (network) {
            WalletNetwork.BITCOIN -> "0.00001 BTC demo fee"
            WalletNetwork.ETHEREUM -> "0.001 ETH demo fee"
            WalletNetwork.HEDERA -> "0.05 HBAR demo fee"
            WalletNetwork.EVM_TESTNET -> "0.001 TEST demo fee"
            WalletNetwork.STABLE_SANDBOX -> "0.00 TEST_USD demo fee"
        }
    }
}
