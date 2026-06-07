package protocols.voltaire.nomad.travel

/**
 * Real-world Travel Mode POS scenario model.
 *
 * This represents the user abroad at a POS terminal. The terminal can create a
 * request through NFC, but it cannot approve payment.
 */
data class TravelPosScenario(
    val scenarioId: String,
    val locationLabel: String,
    val countryCode: String,
    val merchantName: String,
    val merchantCategory: String,
    val amount: String,
    val requestedAssetSymbol: String,
    val network: String,
    val source: TravelPaymentSource = TravelPaymentSource.NFC
)

object TravelPosScenarioFactory {
    fun londonCafe(): TravelPosScenario {
        return TravelPosScenario(
            scenarioId = "london-cafe-pos",
            locationLabel = "London cafe POS",
            countryCode = "GB",
            merchantName = "Nomad London Cafe",
            merchantCategory = "Cafe",
            amount = "18.75",
            requestedAssetSymbol = "GBPT",
            network = "Stablecoin Sandbox"
        )
    }

    fun beachVendor(): TravelPosScenario {
        return TravelPosScenario(
            scenarioId = "beach-vendor-pos",
            locationLabel = "Beach vendor POS",
            countryCode = "TRAVEL_BEACH",
            merchantName = "Nomad Beach Vendor",
            merchantCategory = "Travel Market",
            amount = "12.00",
            requestedAssetSymbol = "USDC",
            network = "Stablecoin Sandbox"
        )
    }
}
