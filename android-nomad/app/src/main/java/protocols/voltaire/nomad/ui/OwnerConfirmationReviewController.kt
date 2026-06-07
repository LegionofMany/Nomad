package protocols.voltaire.nomad.ui

import protocols.voltaire.nomad.wallet.WalletTransferReview

/**
 * Builds the owner confirmation screen model from a prepared wallet transfer
 * review. This keeps approval as a separate Nomad boundary after request review.
 */
class OwnerConfirmationReviewController {
    fun build(review: WalletTransferReview): OwnerConfirmationReviewModel {
        return OwnerConfirmationReviewModel(
            reviewId = review.reviewId,
            title = "Confirm Nomad payment request",
            source = review.request.source.name,
            destination = review.request.destination,
            amount = review.request.amount,
            assetSymbol = review.request.assetSymbol,
            network = review.request.network.displayName,
            estimatedFee = review.estimatedFee,
            requiresOwnerConfirmation = review.requiresOwnerConfirmation,
            warnings = review.warnings + additionalBoundaryWarnings(review),
            approveAction = OwnerConfirmationAction(
                id = "approve_${review.reviewId}",
                label = "Approve reviewed request",
                enabled = review.requiresOwnerConfirmation,
                description = "Approve only this reviewed request. Closed beta does not settle real funds."
            ),
            denyAction = OwnerConfirmationAction(
                id = "deny_${review.reviewId}",
                label = "Deny request",
                enabled = true,
                description = "Deny this request and prevent approval."
            )
        )
    }

    private fun additionalBoundaryWarnings(review: WalletTransferReview): List<String> {
        val warnings = mutableListOf<String>()
        warnings += "A request is not approval."
        warnings += "Approval applies only to this review id: ${review.reviewId}."
        warnings += "No production signing material is present in this screen model."
        return warnings
    }
}
