package protocols.voltaire.nomad.ui

import protocols.voltaire.nomad.blockpages.BlockpagesSafetyClient
import protocols.voltaire.nomad.blockpages.SafetyLevel
import protocols.voltaire.nomad.travel.TravelModeManager
import protocols.voltaire.nomad.wallet.WalletEngine

/**
 * Development home controller for Nomad Android.
 *
 * This class composes wallet state, travel mode, and safety context into a
 * UI-safe home model.
 */
class NomadHomeController(
    private val walletEngine: WalletEngine,
    private val travelModeManager: TravelModeManager,
    private val safetyClient: BlockpagesSafetyClient? = null
) {
    suspend fun loadHome(): NomadHomeModel {
        val account = walletEngine.getActiveAccount()
        val travelState = travelModeManager.getTravelModeState()

        val walletStatus = if (account == null) {
            WalletStatusView.NO_WALLET
        } else {
            WalletStatusView.LOCKED
        }

        val safetySummary = if (account == null || safetyClient == null) {
            SafetySummaryView(
                level = SafetyUiLevel.NORMAL,
                title = "Ready",
                message = "Create or restore a Nomad wallet to begin."
            )
        } else {
            val signal = safetyClient.reviewDestination(account.primaryAddress, account.network)
            SafetySummaryView(
                level = signal.level.toUiLevel(),
                title = "Wallet safety context",
                message = signal.summary
            )
        }

        return NomadHomeModel(
            walletStatus = walletStatus,
            activeAccount = account,
            travelModeState = travelState,
            safetySummary = safetySummary,
            quickActions = buildQuickActions(account != null, travelState.enabled)
        )
    }

    private fun buildQuickActions(hasWallet: Boolean, travelEnabled: Boolean): List<NomadQuickAction> {
        return listOf(
            NomadQuickAction(
                id = "create_or_restore",
                label = if (hasWallet) "Wallet Ready" else "Create / Restore",
                enabled = !hasWallet,
                reasonDisabled = if (hasWallet) "Wallet already exists" else null
            ),
            NomadQuickAction(
                id = "travel_mode",
                label = if (travelEnabled) "Disable Travel Mode" else "Enable Travel Mode",
                enabled = hasWallet
            ),
            NomadQuickAction(
                id = "receive",
                label = "Receive",
                enabled = hasWallet
            ),
            NomadQuickAction(
                id = "review_destination",
                label = "Review Destination",
                enabled = hasWallet
            )
        )
    }

    private fun SafetyLevel.toUiLevel(): SafetyUiLevel {
        return when (this) {
            SafetyLevel.UNKNOWN -> SafetyUiLevel.CAUTION
            SafetyLevel.NORMAL -> SafetyUiLevel.NORMAL
            SafetyLevel.CAUTION -> SafetyUiLevel.CAUTION
            SafetyLevel.WARNING -> SafetyUiLevel.WARNING
        }
    }
}
