package protocols.voltaire.nomad.di

import protocols.voltaire.nomad.blockpages.BlockpagesSafetyClient
import protocols.voltaire.nomad.blockpages.DevelopmentBlockpagesSafetyClient
import protocols.voltaire.nomad.security.BasicClockUnlockManager
import protocols.voltaire.nomad.security.ClockUnlockManager
import protocols.voltaire.nomad.security.DevelopmentOwnerConfirmationGateway
import protocols.voltaire.nomad.security.DevelopmentSafetyReport
import protocols.voltaire.nomad.security.InMemorySecureStorageGateway
import protocols.voltaire.nomad.security.OwnerConfirmationGateway
import protocols.voltaire.nomad.security.ReleaseSafetyConfiguration
import protocols.voltaire.nomad.security.ReleaseSafetyGate
import protocols.voltaire.nomad.security.ReleaseSafetyResult
import protocols.voltaire.nomad.security.SecureStorageGateway
import protocols.voltaire.nomad.security.toDevelopmentSafetyReport
import protocols.voltaire.nomad.travel.BasicTravelModeManager
import protocols.voltaire.nomad.travel.BasicTravelPaymentCoordinator
import protocols.voltaire.nomad.travel.BasicTravelPaymentPolicy
import protocols.voltaire.nomad.travel.BasicTravelPocketManager
import protocols.voltaire.nomad.travel.DevelopmentNfcPaymentGateway
import protocols.voltaire.nomad.travel.NfcPaymentGateway
import protocols.voltaire.nomad.travel.TravelModeManager
import protocols.voltaire.nomad.travel.TravelPaymentCoordinator
import protocols.voltaire.nomad.travel.TravelPaymentPolicy
import protocols.voltaire.nomad.travel.TravelPaymentScenario
import protocols.voltaire.nomad.travel.TravelPocketManager
import protocols.voltaire.nomad.ui.NomadHomeController
import protocols.voltaire.nomad.wallet.DevelopmentWalletEngine
import protocols.voltaire.nomad.wallet.WalletEngine

/**
 * Development service container for Nomad Android.
 *
 * This keeps wiring centralized while the project moves from scaffold to native
 * implementation. Production builds should replace development services with
 * audited implementations.
 */
class NomadServiceContainer {
    val secureStorage: SecureStorageGateway = InMemorySecureStorageGateway()
    val clockUnlockManager: ClockUnlockManager = BasicClockUnlockManager(secureStorage)
    val ownerConfirmationGateway: OwnerConfirmationGateway = DevelopmentOwnerConfirmationGateway()
    val travelModeManager: TravelModeManager = BasicTravelModeManager()
    val travelPaymentPolicy: TravelPaymentPolicy = BasicTravelPaymentPolicy()
    val travelPocketManager: TravelPocketManager = BasicTravelPocketManager()
    val nfcPaymentGateway: NfcPaymentGateway = DevelopmentNfcPaymentGateway()
    val travelPaymentCoordinator: TravelPaymentCoordinator = BasicTravelPaymentCoordinator(
        travelModeManager = travelModeManager,
        paymentPolicy = travelPaymentPolicy,
        pocketManager = travelPocketManager
    )
    val travelPaymentScenario: TravelPaymentScenario = TravelPaymentScenario(
        travelModeManager = travelModeManager,
        travelPocketManager = travelPocketManager,
        nfcPaymentGateway = nfcPaymentGateway,
        travelPaymentCoordinator = travelPaymentCoordinator,
        ownerConfirmationGateway = ownerConfirmationGateway
    )
    val walletEngine: WalletEngine = DevelopmentWalletEngine()
    val blockpagesSafetyClient: BlockpagesSafetyClient = DevelopmentBlockpagesSafetyClient()
    val releaseSafetyGate: ReleaseSafetyGate = ReleaseSafetyGate()
    val developmentReleaseSafetyResult: ReleaseSafetyResult = releaseSafetyGate.evaluate(
        ReleaseSafetyConfiguration(
            realFundsRequested = true,
            activeServiceNames = listOf(
                "InMemorySecureStorageGateway",
                "BasicClockUnlockManager",
                "DevelopmentOwnerConfirmationGateway",
                "BasicTravelModeManager",
                "BasicTravelPaymentPolicy",
                "BasicTravelPocketManager",
                "DevelopmentNfcPaymentGateway",
                "BasicTravelPaymentCoordinator",
                "DevelopmentWalletEngine",
                "DevelopmentBlockpagesSafetyClient"
            ),
            secureStorageProductionSafe = secureStorage.isProductionSafe(),
            ownerConfirmationAutoConfirmEnabled = true,
            nfcCanBypassOwnerConfirmation = false,
            travelPocketCanAccessMainWalletDirectly = false
        )
    )
    val developmentSafetyReport: DevelopmentSafetyReport = developmentReleaseSafetyResult.toDevelopmentSafetyReport()

    val homeController: NomadHomeController = NomadHomeController(
        walletEngine = walletEngine,
        travelModeManager = travelModeManager,
        safetyClient = blockpagesSafetyClient
    )
}
