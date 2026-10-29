package protocols.voltaire.nomad.security

/**
 * Basic development implementation of Nomad clock unlock.
 *
 * This provides local state and lockout behavior for early Android wiring.
 * Production work should bind this to encrypted wallet material and OS-backed
 * secure storage.
 */
class BasicClockUnlockManager(
    private val storage: SecureStorageGateway
) : ClockUnlockManager {
    private var failedAttempts: Int = 0
    private var locked: Boolean = false

    override suspend fun setDailyUnlockTime(time: ClockUnlockTime) {
        validateTime(time)
        storage.putString(SecureStorageKey.UNLOCK_TIME, encode(time))
        failedAttempts = 0
        locked = false
    }

    override suspend fun getDailyUnlockTime(): ClockUnlockTime? {
        return storage.getString(SecureStorageKey.UNLOCK_TIME)?.let(::decode)
    }

    override suspend fun verifyUnlockAttempt(time: ClockUnlockTime): ClockUnlockResult {
        if (locked) return ClockUnlockResult.RecoveryRequired

        val configured = getDailyUnlockTime()
            ?: return ClockUnlockResult.Rejected("Unlock time has not been configured")

        if (configured.hour == time.hour && configured.minute == time.minute) {
            failedAttempts = 0
            return ClockUnlockResult.Accepted
        }

        failedAttempts += 1
        if (failedAttempts >= 8) {
            locked = true
            return ClockUnlockResult.RecoveryRequired
        }

        val waitSeconds = failedAttempts * 10L
        return ClockUnlockResult.Rejected(
            reason = "Clock unlock did not match",
            remainingLockSeconds = waitSeconds
        )
    }

    override suspend fun lock() {
        failedAttempts = 0
    }

    override suspend fun resetAfterVerifiedRecovery() {
        failedAttempts = 0
        locked = false
    }

    private fun validateTime(time: ClockUnlockTime) {
        require(time.hour in 0..23) { "Clock hour must be 0 through 23" }
        require(time.minute in 0..59) { "Clock minute must be 0 through 59" }
    }

    private fun encode(time: ClockUnlockTime): String {
        return "${time.hour}:${time.minute}:${time.isTwentyFourHour}"
    }

    private fun decode(raw: String): ClockUnlockTime {
        val parts = raw.split(":")
        return ClockUnlockTime(
            hour = parts.getOrNull(0)?.toIntOrNull() ?: 0,
            minute = parts.getOrNull(1)?.toIntOrNull() ?: 0,
            isTwentyFourHour = parts.getOrNull(2)?.toBooleanStrictOrNull() ?: true
        )
    }
}
