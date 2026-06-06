package protocols.voltaire.nomad.travel

import java.time.Instant

/**
 * Development scenario runner for the Nomad Travel Mode payment flow.
 *
 * This class demonstrates the intended sequence:
 * 1. Enable Travel Mode
 * 2. Fund a Travel Pocket
 * 3. Enable NFC requests
 * 4. Parse NFC payload into TravelPaymentIntent
 * 5. Review through coordinator
 * 6. Require owner approval
 * 7. Debit Travel Pocket only after approval
 */
class TravelPaymentScenario(
    private val travelModeManager: TravelModeManager,
    private val travelPocketManager: TravelPocketManager,
    private val nfcPaymentGateway: NfcPaymentGateway,
    private val travelPaymentCoordinator: TravelPaymentCoordinator
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

        val approvalResult = if (review.canProceedToOwnerConfirmation) {
            travelPaymentCoordinator.recordOwnerApproval(
                reviewId = review.reviewId,
                confirmation = OwnerConfirmation(
                    method = OwnerConfirmationMethod.CLOCK_UNLOCK,
                    confirmed = true,
                    confirmedAtIso = Instant.now().toString()
                )
            )
        } else {
            CoordinatedTravelPaymentResult(
                accepted = false,
                message = "Scenario could not proceed to owner confirmation."
            )
        }

        return TravelPaymentScenarioResult(
            travelModeEnabled = travelState.enabled,
            pocketFunded = pocketFunding.accepted,
            nfcEnabled = nfcState.enabledForTravel,
            reviewAllowed = review.canProceedToOwnerConfirmation,
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
    val ownerApprovalAccepted: Boolean,
    val message: String,
    val remainingPocket: TravelPocket?
)
