package protocols.voltaire.nomad.wallet

/**
 * Transfer review boundary.
 *
 * Nomad must always prepare a human-readable review before any payment action.
 * A request can never become approval by itself.
 */
interface TransferReviewCoordinator {
    fun prepareReview(request: WalletTransferRequest): WalletTransferReview
    fun approveReviewedTransfer(reviewId: String, ownerApprovalId: String): WalletTransferApprovalResult
    fun denyReviewedTransfer(reviewId: String, reason: String): WalletTransferApprovalResult
}

data class WalletTransferRequest(
    val accountId: String,
    val destination: String,
    val amount: String,
    val assetSymbol: String,
    val network: WalletNetwork,
    val memo: String? = null,
    val source: WalletTransferSource = WalletTransferSource.MANUAL
)

data class WalletTransferReview(
    val reviewId: String,
    val request: WalletTransferRequest,
    val estimatedFee: String,
    val warnings: List<String>,
    val requiresOwnerConfirmation: Boolean
)

data class WalletTransferApprovalResult(
    val reviewId: String,
    val approved: Boolean,
    val message: String
)

enum class WalletTransferSource {
    MANUAL,
    QR,
    NFC,
    TRAVEL_MODE
}
