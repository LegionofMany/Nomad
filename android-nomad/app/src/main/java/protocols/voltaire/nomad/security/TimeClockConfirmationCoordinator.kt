package protocols.voltaire.nomad.security

/**
 * Coordinates Nomad time clock checks before wallet access, payment approval,
 * or home recovery can continue.
 *
 * The time requirement is a theft-prevention boundary. A stolen phone, rogue
 * merchant terminal, or accidental NFC tap should not be enough to move value.
 */
class TimeClockConfirmationCoordinator(
    private val validator: NomadTimeClockValidator
) {
    fun checkWalletOpen(key: NomadTimeClockKey?): TimeClockConfirmationResult {
        return check(
            actionId = "wallet-open",
            expectedPurpose = NomadTimeClockPurpose.OPEN_WALLET_DOOR,
            missingMessage = "Nomad time clock key is required to open the wallet door.",
            wrongPurposeMessage = "Time clock key purpose does not match wallet open.",
            key = key
        )
    }

    fun checkPaymentApproval(reviewId: String, key: NomadTimeClockKey?): TimeClockConfirmationResult {
        return check(
            actionId = reviewId,
            expectedPurpose = NomadTimeClockPurpose.APPROVE_REVIEWED_PAYMENT,
            missingMessage = "Nomad time clock key is required before this reviewed payment can continue.",
            wrongPurposeMessage = "Time clock key purpose does not match payment approval.",
            key = key
        )
    }

    fun checkHomeRecovery(key: NomadTimeClockKey?): TimeClockConfirmationResult {
        return check(
            actionId = "home-recovery",
            expectedPurpose = NomadTimeClockPurpose.RECOVER_HOME_WALLET,
            missingMessage = "Twenty-four-position Nomad time clock key is required for home recovery.",
            wrongPurposeMessage = "Time clock key purpose does not match home recovery.",
            key = key
        )
    }

    private fun check(
        actionId: String,
        expectedPurpose: NomadTimeClockPurpose,
        missingMessage: String,
        wrongPurposeMessage: String,
        key: NomadTimeClockKey?
    ): TimeClockConfirmationResult {
        if (key == null) {
            return TimeClockConfirmationResult(
                actionId = actionId,
                allowedToContinue = false,
                message = missingMessage
            )
        }

        if (key.purpose != expectedPurpose) {
            return TimeClockConfirmationResult(
                actionId = actionId,
                allowedToContinue = false,
                message = wrongPurposeMessage
            )
        }

        val validation = validator.validate(key)
        return TimeClockConfirmationResult(
            actionId = actionId,
            allowedToContinue = validation.accepted,
            message = validation.message,
            validation = validation
        )
    }
}

data class TimeClockConfirmationResult(
    val actionId: String,
    val allowedToContinue: Boolean,
    val message: String,
    val validation: NomadTimeClockValidationResult? = null
)
