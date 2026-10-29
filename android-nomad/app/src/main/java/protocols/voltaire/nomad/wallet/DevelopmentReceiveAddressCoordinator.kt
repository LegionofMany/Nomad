package protocols.voltaire.nomad.wallet

/**
 * Closed-beta receive address coordinator.
 *
 * This implementation returns demo-only addresses and must not be used for real
 * funds. Production receive addresses must come from audited wallet derivation.
 */
class DevelopmentReceiveAddressCoordinator(
    private val walletStateProvider: () -> WalletState
) : ReceiveAddressCoordinator {
    override fun currentReceiveAddress(accountId: String): ReceiveAddressResult {
        val account = findAccount(accountId)
        return ReceiveAddressResult(
            accountId = account.accountId,
            network = account.network,
            address = account.receiveAddress,
            addressIndex = account.addressIndex,
            warning = "Demo address only. Do not send real funds."
        )
    }

    override fun nextReceiveAddress(accountId: String): ReceiveAddressResult {
        val account = findAccount(accountId)
        val nextIndex = account.addressIndex + 1
        val demoAddress = "nomad_demo_${account.network.name.lowercase()}_$nextIndex"
        return ReceiveAddressResult(
            accountId = account.accountId,
            network = account.network,
            address = demoAddress,
            addressIndex = nextIndex,
            warning = "Demo address only. Production derivation is not active."
        )
    }

    private fun findAccount(accountId: String): WalletAccountState {
        return walletStateProvider().accounts.firstOrNull { account -> account.accountId == accountId }
            ?: error("Unknown demo account: $accountId")
    }
}
