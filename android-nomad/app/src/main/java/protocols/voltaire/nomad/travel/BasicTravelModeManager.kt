package protocols.voltaire.nomad.travel

/**
 * Basic development implementation of Travel Mode.
 *
 * Keeps NFC disabled by default and records a local travel state. Production
 * versions should connect to native NFC policy, spending-cap enforcement, and
 * stable-value routing.
 */
class BasicTravelModeManager : TravelModeManager {
    private var state = TravelModeState(enabled = false)

    override suspend fun enableTravelMode(request: TravelModeRequest): TravelModeState {
        val cap = request.spendingCap ?: SpendingCap(
            assetSymbol = request.preferredStableValueAsset ?: defaultStableValueAsset(request.regionCode),
            maxAmount = "100.00",
            period = SpendingCapPeriod.DAILY
        )

        state = TravelModeState(
            enabled = true,
            regionCode = request.regionCode.uppercase(),
            preferredStableValueAsset = request.preferredStableValueAsset ?: defaultStableValueAsset(request.regionCode),
            spendingCap = cap,
            nfcEnabled = false,
            expiresAtIso = request.expiresAtIso
        )

        return state
    }

    override suspend fun disableTravelMode(): TravelModeState {
        state = TravelModeState(enabled = false)
        return state
    }

    override suspend fun getTravelModeState(): TravelModeState = state

    override suspend fun updateSpendingCap(cap: SpendingCap): TravelModeState {
        state = state.copy(spendingCap = cap)
        return state
    }

    private fun defaultStableValueAsset(regionCode: String): String {
        return when (regionCode.uppercase()) {
            "CA", "CANADA" -> "CADC"
            "US", "USA" -> "USDC"
            "EU", "EUR", "EUROPE" -> "EUROC"
            "UK", "GB" -> "GBPT"
            "AU", "AUS", "AUSTRALIA" -> "AUDD"
            "UAE", "AE" -> "AED_STABLE"
            else -> "USDC"
        }
    }
}
