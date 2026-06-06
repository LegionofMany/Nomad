package protocols.voltaire.nomad.blockpages

/**
 * Development-only Blockpages411 safety client.
 *
 * Production implementation should call the real Blockpages411 service and
 * return transparent user-facing safety context.
 */
class DevelopmentBlockpagesSafetyClient : BlockpagesSafetyClient {
    override suspend fun reviewDestination(identifier: String, network: String): SafetySignal {
        val level = when {
            identifier.isBlank() -> SafetyLevel.WARNING
            identifier.contains("demo", ignoreCase = true) -> SafetyLevel.NORMAL
            else -> SafetyLevel.CAUTION
        }

        return SafetySignal(
            subject = identifier.ifBlank { "unknown destination" },
            level = level,
            notes = listOf(
                "Development safety response",
                "Connect Blockpages411 production API before release"
            ),
            summary = when (level) {
                SafetyLevel.NORMAL -> "Development destination appears normal."
                SafetyLevel.CAUTION -> "Destination has not been verified in this development build."
                SafetyLevel.WARNING -> "Destination is missing or invalid."
                SafetyLevel.UNKNOWN -> "No safety signal available."
            }
        )
    }

    override suspend fun reviewLink(link: String): SafetySignal {
        val level = if (link.startsWith("https://")) SafetyLevel.CAUTION else SafetyLevel.WARNING
        return SafetySignal(
            subject = link.ifBlank { "unknown link" },
            level = level,
            notes = listOf("Development link review only"),
            summary = if (level == SafetyLevel.CAUTION) {
                "Secure-looking link, but production verification is not connected yet."
            } else {
                "Link should be treated with caution."
            }
        )
    }
}
