package protocols.voltaire.nomad.travel

import java.time.Instant
import java.util.UUID

/**
 * Development-only NFC payment gateway.
 *
 * This does not access real NFC hardware. It models the safe Nomad behavior:
 * NFC can create a TravelPaymentIntent, but cannot approve payment.
 */
class DevelopmentNfcPaymentGateway : NfcPaymentGateway {
    private var enabledForTravel: Boolean = false

    override suspend fun isNfcAvailable(): Boolean = true

    override suspend fun isNfcEnabledForTravel(): Boolean = enabledForTravel

    override suspend fun setNfcEnabledForTravel(enabled: Boolean): NfcTravelState {
        enabledForTravel = enabled
        return NfcTravelState(
            available = true,
            enabledForTravel = enabledForTravel,
            message = if (enabledForTravel) {
                "NFC travel requests enabled. Owner approval is still required for every payment."
            } else {
                "NFC travel requests disabled."
            }
        )
    }

    override suspend fun parseNfcPayload(payload: NfcPaymentPayload): TravelPaymentIntent {
        require(enabledForTravel) { "NFC travel requests are disabled." }
        require(payload.destination.isNotBlank()) { "NFC payment destination is required." }
        require(payload.amount.isNotBlank()) { "NFC payment amount is required." }
        require(payload.assetSymbol.isNotBlank()) { "NFC payment asset is required." }
        require(payload.network.isNotBlank()) { "NFC payment network is required." }

        return TravelPaymentIntent(
            requestId = UUID.randomUUID().toString(),
            merchantLabel = payload.merchantLabel,
            destination = payload.destination,
            regionCode = payload.regionCode.ifBlank { "GLOBAL" }.uppercase(),
            assetSymbol = payload.assetSymbol.uppercase(),
            amount = payload.amount,
            network = payload.network.uppercase(),
            source = TravelPaymentSource.NFC,
            createdAtIso = Instant.now().toString()
        )
    }
}
