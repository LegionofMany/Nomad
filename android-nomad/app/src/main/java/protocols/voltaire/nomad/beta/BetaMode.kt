package protocols.voltaire.nomad.beta

/**
 * Closed beta mode settings for Nomad.
 *
 * Beta mode opens test/demo flows while keeping real funds disabled until the
 * production wallet stack is complete and audited.
 */
object BetaMode {
    const val CLOSED_BETA_ENABLED: Boolean = true
    const val TEST_MODE_ENABLED: Boolean = true
    const val REAL_FUNDS_ENABLED: Boolean = false

    val enabledFlows: List<String> = listOf(
        "Demo wallet creation",
        "Demo wallet restore",
        "Clock unlock demo",
        "Travel Mode setup",
        "Travel Pocket simulation",
        "NFC request simulation",
        "Owner confirmation simulation",
        "Blockpages411 safety messaging"
    )

    val blockedFlows: List<String> = listOf(
        "Real stablecoin settlement",
        "Real private key custody",
        "Production merchant acceptance",
        "Main-wallet direct NFC spending",
        "Silent signing",
        "Background approval"
    )

    fun statusText(): String {
        return buildString {
            appendLine("Closed beta enabled: $CLOSED_BETA_ENABLED")
            appendLine("Test mode enabled: $TEST_MODE_ENABLED")
            appendLine("Real funds enabled: $REAL_FUNDS_ENABLED")
            appendLine()
            appendLine("Enabled beta flows:")
            enabledFlows.forEach { appendLine("- $it") }
            appendLine()
            appendLine("Blocked flows:")
            blockedFlows.forEach { appendLine("- $it") }
        }
    }
}
