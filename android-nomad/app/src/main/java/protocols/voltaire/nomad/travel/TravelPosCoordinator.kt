package protocols.voltaire.nomad.travel

/**
 * Converts travel-abroad POS scenarios into Nomad payment intents.
 *
 * The coordinator does not approve payment. It only prepares the request for
 * review through the existing TravelPaymentCoordinator and owner confirmation
 * boundary.
 */
class TravelPosCoordinator(
    private val travelPaymentCoordinator: TravelPaymentCoordinator
) {
    fun reviewPosScenario(
        scenario: TravelPosScenario,
        travelModeState: TravelModeState
    ): CoordinatedTravelPaymentReview {
        val intent = TravelPaymentIntent(
            source = scenario.source,
            destination = scenario.merchantName,
            amount = scenario.amount,
            assetSymbol = scenario.requestedAssetSymbol,
            network = scenario.network,
            merchantName = scenario.merchantName,
            memo = "${scenario.locationLabel} / ${scenario.merchantCategory}"
        )

        return travelPaymentCoordinator.reviewPayment(
            intent = intent,
            travelModeState = travelModeState
        )
    }
}
