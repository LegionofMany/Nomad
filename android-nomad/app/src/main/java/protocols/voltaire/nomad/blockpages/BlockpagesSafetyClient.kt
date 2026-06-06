package protocols.voltaire.nomad.blockpages

/**
 * Blockpages411 safety-signal boundary for Nomad Android.
 *
 * This client provides user-facing context before sensitive wallet actions.
 * It does not take custody and does not approve actions automatically.
 */
interface BlockpagesSafetyClient {
    suspend fun reviewDestination(identifier: String, network: String): SafetySignal
    suspend fun reviewLink(link: String): SafetySignal
}

data class SafetySignal(
    val subject: String,
    val level: SafetyLevel,
    val notes: List<String>,
    val summary: String
)

enum class SafetyLevel {
    UNKNOWN,
    NORMAL,
    CAUTION,
    WARNING
}
