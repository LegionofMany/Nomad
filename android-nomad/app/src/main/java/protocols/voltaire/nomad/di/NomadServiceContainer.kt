package protocols.voltaire.nomad.di

import protocols.voltaire.nomad.blockpages.BlockpagesSafetyClient
import protocols.voltaire.nomad.blockpages.DevelopmentBlockpagesSafetyClient
import protocols.voltaire.nomad.security.BasicClockUnlockManager
import protocols.voltaire.nomad.security.ClockUnlockManager
import protocols.voltaire.nomad.security.InMemorySecureStorageGateway
import protocols.voltaire.nomad.security.SecureStorageGateway
import protocols.voltaire.nomad.travel.BasicTravelModeManager
import protocols.voltaire.nomad.travel.BasicTravelPaymentCoordinator
import protocols.voltaire.nomad.travel.BasicTravelPaymentPolicy
import protocols.voltaire.nomad.travel.BasicTravelPocketManager
import protocols.voltaire.nomad.travel.DevelopmentNfcPaymentGateway
import protocols.voltaire.nomad.travel.NfcPaymentGateway
import protocols.voltaire.nomad.travel.TravelModeManager
import protocols.voltaire.nomad.travel.TravelPaymentCoordinator
import protocols.voltaire.nomad.travel.TravelPaymentPolicy
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
    val travelModeManager: TravelModeManager = BasicTravelModeManager()
    val travelPaymentPolicy: TravelPaymentPolicy = BasicTravelPaymentPolicy()
    val travelPocketManager: TravelPocketManager = BasicTravelPocketManager()
    val nfcPaymentGateway: NfcPaymentGateway = DevelopmentNfcPaymentGateway()
    val travelPaymentCoordinator: TravelPaymentCoordinator = BasicTravelPaymentCoordinator(
        travelModeManager = travelModeManager,
        paymentPolicy = travelPaymentPolicy,
        pocketManager = travelPocketManager
    )
    val walletEngine: WalletEngine = DevelopmentWalletEngine()
    val blockpagesSafetyClient: BlockpagesSafetyClient = DevelopmentBlockpagesSafetyClient()

    val homeController: NomadHomeController = NomadHomeController(
        walletEngine = walletEngine,
        travelModeManager = travelModeManager,
        safetyClient = blockpagesSafetyClient
    )
}
