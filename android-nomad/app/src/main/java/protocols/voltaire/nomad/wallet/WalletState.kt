package protocols.voltaire.nomad.wallet

import java.time.Instant

/**
 * Nomad wallet state used by the Android-native architecture.
 *
 * This follows the Samourai-style separation of wallet identity, accounts,
 * balances, addresses, and pending review actions while keeping Nomad-specific
 * travel safety boundaries.
 */
data class WalletState(
    val walletId: String,
    val displayName: String,
    val createdAt: Instant,
    val accounts: List<WalletAccountState>,
    val selectedAccountId: String?,
    val betaMode: Boolean,
    val realFundsEnabled: Boolean
) {
    fun selectedAccount(): WalletAccountState? {
        return accounts.firstOrNull { account -> account.accountId == selectedAccountId }
    }
}

data class WalletAccountState(
    val accountId: String,
    val label: String,
    val network: WalletNetwork,
    val receiveAddress: String,
    val balance: WalletBalance,
    val addressIndex: Int,
    val archived: Boolean = false
)

data class WalletBalance(
    val assetSymbol: String,
    val available: String,
    val pending: String,
    val fiatEstimate: String? = null
)
