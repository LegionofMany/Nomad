package protocols.voltaire.nomad.wallet

import java.time.Instant
import java.util.UUID

/**
 * Development-only wallet engine for Nomad Android wiring.
 *
 * This class does not create production wallet material. It exists so the
 * native Android flow can be exercised while the real wallet engine is rebuilt
 * from audited components.
 */
class DevelopmentWalletEngine : WalletEngine {
    private var account: WalletAccount? = null

    override suspend fun createWallet(): WalletAccount {
        val created = WalletAccount(
            id = UUID.randomUUID().toString(),
            label = "Nomad Demo Account",
            primaryAddress = "nomad_demo_${UUID.randomUUID().toString().replace("-", "").take(24)}",
            network = "NOMAD_DEVNET",
            createdAtIso = Instant.now().toString()
        )
        account = created
        return created
    }

    override suspend fun restoreWallet(recoveryPhrase: String): WalletAccount {
        require(recoveryPhrase.trim().split(Regex("\\s+")).size >= 12) {
            "Recovery phrase must contain at least 12 words for the development flow"
        }

        val restored = WalletAccount(
            id = UUID.randomUUID().toString(),
            label = "Restored Nomad Demo Account",
            primaryAddress = "nomad_restored_${UUID.randomUUID().toString().replace("-", "").take(24)}",
            network = "NOMAD_DEVNET",
            createdAtIso = Instant.now().toString()
        )
        account = restored
        return restored
    }

    override suspend fun getActiveAccount(): WalletAccount? = account

    override suspend fun prepareTransfer(request: TransferRequest): PreparedTransfer {
        require(request.destinationAddress.isNotBlank()) { "Destination is required" }
        require(request.amount.isNotBlank()) { "Amount is required" }

        return PreparedTransfer(
            request = request,
            estimatedFee = "0.00 DEV",
            previewText = "Prepare ${request.amount} ${request.assetSymbol} to ${request.destinationAddress} on ${request.network}"
        )
    }

    override suspend fun reviewPreparedTransfer(preparedTransfer: PreparedTransfer): TransferReview {
        val warnings = buildList {
            add("Development preview only")
            add("Production approval flow is not implemented yet")
        }

        return TransferReview(
            humanReadableSummary = preparedTransfer.previewText,
            warnings = warnings,
            requiresExplicitConsent = true
        )
    }
}
