package protocols.voltaire.nomad.travel

import java.util.UUID

/**
 * Development implementation of the safe Travel Mode payment coordinator.
 *
 * This connects:
 * - Travel Mode state
 * - payment intent review
 * - prefunded Travel Pocket checks
 * - owner confirmation requirement
 *
 * No payment should proceed from request alone.
 */
class BasicTravelPaymentCoordinator(
    private val travelModeManager: TravelModeManager,
    private val paymentPolicy: TravelPaymentPolicy,
    private val pocketManager: TravelPocketManager
) : TravelPaymentCoordinator {
    private val pendingReviews = mutableMapOf<String, PendingReview>()

    override suspend fun reviewPayment(intent: TravelPaymentIntent): CoordinatedTravelPaymentReview {
        val travelState = travelModeManager.getTravelModeState()
        val intentReview = paymentPolicy.reviewIntent(intent, travelState)
        val approvalDecision = paymentPolicy.canOwnerApprove(intentReview)

        val pocket = pocketManager.getActivePocket(intent.regionCode, intent.assetSymbol)
        val pocketResult = if (pocket == null) {
            TravelPocketResult(false, null, "No active Travel Pocket for ${intent.assetSymbol} in ${intent.regionCode}.")
        } else {
            pocketManager.reviewDebit(
                TravelPocketDebitRequest(
                    pocketId = pocket.pocketId,
                    amount = intent.amount,
                    merchantLabel = intent.merchantLabel,
                    requestId = intent.requestId
                )
            )
        }

        val reviewId = UUID.randomUUID().toString()
        val canProceed = approvalDecision.allowed && pocketResult.accepted && intentReview.ownerApprovalRequired

        val coordinated = CoordinatedTravelPaymentReview(
            reviewId = reviewId,
            intentReview = intentReview,
            pocketResult = pocketResult,
            approvalDecision = approvalDecision,
            canProceedToOwnerConfirmation = canProceed
        )

        if (canProceed && pocketResult.pocket != null) {
            pendingReviews[reviewId] = PendingReview(
                intent = intent,
                pocketId = pocketResult.pocket.pocketId
            )
        }

        return coordinated
    }

    override suspend fun recordOwnerApproval(
        reviewId: String,
        confirmation: OwnerConfirmation
    ): CoordinatedTravelPaymentResult {
        val pending = pendingReviews[reviewId]
            ?: return CoordinatedTravelPaymentResult(false, "Payment review was not found or is no longer pending.")

        if (!confirmation.confirmed) {
            pendingReviews.remove(reviewId)
            return CoordinatedTravelPaymentResult(false, "Owner declined the travel payment.")
        }

        val result = pocketManager.applyDebit(
            TravelPocketDebitRequest(
                pocketId = pending.pocketId,
                amount = pending.intent.amount,
                merchantLabel = pending.intent.merchantLabel,
                requestId = pending.intent.requestId
            )
        )

        pendingReviews.remove(reviewId)
        return CoordinatedTravelPaymentResult(
            accepted = result.accepted,
            message = if (result.accepted) "Travel payment approved by owner and applied to Travel Pocket." else result.message,
            pocket = result.pocket
        )
    }

    override suspend fun cancelPayment(reviewId: String): CoordinatedTravelPaymentResult {
        val removed = pendingReviews.remove(reviewId)
        return if (removed == null) {
            CoordinatedTravelPaymentResult(false, "Payment review was not pending.")
        } else {
            CoordinatedTravelPaymentResult(false, "Travel payment cancelled.")
        }
    }

    private data class PendingReview(
        val intent: TravelPaymentIntent,
        val pocketId: String
    )
}
