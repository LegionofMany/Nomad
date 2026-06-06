package protocols.voltaire.nomad.travel

/**
 * Coordinates the safe Travel Mode payment flow.
 *
 * NFC, QR, or manual input can create a TravelPaymentIntent. This coordinator
 * reviews the intent, checks the prefunded Travel Pocket, and returns an owner
 * approval requirement. It must not treat a payment request as approval.
 */
interface TravelPaymentCoordinator {
    suspend fun reviewPayment(intent: TravelPaymentIntent): CoordinatedTravelPaymentReview
    suspend fun recordOwnerApproval(reviewId: String, confirmation: OwnerConfirmation): CoordinatedTravelPaymentResult
    suspend fun cancelPayment(reviewId: String): CoordinatedTravelPaymentResult
}

data class CoordinatedTravelPaymentReview(
    val reviewId: String,
    val intentReview: TravelPaymentReview,
    val pocketResult: TravelPocketResult,
    val approvalDecision: OwnerApprovalDecision,
    val canProceedToOwnerConfirmation: Boolean
)

data class OwnerConfirmation(
    val method: OwnerConfirmationMethod,
    val confirmed: Boolean,
    val confirmedAtIso: String
)

data class CoordinatedTravelPaymentResult(
    val accepted: Boolean,
    val message: String,
    val pocket: TravelPocket? = null
)
