package protocols.voltaire.nomad.beta

/**
 * Capability flags let Nomad build features ahead of release while exposing
 * them progressively through internal, closed beta, public beta, and production
 * phases.
 */
object CapabilityFlags {
    val capabilities: List<NomadCapability> = listOf(
        NomadCapability(
            id = "demo_wallet",
            label = "Demo Wallet",
            state = CapabilityState.CLOSED_BETA,
            description = "Create and restore demo wallets for beta testing."
        ),
        NomadCapability(
            id = "clock_unlock",
            label = "Clock Unlock",
            state = CapabilityState.CLOSED_BETA,
            description = "Test the Nomad clock unlock concept."
        ),
        NomadCapability(
            id = "travel_mode",
            label = "Travel Mode",
            state = CapabilityState.CLOSED_BETA,
            description = "Configure travel settings and preferred stable-value asset."
        ),
        NomadCapability(
            id = "travel_pocket",
            label = "Travel Pocket",
            state = CapabilityState.CLOSED_BETA,
            description = "Simulate prefunded travel allowance and spending caps."
        ),
        NomadCapability(
            id = "nfc_request_simulation",
            label = "NFC Request Simulation",
            state = CapabilityState.CLOSED_BETA,
            description = "Convert a simulated NFC payload into a reviewable payment intent."
        ),
        NomadCapability(
            id = "owner_confirmation",
            label = "Owner Confirmation",
            state = CapabilityState.CLOSED_BETA,
            description = "Require explicit owner approval before simulated debit."
        ),
        NomadCapability(
            id = "blockpages_safety_preview",
            label = "Blockpages411 Safety Preview",
            state = CapabilityState.CLOSED_BETA,
            description = "Show development safety messaging for links and destinations."
        ),
        NomadCapability(
            id = "testnet_wallet",
            label = "Testnet Wallet",
            state = CapabilityState.HIDDEN,
            description = "Future public beta testnet wallet flow."
        ),
        NomadCapability(
            id = "real_nfc_hardware",
            label = "Real NFC Hardware",
            state = CapabilityState.PRODUCTION_LOCKED,
            description = "Real Android NFC integration after production review."
        ),
        NomadCapability(
            id = "real_stablecoin_settlement",
            label = "Real Stablecoin Settlement",
            state = CapabilityState.PRODUCTION_LOCKED,
            description = "Real settlement remains locked until audit and production approval."
        )
    )

    fun enabledForClosedBeta(): List<NomadCapability> {
        return capabilities.filter { capability ->
            capability.state == CapabilityState.CLOSED_BETA ||
                capability.state == CapabilityState.PUBLIC_BETA ||
                capability.state == CapabilityState.PRODUCTION_READY
        }
    }

    fun hiddenOrLocked(): List<NomadCapability> {
        return capabilities.filter { capability ->
            capability.state == CapabilityState.HIDDEN ||
                capability.state == CapabilityState.PRODUCTION_LOCKED
        }
    }

    fun statusText(): String {
        return buildString {
            appendLine("Capability rollout:")
            capabilities.forEach { capability ->
                appendLine("- ${capability.label}: ${capability.state}")
            }
        }
    }
}

data class NomadCapability(
    val id: String,
    val label: String,
    val state: CapabilityState,
    val description: String
)

enum class CapabilityState {
    HIDDEN,
    INTERNAL_TEST,
    CLOSED_BETA,
    PUBLIC_BETA,
    PRODUCTION_LOCKED,
    PRODUCTION_READY
}
