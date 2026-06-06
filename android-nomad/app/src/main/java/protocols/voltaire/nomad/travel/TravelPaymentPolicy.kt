package protocols.voltaire.nomad.travel

/**
 * Travel payment policy for Nomad Android.
 *
 * NFC may only create a payment intent. The wallet owner must explicitly approve
 * after reviewing amount, asset, destination, network, fee estimate, and safety
 * context.
 */
interface TravelPaymentPolicy {
    suspend fun reviewIntent(intent: TravelPaymentIntent, travelModeState: TravelModeState): TravelPaymentReview
    suspend fun canOwnerApprove(review: TravelPaymentReview): OwnerApprovalDecision
}

data class OwnerApprovalDecision(
    val allowed: Boolean,
    val reason: String,
    val requiredConfirmation: OwnerConfirmationMethod = OwnerConfirmationMethod.CLOCK_UNLOCK
)

enum class OwnerConfirmationMethod {
    CLOCK_UNLOCK,
    DEVICE_BIOMETRIC,
    DEVICE_PASSCODE,
    HARDWARE_CONFIRMATION
}
