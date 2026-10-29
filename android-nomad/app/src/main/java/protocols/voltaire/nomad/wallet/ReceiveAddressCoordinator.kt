package protocols.voltaire.nomad.wallet

/**
 * Coordinates receive address presentation.
 *
 * Production implementations should derive and rotate addresses using audited
 * wallet derivation logic. The closed-beta implementation can expose safe demo
 * addresses only.
 */
interface ReceiveAddressCoordinator {
    fun currentReceiveAddress(accountId: String): ReceiveAddressResult
    fun nextReceiveAddress(accountId: String): ReceiveAddressResult
}

data class ReceiveAddressResult(
    val accountId: String,
    val network: WalletNetwork,
    val address: String,
    val addressIndex: Int,
    val warning: String? = null
)
