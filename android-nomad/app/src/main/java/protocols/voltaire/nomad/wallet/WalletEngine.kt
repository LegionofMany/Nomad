package protocols.voltaire.nomad.wallet

/**
 * Core wallet engine contract for Nomad Android.
 *
 * This is a scaffold boundary only. Production implementations must require
 * explicit user consent and security review before any value-moving action.
 */
interface WalletEngine {
    suspend fun createWallet(): WalletAccount
    suspend fun restoreWallet(recoveryPhrase: String): WalletAccount
    suspend fun getActiveAccount(): WalletAccount?
    suspend fun prepareTransfer(request: TransferRequest): PreparedTransfer
    suspend fun reviewPreparedTransfer(preparedTransfer: PreparedTransfer): TransferReview
}

data class WalletAccount(
    val id: String,
    val label: String,
    val primaryAddress: String,
    val network: String,
    val createdAtIso: String
)

data class TransferRequest(
    val destinationAddress: String,
    val assetSymbol: String,
    val amount: String,
    val network: String,
    val memo: String? = null
)

data class PreparedTransfer(
    val request: TransferRequest,
    val estimatedFee: String,
    val previewText: String
)

data class TransferReview(
    val humanReadableSummary: String,
    val warnings: List<String>,
    val requiresExplicitConsent: Boolean = true
)
