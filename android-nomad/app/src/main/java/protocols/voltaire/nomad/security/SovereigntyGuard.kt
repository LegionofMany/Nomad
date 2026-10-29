package protocols.voltaire.nomad.security

/**
 * Simple guard for enforcing Voltaire sovereignty rules in development flows.
 */
class SovereigntyGuard {
    fun review(action: SovereigntyAction): SovereigntyGuardResult {
        val blockers = mutableListOf<String>()

        if (action.requestsPayment && !action.ownerReviewShown) {
            blockers += "Payment request must be reviewed by the owner."
        }

        if (action.requestsPayment && !action.timeClockAuthorityProvided) {
            blockers += "Time clock authority is required for payment approval."
        }

        if (action.usesNfc && action.nfcApprovesPayment) {
            blockers += "NFC can request payment but cannot approve payment."
        }

        if (action.usesTravelMode && !action.usesTravelPocket) {
            blockers += "Travel Mode payments must use the capped Travel Pocket."
        }

        if (action.usesMainWalletForPos) {
            blockers += "POS payments cannot pull directly from the home wallet."
        }

        if (action.backgroundSigningRequested) {
            blockers += "Background signing is not allowed."
        }

        return SovereigntyGuardResult(
            allowed = blockers.isEmpty(),
            blockers = blockers,
            rules = VoltaireSovereigntyPolicy.rules
        )
    }
}

data class SovereigntyAction(
    val name: String,
    val requestsPayment: Boolean,
    val ownerReviewShown: Boolean,
    val timeClockAuthorityProvided: Boolean,
    val usesNfc: Boolean,
    val nfcApprovesPayment: Boolean,
    val usesTravelMode: Boolean,
    val usesTravelPocket: Boolean,
    val usesMainWalletForPos: Boolean,
    val backgroundSigningRequested: Boolean
)

data class SovereigntyGuardResult(
    val allowed: Boolean,
    val blockers: List<String>,
    val rules: List<SovereigntyRule>
) {
    fun displayText(): String {
        if (allowed) return "Voltaire sovereignty guard passed."
        return "Voltaire sovereignty guard blocked action:\n" + blockers.joinToString("\n") { blocker -> "- $blocker" }
    }
}
