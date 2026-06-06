package protocols.voltaire.nomad.security

/**
 * Recovery coordinator boundary for Nomad Android.
 *
 * Recovery must be deliberate, user-visible, and separated from everyday
 * unlock attempts. This layer should coordinate validation and reset flows
 * without exposing recovery material to logs or UI state snapshots.
 */
interface RecoveryCoordinator {
    suspend fun beginRecovery(): RecoverySession
    suspend fun validateRecoveryPhrase(sessionId: String, phrase: String): RecoveryValidationResult
    suspend fun completeRecovery(sessionId: String, newUnlockTime: ClockUnlockTime): RecoveryCompletionResult
    suspend fun cancelRecovery(sessionId: String)
}

data class RecoverySession(
    val id: String,
    val startedAtIso: String,
    val instructions: List<String>
)

sealed class RecoveryValidationResult {
    data object Valid : RecoveryValidationResult()
    data class Invalid(val reason: String) : RecoveryValidationResult()
}

data class RecoveryCompletionResult(
    val completed: Boolean,
    val message: String
)
