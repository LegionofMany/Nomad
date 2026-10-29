package protocols.voltaire.nomad.security

/**
 * Production readiness markers for Nomad Android.
 *
 * These constants are intentionally strict. Release builds should fail if any
 * development implementation is still wired into the production container.
 */
object ProductionReadiness {
    const val REAL_FUNDS_ALLOWED: Boolean = false

    val developmentImplementations: List<String> = listOf(
        "InMemorySecureStorageGateway",
        "DevelopmentOwnerConfirmationGateway",
        "DevelopmentWalletEngine",
        "DevelopmentNfcPaymentGateway",
        "DevelopmentBlockpagesSafetyClient",
        "BasicTravelPocketManager",
        "BasicTravelPaymentCoordinator",
        "BasicTravelPaymentPolicy",
        "BasicTravelModeManager",
        "BasicClockUnlockManager"
    )

    val requiredProductionImplementations: List<String> = listOf(
        "AndroidKeystoreSecureStorageGateway",
        "ProductionOwnerConfirmationGateway",
        "ProductionWalletEngine",
        "AndroidNfcPaymentGateway",
        "BlockpagesApiSafetyClient",
        "ProductionTravelPocketManager",
        "ProductionTravelPaymentCoordinator",
        "ProductionTravelPaymentPolicy",
        "ProductionTravelModeManager",
        "ProductionClockUnlockManager"
    )

    fun assertRealFundsDisabled() {
        check(!REAL_FUNDS_ALLOWED) {
            "Real funds must remain disabled until all production blockers are resolved."
        }
    }
}
