package protocols.voltaire.nomad.ui

import protocols.voltaire.nomad.beta.CapabilityFlags
import protocols.voltaire.nomad.beta.CapabilityState
import protocols.voltaire.nomad.security.DevelopmentSafetyReport
import protocols.voltaire.nomad.wallet.ReceiveAddressCoordinator
import protocols.voltaire.nomad.wallet.WalletState

/**
 * Builds the Nomad wallet dashboard model from safe development services.
 */
class WalletDashboardController(
    private val walletStateProvider: () -> WalletState,
    private val receiveAddressCoordinator: ReceiveAddressCoordinator,
    private val safetyReportProvider: () -> DevelopmentSafetyReport
) {
    fun build(): WalletDashboardModel {
        val walletState = walletStateProvider()
        val account = walletState.selectedAccount() ?: walletState.accounts.first()
        val receiveAddress = receiveAddressCoordinator.currentReceiveAddress(account.accountId)
        val safetyReport = safetyReportProvider()

        return WalletDashboardModel(
            title = walletState.displayName,
            phaseLabel = if (walletState.betaMode) "Closed beta / test mode" else "Production candidate",
            selectedAccount = WalletAccountDisplay(
                label = account.label,
                network = account.network.displayName,
                assetSymbol = account.balance.assetSymbol,
                available = account.balance.available,
                pending = account.balance.pending,
                fiatEstimate = account.balance.fiatEstimate
            ),
            receiveAddress = ReceiveAddressDisplay(
                address = receiveAddress.address,
                addressIndex = receiveAddress.addressIndex,
                warning = receiveAddress.warning
            ),
            betaWarnings = buildBetaWarnings(walletState, safetyReport),
            enabledCapabilities = CapabilityFlags.capabilities
                .filter { capability -> capability.state == CapabilityState.CLOSED_BETA }
                .map { capability -> capability.label },
            lockedCapabilities = CapabilityFlags.hiddenOrLocked().map { capability -> capability.label },
            safetyStatus = safetyReport.statusTitle,
            quickActions = buildQuickActions()
        )
    }

    private fun buildBetaWarnings(walletState: WalletState, safetyReport: DevelopmentSafetyReport): List<String> {
        val warnings = mutableListOf<String>()
        if (walletState.betaMode) warnings += "Closed beta mode is active."
        if (!walletState.realFundsEnabled) warnings += "Real funds are disabled."
        warnings += "Use demo addresses and test data only."
        warnings += safetyReport.statusMessage
        return warnings.distinct()
    }

    private fun buildQuickActions(): List<WalletDashboardAction> {
        return listOf(
            WalletDashboardAction(
                id = "receive",
                label = "Receive Demo Address",
                enabled = true,
                description = "Show the selected account demo receive address."
            ),
            WalletDashboardAction(
                id = "send_review",
                label = "Review Demo Transfer",
                enabled = true,
                description = "Prepare a human-readable transfer review."
            ),
            WalletDashboardAction(
                id = "travel_mode",
                label = "Travel Mode",
                enabled = true,
                description = "Configure capped Travel Pocket testing."
            ),
            WalletDashboardAction(
                id = "real_funds",
                label = "Real Funds",
                enabled = false,
                description = "Locked until production wallet stack and external audit."
            )
        )
    }
}
