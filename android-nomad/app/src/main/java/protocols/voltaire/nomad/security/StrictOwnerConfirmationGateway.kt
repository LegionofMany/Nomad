package protocols.voltaire.nomad.security

import java.time.Instant
import protocols.voltaire.nomad.travel.OwnerConfirmation

/**
 * Strict owner confirmation gateway for Nomad closed beta.
 *
 * This gateway does not auto-confirm. A reviewed action only continues when the
 * request includes a valid Nomad time clock key for the requested purpose.
 */
class StrictOwnerConfirmationGateway(
    private val timeClockValidator: NomadTimeClockValidator
) : OwnerConfirmationGateway {
    override suspend fun requestConfirmation(
        request: OwnerConfirmationRequest
    ): OwnerConfirmationResult {
        val key = request.timeClockKey
        if (key == null) {
            return OwnerConfirmationResult(
                reviewId = request.reviewId,
                accepted = false,
                method = request.requiredMethod,
                message = "Time clock authority is required."
            )
        }

        if (key.purpose != NomadTimeClockPurpose.APPROVE_REVIEWED_PAYMENT) {
            return OwnerConfirmationResult(
                reviewId = request.reviewId,
                accepted = false,
                method = request.requiredMethod,
                message = "Time clock purpose must match payment approval."
            )
        }

        val validation = timeClockValidator.validate(key)
        if (!validation.accepted) {
            return OwnerConfirmationResult(
                reviewId = request.reviewId,
                accepted = false,
                method = request.requiredMethod,
                message = validation.message,
                timeClockValidation = validation
            )
        }

        return OwnerConfirmationResult(
            reviewId = request.reviewId,
            accepted = true,
            method = request.requiredMethod,
            message = "Time clock authority accepted for reviewed payment.",
            confirmation = OwnerConfirmation(
                method = request.requiredMethod,
                confirmed = true,
                confirmedAtIso = Instant.now().toString()
            ),
            timeClockValidation = validation
        )
    }
}
