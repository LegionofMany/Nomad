package protocols.voltaire.nomad.travel

import protocols.voltaire.nomad.security.OwnerConfirmationGateway
import protocols.voltaire.nomad.security.OwnerConfirmationRequest

/**
 * Development scenario runner for the Nomad Travel Mode payment flow.
 *
 * This class demonstrates the intended sequence:
 * 1. Enable Travel Mode
 * 2. Fund a Travel Pocket
 * 3. Enable NFC requests
 * 4. Parse NFC payload into TravelPaymentIntent
 * 5. Review through coordinator
 * 6. Request explicit owner confirmation
 * 7. Debit Travel Pocket only after accepted owner confirmation
 */
class TravelPaymentScenario(
    private val travelModeManager: TravelModeManager,
    private val travelPocketManager: TravelPocketManager,
    private val nfcPaymentGateway: NfcPaymentGateway,
    private val travelPaymentCoordinator: TravelPaymentCoordinator,
    private val ownerConfirmationGateway: OwnerConfirmationGateway
) {
    suspend fun runDevelopmentScenario(): TravelPaymentScenarioResult {
        val travelState = travelModeManager.enableTravelMode(
            TravelModeRequest(
                regionCode = "CA",
                preferredStableValueAsset = "CADC",
                spendingCap = SpendingCap(
                    assetSymbol = "CADC",
                    maxAmount = "100.00",
                    period = SpendingCapPeriod.DAILY
                )
            )
        )

        val pocketFunding = travelPocketManager.createOrFundPocket(
            TravelPocketFundingRequest(
                regionCode = "CA",
                assetSymbol = "CADC",
                amount = "250.00",
                dailyLimit = "100.00",
                tripLimit = "250.00"
            )
        )

        val nfcState = nfcPaymentGateway.setNfcEnabledForTravel(true)

        val intent = nfcPaymentGateway.parseNfcPayload(
            NfcPaymentPayload(
                merchantLabel = "Demo Travel Merchant",
                destination = "nomad_merchant_demo_destination",
                regionCode = "CA",
                assetSymbol = "CADC",
                amount = "18.75",
                network = "NOMAD_DEVNET",
                rawReference = "demo-nfc-reference"
            )
        )

        val review = travelPaymentCoordinator.reviewPayment(intent)

        val confirmationResult = if (review.canProceedToOwnerConfirmation) {
            ownerConfirmationGateway.requestConfirmation(
                OwnerConfirmationRequest(
                    reviewId = review.reviewId,
                    title = review.intentReview.title,
                    summary = review.intentReview.summary,
                    requiredMethod = review.approvalDecision.requiredConfirmation,
                    warnings = review.intentReview.warnings
                )
            )
        } else {
            null
        }

        val approvalResult = if (confirmationResult?.accepted == true && confirmationResult.confirmation != null) {
            travelPaymentCoordinator.recordOwnerApproval(
                reviewId = review.reviewId,
                confirmation = confirmationResult.confirmation
            )
        } else {
            CoordinatedTravelPaymentResult(
                accepted = false,
                message = confirmationResult?.message ?: "Scenario could not proceed to owner confirmation."
            )
        }

        return TravelPaymentScenarioResult(
            travelModeEnabled = travelState.enabled,
            pocketFunded = pocketFunding.accepted,
            nfcEnabled = nfcState.enabledForTravel,
            reviewAllowed = review.canProceedToOwnerConfirmation,
            ownerConfirmationRequested = confirmationResult != null,
            ownerApprovalAccepted = approvalResult.accepted,
            message = approvalResult.message,
            remainingPocket = approvalResult.pocket
        )
    }
}

data class TravelPaymentScenarioResult(
    val travelModeEnabled: Boolean,
    val pocketFunded: Boolean,
    val nfcEnabled: Boolean,
    val reviewAllowed: Boolean,
    val ownerConfirmationRequested: Boolean,
    val ownerApprovalAccepted: Boolean,
    val message: String,
    val remainingPocket: TravelPocket?
)
