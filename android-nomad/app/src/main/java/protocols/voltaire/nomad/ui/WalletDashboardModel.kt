package protocols.voltaire.nomad.ui

/**
 * App-ready wallet dashboard model.
 *
 * This is intentionally UI-safe: it exposes display data and warnings, not raw
 * wallet secrets or production signing material.
 */
data class WalletDashboardModel(
    val title: String,
    val phaseLabel: String,
    val selectedAccount: WalletAccountDisplay,
    val receiveAddress: ReceiveAddressDisplay,
    val betaWarnings: List<String>,
    val enabledCapabilities: List<String>,
    val lockedCapabilities: List<String>,
    val safetyStatus: String,
    val quickActions: List<WalletDashboardAction>
)

data class WalletAccountDisplay(
    val label: String,
    val network: String,
    val assetSymbol: String,
    val available: String,
    val pending: String,
    val fiatEstimate: String?
)

data class ReceiveAddressDisplay(
    val address: String,
    val addressIndex: Int,
    val warning: String?
)

data class WalletDashboardAction(
    val id: String,
    val label: String,
    val enabled: Boolean,
    val description: String
)
