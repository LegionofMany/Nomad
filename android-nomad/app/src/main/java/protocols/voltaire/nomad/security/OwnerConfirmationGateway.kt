package protocols.voltaire.nomad.security

import protocols.voltaire.nomad.travel.OwnerConfirmation
import protocols.voltaire.nomad.travel.OwnerConfirmationMethod

/**
 * Owner confirmation boundary for Nomad Android.
 *
 * A payment request, NFC tap, QR scan, or prepared transfer is not approval.
 * This gateway represents the explicit wallet-owner confirmation step.
 */
interface OwnerConfirmationGateway {
    suspend fun requestConfirmation(request: OwnerConfirmationRequest): OwnerConfirmationResult
}

data class OwnerConfirmationRequest(
    val reviewId: String,
    val title: String,
    val summary: String,
    val requiredMethod: OwnerConfirmationMethod,
    val warnings: List<String> = emptyList(),
    val timeClockKey: NomadTimeClockKey? = null
)

data class OwnerConfirmationResult(
    val reviewId: String,
    val accepted: Boolean,
    val method: OwnerConfirmationMethod,
    val message: String,
    val confirmation: OwnerConfirmation? = null,
    val timeClockValidation: NomadTimeClockValidationResult? = null
)
