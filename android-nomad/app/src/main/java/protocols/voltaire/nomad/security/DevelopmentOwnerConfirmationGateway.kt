package protocols.voltaire.nomad.security

import java.time.Instant
import protocols.voltaire.nomad.travel.OwnerConfirmation

/**
 * Development-only owner confirmation gateway.
 *
 * This implementation can auto-confirm for wiring tests. Production builds must
 * replace it with real clock unlock, biometric, passcode, or hardware approval.
 */
class DevelopmentOwnerConfirmationGateway(
    private val autoConfirmForDevelopment: Boolean = true
) : OwnerConfirmationGateway {
    override suspend fun requestConfirmation(
        request: OwnerConfirmationRequest
    ): OwnerConfirmationResult {
        if (!autoConfirmForDevelopment) {
            return OwnerConfirmationResult(
                reviewId = request.reviewId,
                accepted = false,
                method = request.requiredMethod,
                message = "Development confirmation was not accepted."
            )
        }

        return OwnerConfirmationResult(
            reviewId = request.reviewId,
            accepted = true,
            method = request.requiredMethod,
            message = "Development owner confirmation accepted. Replace before production.",
            confirmation = OwnerConfirmation(
                method = request.requiredMethod,
                confirmed = true,
                confirmedAtIso = Instant.now().toString()
            )
        )
    }
}
