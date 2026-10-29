package protocols.voltaire.nomad.security

/**
 * Voltaire sovereignty policy for Nomad.
 *
 * This is the simple security promise that all wallet, travel, NFC, and payment
 * flows must respect.
 */
object VoltaireSovereigntyPolicy {
    val rules: List<SovereigntyRule> = listOf(
        SovereigntyRule(
            id = "owner-controls-keys",
            title = "Owner controls keys",
            description = "Nomad must never custody or export the user's private keys."
        ),
        SovereigntyRule(
            id = "request-is-not-approval",
            title = "Request is not approval",
            description = "NFC, QR, POS, or app requests can ask for payment, but cannot approve payment."
        ),
        SovereigntyRule(
            id = "time-clock-authority",
            title = "Time clock authority required",
            description = "Opening, payment approval, and recovery require the correct Nomad time clock authority."
        ),
        SovereigntyRule(
            id = "travel-pocket-only",
            title = "Travel Pocket only",
            description = "Travel payments can only use the capped Travel Pocket, not the home wallet."
        ),
        SovereigntyRule(
            id = "regional-stablecoin",
            title = "Regional stablecoin by location",
            description = "Nomad should select the stable-value asset based on travel region or selected region."
        ),
        SovereigntyRule(
            id = "no-silent-signing",
            title = "No silent signing",
            description = "Nomad must not sign, approve, or settle in the background."
        )
    )

    fun summary(): String {
        return rules.joinToString(separator = "\n") { rule -> "- ${rule.title}: ${rule.description}" }
    }
}

data class SovereigntyRule(
    val id: String,
    val title: String,
    val description: String
)
