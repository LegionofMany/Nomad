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
    val regionalAssetLabel: String,
    val regionalAssetStatus: RegionalStableAssetStatus,
    val network: String,
    val source: TravelPaymentSource = TravelPaymentSource.NFC
)

object TravelPosScenarioFactory {
    private val resolver = RegionalStableAssetResolver()

    fun forLocation(
        scenarioId: String,
        locationLabel: String,
        countryCode: String,
        merchantName: String,
        merchantCategory: String,
        amount: String
    ): TravelPosScenario {
        val asset = resolver.resolve(countryCode)
        return TravelPosScenario(
            scenarioId = scenarioId,
            locationLabel = locationLabel,
            countryCode = countryCode,
            merchantName = merchantName,
            merchantCategory = merchantCategory,
            amount = amount,
            requestedAssetSymbol = asset.assetSymbol,
            regionalAssetLabel = asset.displayName,
            regionalAssetStatus = asset.betaStatus,
            network = "Stablecoin Sandbox"
        )
    }

    fun londonCafe(): TravelPosScenario {
        return forLocation(
            scenarioId = "london-cafe-pos",
            locationLabel = "London cafe POS",
            countryCode = "GB",
            merchantName = "Nomad London Cafe",
            merchantCategory = "Cafe",
            amount = "18.75"
        )
    }

    fun beachVendor(countryCode: String = "US"): TravelPosScenario {
        return forLocation(
            scenarioId = "beach-vendor-pos-${countryCode.lowercase()}",
            locationLabel = "Beach vendor POS",
            countryCode = countryCode,
            merchantName = "Nomad Beach Vendor",
            merchantCategory = "Travel Market",
            amount = "12.00"
        )
    }

    fun airportRetail(countryCode: String): TravelPosScenario {
        return forLocation(
            scenarioId = "airport-retail-pos-${countryCode.lowercase()}",
            locationLabel = "Airport retail POS",
            countryCode = countryCode,
            merchantName = "Nomad Airport Retail",
            merchantCategory = "Airport Retail",
            amount = "34.25"
        )
    }

    fun hotelFrontDesk(countryCode: String): TravelPosScenario {
        return forLocation(
            scenarioId = "hotel-front-desk-pos-${countryCode.lowercase()}",
            locationLabel = "Hotel front desk POS",
            countryCode = countryCode,
            merchantName = "Nomad Hotel Desk",
            merchantCategory = "Hotel",
            amount = "75.00"
        )
    }
}
