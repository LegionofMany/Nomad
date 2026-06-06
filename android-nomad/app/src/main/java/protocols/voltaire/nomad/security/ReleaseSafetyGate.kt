package protocols.voltaire.nomad.security

/**
 * Release safety gate for Nomad Android.
 *
 * This gate protects the project from accidentally treating development wiring
 * as production-ready wallet infrastructure.
 */
class ReleaseSafetyGate {
    fun evaluate(configuration: ReleaseSafetyConfiguration): ReleaseSafetyResult {
        val blockers = mutableListOf<String>()

        if (configuration.realFundsRequested && !ProductionReadiness.REAL_FUNDS_ALLOWED) {
            blockers.add("Real funds are disabled by ProductionReadiness.REAL_FUNDS_ALLOWED.")
        }

        val activeDevelopmentServices = configuration.activeServiceNames
            .filter { serviceName -> ProductionReadiness.developmentImplementations.contains(serviceName) }

        if (activeDevelopmentServices.isNotEmpty()) {
            blockers.add(
                "Development services are still active: ${activeDevelopmentServices.joinToString(", ")}"
            )
        }

        if (!configuration.secureStorageProductionSafe) {
            blockers.add("Secure storage is not production safe.")
        }

        if (configuration.ownerConfirmationAutoConfirmEnabled) {
            blockers.add("Owner confirmation auto-confirm is enabled.")
        }

        if (configuration.nfcCanBypassOwnerConfirmation) {
            blockers.add("NFC cannot bypass owner confirmation.")
        }

        if (configuration.travelPocketCanAccessMainWalletDirectly) {
            blockers.add("Travel Pocket/NFC flow cannot access the main wallet directly.")
        }

        return ReleaseSafetyResult(
            allowed = blockers.isEmpty(),
            blockers = blockers
        )
    }
}

data class ReleaseSafetyConfiguration(
    val realFundsRequested: Boolean,
    val activeServiceNames: List<String>,
    val secureStorageProductionSafe: Boolean,
    val ownerConfirmationAutoConfirmEnabled: Boolean,
    val nfcCanBypassOwnerConfirmation: Boolean,
    val travelPocketCanAccessMainWalletDirectly: Boolean
)

data class ReleaseSafetyResult(
    val allowed: Boolean,
    val blockers: List<String>
) {
    fun requireAllowed() {
        check(allowed) {
            "Nomad release safety check failed: ${blockers.joinToString("; ")}"
        }
    }
}
