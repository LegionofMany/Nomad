package protocols.voltaire.nomad.wallet

/**
 * Closed-beta send review scenario.
 *
 * This demonstrates the Samourai-style prepare/review boundary while preserving
 * the Nomad rule that requests do not become approvals automatically.
 */
class SendReviewScenario(
    private val walletStateProvider: () -> WalletState,
    private val transferReviewCoordinator: TransferReviewCoordinator
) {
    fun prepareDemoManualTransfer(): WalletTransferReview {
        val walletState = walletStateProvider()
        val account = walletState.selectedAccount() ?: walletState.accounts.first()

        return transferReviewCoordinator.prepareReview(
            WalletTransferRequest(
                accountId = account.accountId,
                destination = "nomad_demo_destination_manual",
                amount = "12.50",
                assetSymbol = account.balance.assetSymbol,
                network = account.network,
                memo = "Closed beta manual send review",
                source = WalletTransferSource.MANUAL
            )
        )
    }

    fun prepareDemoQrTransfer(): WalletTransferReview {
        val walletState = walletStateProvider()
        val account = walletState.selectedAccount() ?: walletState.accounts.first()

        return transferReviewCoordinator.prepareReview(
            WalletTransferRequest(
                accountId = account.accountId,
                destination = "nomad_demo_destination_qr",
                amount = "8.25",
                assetSymbol = account.balance.assetSymbol,
                network = account.network,
                memo = "Closed beta QR send review",
                source = WalletTransferSource.QR
            )
        )
    }

    fun prepareDemoNfcTransfer(): WalletTransferReview {
        val walletState = walletStateProvider()
        val account = walletState.selectedAccount() ?: walletState.accounts.first()

        return transferReviewCoordinator.prepareReview(
            WalletTransferRequest(
                accountId = account.accountId,
                destination = "nomad_demo_destination_nfc",
                amount = "18.75",
                assetSymbol = account.balance.assetSymbol,
                network = account.network,
                memo = "Closed beta NFC request review",
                source = WalletTransferSource.NFC
            )
        )
    }

    fun approveDemoReview(reviewId: String, ownerApprovalId: String): WalletTransferApprovalResult {
        return transferReviewCoordinator.approveReviewedTransfer(
            reviewId = reviewId,
            ownerApprovalId = ownerApprovalId
        )
    }

    fun denyDemoReview(reviewId: String, reason: String): WalletTransferApprovalResult {
        return transferReviewCoordinator.denyReviewedTransfer(
            reviewId = reviewId,
            reason = reason
        )
    }
}
