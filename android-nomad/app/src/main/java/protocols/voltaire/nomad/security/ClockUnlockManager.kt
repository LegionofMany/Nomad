package protocols.voltaire.nomad.security

/**
 * Nomad clock unlock boundary.
 *
 * The clock unlock layer should never expose seed material. It only verifies
 * whether the user has satisfied the local unlock ritual and lockout policy.
 */
interface ClockUnlockManager {
    suspend fun setDailyUnlockTime(time: ClockUnlockTime)
    suspend fun getDailyUnlockTime(): ClockUnlockTime?
    suspend fun verifyUnlockAttempt(time: ClockUnlockTime): ClockUnlockResult
    suspend fun lock()
    suspend fun resetAfterVerifiedRecovery()
}

data class ClockUnlockTime(
    val hour: Int,
    val minute: Int,
    val isTwentyFourHour: Boolean = true
)

sealed class ClockUnlockResult {
    data object Accepted : ClockUnlockResult()
    data class Rejected(val reason: String, val remainingLockSeconds: Long? = null) : ClockUnlockResult()
    data object RecoveryRequired : ClockUnlockResult()
}
