package protocols.voltaire.nomad.security

/**
 * Nomad time clock key.
 *
 * The time clock is the user's recovery string represented as clock positions.
 * It can be used for different owner-controlled purposes:
 *
 * 1. Open the wallet door
 * 2. Accept or approve a reviewed payment
 * 3. Recover or reset the home wallet
 *
 * Closed beta validates structure only. Production validation must use audited
 * secure storage, rate limits, recovery rules, and owner confirmation screens.
 */
data class NomadTimeClockKey(
    val purpose: NomadTimeClockPurpose,
    val positions: List<ClockTimePosition>
) {
    fun isStructurallyValid(): Boolean {
        return positions.isNotEmpty() &&
            positions.all { position -> position.isValid() } &&
            positions.size in purpose.allowedPositionCounts
    }

    fun displaySummary(): String {
        return "${purpose.displayName}: ${positions.size} clock position(s)"
    }
}

data class ClockTimePosition(
    val hour: Int,
    val minute: Int
) {
    fun isValid(): Boolean {
        return hour in 0..23 && minute in 0..59
    }

    fun label(): String {
        return hour.toString().padStart(2, '0') + ":" + minute.toString().padStart(2, '0')
    }
}

enum class NomadTimeClockPurpose(
    val displayName: String,
    val allowedPositionCounts: Set<Int>
) {
    OPEN_WALLET_DOOR(
        displayName = "Open wallet door",
        allowedPositionCounts = setOf(1)
    ),
    APPROVE_REVIEWED_PAYMENT(
        displayName = "Approve reviewed payment",
        allowedPositionCounts = setOf(1)
    ),
    RECOVER_HOME_WALLET(
        displayName = "Recover home wallet",
        allowedPositionCounts = setOf(24)
    )
}

data class NomadTimeClockValidationResult(
    val accepted: Boolean,
    val purpose: NomadTimeClockPurpose,
    val message: String
)
