package protocols.voltaire.nomad.security

/**
 * Closed-beta validator for Nomad time clock keys.
 *
 * The time clock is the user's authority string. It may be used to open the
 * wallet, approve a reviewed payment, or recover the home wallet. Closed beta
 * validates structure only; production must compare against protected local
 * wallet material with rate limits and recovery policy.
 */
class NomadTimeClockValidator {
    fun validate(key: NomadTimeClockKey): NomadTimeClockValidationResult {
        if (!key.isStructurallyValid()) {
            return NomadTimeClockValidationResult(
                accepted = false,
                purpose = key.purpose,
                message = "Invalid time clock key for ${key.purpose.displayName}."
            )
        }

        return when (key.purpose) {
            NomadTimeClockPurpose.OPEN_WALLET_DOOR -> NomadTimeClockValidationResult(
                accepted = true,
                purpose = key.purpose,
                message = "Time clock key accepted for opening the wallet door."
            )
            NomadTimeClockPurpose.APPROVE_REVIEWED_PAYMENT -> NomadTimeClockValidationResult(
                accepted = true,
                purpose = key.purpose,
                message = "Time clock key accepted for approving this reviewed payment request."
            )
            NomadTimeClockPurpose.RECOVER_HOME_WALLET -> NomadTimeClockValidationResult(
                accepted = true,
                purpose = key.purpose,
                message = "Twenty-four-position time clock key accepted for home wallet recovery flow."
            )
        }
    }
}
