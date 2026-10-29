package protocols.voltaire.nomad.security

/**
 * Human-readable development safety report.
 *
 * This is used by the development UI and audit trail to show why Nomad is not
 * yet approved for real funds.
 */
data class DevelopmentSafetyReport(
    val realFundsAllowed: Boolean,
    val statusTitle: String,
    val statusMessage: String,
    val blockers: List<String>
) {
    fun toDisplayText(): String {
        return buildString {
            appendLine(statusTitle)
            appendLine(statusMessage)
            appendLine()
            appendLine("Real funds allowed: $realFundsAllowed")
            appendLine()
            if (blockers.isEmpty()) {
                appendLine("No release blockers reported.")
            } else {
                appendLine("Release blockers:")
                blockers.forEach { blocker -> appendLine("- $blocker") }
            }
        }
    }
}

fun ReleaseSafetyResult.toDevelopmentSafetyReport(): DevelopmentSafetyReport {
    return DevelopmentSafetyReport(
        realFundsAllowed = allowed,
        statusTitle = if (allowed) "Nomad release safety: allowed" else "Nomad release safety: blocked",
        statusMessage = if (allowed) {
            "This configuration passed the safety gate."
        } else {
            "This configuration is development-only and must not be used with real funds."
        },
        blockers = blockers
    )
}
