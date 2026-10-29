package protocols.voltaire.nomad.ui

import protocols.voltaire.nomad.travel.TravelModeState
import protocols.voltaire.nomad.wallet.WalletAccount

/**
 * UI-safe home state for Nomad Android.
 *
 * This model intentionally contains display-safe data only. It must never
 * contain private keys, recovery phrases, raw seeds, or decrypted secrets.
 */
data class NomadHomeModel(
    val walletStatus: WalletStatusView,
    val activeAccount: WalletAccount?,
    val travelModeState: TravelModeState,
    val safetySummary: SafetySummaryView,
    val quickActions: List<NomadQuickAction>
)

enum class WalletStatusView {
    NO_WALLET,
    LOCKED,
    UNLOCKED,
    RECOVERY_REQUIRED
}

data class SafetySummaryView(
    val level: SafetyUiLevel,
    val title: String,
    val message: String
)

enum class SafetyUiLevel {
    NORMAL,
    CAUTION,
    WARNING
}

data class NomadQuickAction(
    val id: String,
    val label: String,
    val enabled: Boolean,
    val reasonDisabled: String? = null
)
