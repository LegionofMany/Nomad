package protocols.voltaire.nomad.wallet

/**
 * Address manager boundary for Nomad Android.
 *
 * This layer separates address presentation from account recovery material.
 * It should return public receiving details only.
 */
interface AddressManager {
    suspend fun getPrimaryAddress(accountId: String, network: String): WalletAddress
    suspend fun getReceiveAddress(accountId: String, network: String): WalletAddress
    suspend fun listKnownAddresses(accountId: String): List<WalletAddress>
    suspend fun labelAddress(address: String, label: String): WalletAddressLabel
}

data class WalletAddress(
    val address: String,
    val network: String,
    val derivationLabel: String? = null,
    val displayLabel: String? = null
)

data class WalletAddressLabel(
    val address: String,
    val label: String,
    val updatedAtIso: String
)
