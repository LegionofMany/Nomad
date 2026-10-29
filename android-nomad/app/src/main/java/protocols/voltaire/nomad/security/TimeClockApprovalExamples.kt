package protocols.voltaire.nomad.security

/**
 * Small examples that prove the approval boundary stays simple:
 * no payment approval continues without the correct time clock authority.
 */
object TimeClockApprovalExamples {
    fun approvedPaymentExample(reviewId: String): TimeClockConfirmationResult {
        val coordinator = TimeClockConfirmationCoordinator(NomadTimeClockValidator())
        return coordinator.checkPaymentApproval(
            reviewId = reviewId,
            key = NomadTimeClockKey(
                purpose = NomadTimeClockPurpose.APPROVE_REVIEWED_PAYMENT,
                positions = listOf(ClockTimePosition(hour = 10, minute = 10))
            )
        )
    }

    fun deniedPaymentExample(reviewId: String): TimeClockConfirmationResult {
        val coordinator = TimeClockConfirmationCoordinator(NomadTimeClockValidator())
        return coordinator.checkPaymentApproval(
            reviewId = reviewId,
            key = null
        )
    }
}
