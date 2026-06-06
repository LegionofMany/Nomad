package protocols.voltaire.nomad.travel

/**
 * NFC payment gateway boundary for Nomad Android.
 *
 * NFC is only allowed to detect or parse a nearby payment request. It must not
 * approve, sign, debit, or broadcast anything. The output is always a
 * TravelPaymentIntent that must flow through TravelPaymentCoordinator.
 */
interface NfcPaymentGateway {
    suspend fun isNfcAvailable(): Boolean
    suspend fun isNfcEnabledForTravel(): Boolean
    suspend fun setNfcEnabledForTravel(enabled: Boolean): NfcTravelState
    suspend fun parseNfcPayload(payload: NfcPaymentPayload): TravelPaymentIntent
}

data class NfcTravelState(
    val available: Boolean,
    val enabledForTravel: Boolean,
    val message: String
)

data class NfcPaymentPayload(
    val merchantLabel: String?,
    val destination: String,
    val regionCode: String,
    val assetSymbol: String,
    val amount: String,
    val network: String,
    val rawReference: String? = null
)
