package protocols.voltaire.nomad.travel

/**
 * Travel Mode boundary for Nomad Android.
 *
 * Travel Mode should be explicit, capped, reversible, and local-first.
 * NFC is off by default and must be enabled only by direct user action.
 */
interface TravelModeManager {
    suspend fun enableTravelMode(request: TravelModeRequest): TravelModeState
    suspend fun disableTravelMode(): TravelModeState
    suspend fun getTravelModeState(): TravelModeState
    suspend fun updateSpendingCap(cap: SpendingCap): TravelModeState
}

data class TravelModeRequest(
    val regionCode: String,
    val preferredStableValueAsset: String? = null,
    val spendingCap: SpendingCap? = null,
    val expiresAtIso: String? = null
)

data class SpendingCap(
    val assetSymbol: String,
    val maxAmount: String,
    val period: SpendingCapPeriod
)

enum class SpendingCapPeriod {
    DAILY,
    WEEKLY,
    TRIP_TOTAL
}

data class TravelModeState(
    val enabled: Boolean,
    val regionCode: String? = null,
    val preferredStableValueAsset: String? = null,
    val spendingCap: SpendingCap? = null,
    val nfcEnabled: Boolean = false,
    val expiresAtIso: String? = null
)
