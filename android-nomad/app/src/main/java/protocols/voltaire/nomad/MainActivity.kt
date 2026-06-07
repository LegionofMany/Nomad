package protocols.voltaire.nomad

import android.app.Activity
import android.os.Bundle
import android.widget.LinearLayout
import android.widget.TextView
import protocols.voltaire.nomad.beta.BetaMode
import protocols.voltaire.nomad.beta.CapabilityFlags
import protocols.voltaire.nomad.di.NomadServiceContainer

/**
 * Nomad Android development entry screen.
 *
 * This screen intentionally avoids production wallet calls until the native
 * Android build is fully activated with audited dependencies.
 */
class MainActivity : Activity() {
    private val services = NomadServiceContainer()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val dashboard = services.walletDashboardController.build()
        val sendReview = services.sendReviewScenario.prepareDemoNfcTransfer()
        val ownerReview = services.ownerConfirmationReviewController.build(sendReview)

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 64, 32, 32)
        }

        val title = TextView(this).apply {
            text = "Nomad Wallet\nVoltaire Protocols"
            textSize = 24f
        }

        val status = TextView(this).apply {
            textSize = 16f
            setPadding(0, 24, 0, 0)
            text = buildString {
                appendLine("Android-native Nomad wallet dashboard")
                appendLine("Foundation: Samourai-inspired wallet architecture")
                appendLine("Upgrade layer: Clock Unlock, Travel Mode, Blockpages411 safety")
                appendLine()
                appendLine("Phase: ${dashboard.phaseLabel}")
                appendLine("Safety: ${dashboard.safetyStatus}")
                appendLine()
                appendLine("Selected account")
                appendLine("- ${dashboard.selectedAccount.label}")
                appendLine("- Network: ${dashboard.selectedAccount.network}")
                appendLine("- Balance: ${dashboard.selectedAccount.available} ${dashboard.selectedAccount.assetSymbol}")
                appendLine("- Pending: ${dashboard.selectedAccount.pending}")
                dashboard.selectedAccount.fiatEstimate?.let { appendLine("- Estimate: $it") }
                appendLine()
                appendLine("Receive address")
                appendLine("- ${dashboard.receiveAddress.address}")
                appendLine("- Index: ${dashboard.receiveAddress.addressIndex}")
                dashboard.receiveAddress.warning?.let { appendLine("- Warning: $it") }
                appendLine()
                appendLine("Demo send review")
                appendLine("- Source: ${sendReview.request.source}")
                appendLine("- Destination: ${sendReview.request.destination}")
                appendLine("- Amount: ${sendReview.request.amount} ${sendReview.request.assetSymbol}")
                appendLine("- Network: ${sendReview.request.network.displayName}")
                appendLine("- Fee estimate: ${sendReview.estimatedFee}")
                appendLine("- Owner confirmation required: ${sendReview.requiresOwnerConfirmation}")
                appendLine("- Warnings:")
                sendReview.warnings.forEach { warning -> appendLine("  - $warning") }
                appendLine()
                appendLine("Owner confirmation boundary")
                appendLine("- Review id: ${ownerReview.reviewId}")
                appendLine("- Title: ${ownerReview.title}")
                appendLine("- Approve action: ${ownerReview.approveAction.label} / ${if (ownerReview.approveAction.enabled) "enabled" else "locked"}")
                appendLine("- Deny action: ${ownerReview.denyAction.label} / ${if (ownerReview.denyAction.enabled) "enabled" else "locked"}")
                appendLine("- Boundary warnings:")
                ownerReview.warnings.forEach { warning -> appendLine("  - $warning") }
                appendLine()
                appendLine("Quick actions")
                dashboard.quickActions.forEach { action ->
                    appendLine("- ${action.label}: ${if (action.enabled) "enabled" else "locked"}")
                }
                appendLine()
                appendLine("Beta warnings")
                dashboard.betaWarnings.forEach { warning -> appendLine("- $warning") }
                appendLine()
                appendLine(BetaMode.statusText())
                appendLine()
                appendLine(CapabilityFlags.statusText())
                appendLine()
                append(services.developmentSafetyReport.toDisplayText())
            }
        }

        layout.addView(title)
        layout.addView(status)
        setContentView(layout)
    }
}
