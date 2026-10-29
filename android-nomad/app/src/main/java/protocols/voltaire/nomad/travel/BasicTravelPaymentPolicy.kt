package protocols.voltaire.nomad.travel

/**
 * Development implementation of TravelPaymentPolicy.
 *
 * This enforces the core Nomad rule: payment requests are not approvals. The
 * owner must explicitly confirm every Travel Mode payment.
 */
class BasicTravelPaymentPolicy : TravelPaymentPolicy {
    override suspend fun reviewIntent(
        intent: TravelPaymentIntent,
        travelModeState: TravelModeState
    ): TravelPaymentReview {
        val warnings = mutableListOf<String>()

        if (!travelModeState.enabled) {
            warnings.add("Travel Mode is disabled.")
        }

        if (travelModeState.nfcEnabled) {
            warnings.add("NFC request detected. Review before approving.")
        } else if (intent.source == TravelPaymentSource.NFC) {
            warnings.add("NFC is not enabled for this Travel Mode session.")
        }

        if (travelModeState.preferredStableValueAsset != null &&
            travelModeState.preferredStableValueAsset != intent.assetSymbol
        ) {
            warnings.add("Requested asset differs from preferred travel asset.")
        }

        val cap = travelModeState.spendingCap
        if (cap != null && cap.assetSymbol != intent.assetSymbol) {
            warnings.add("Spending cap is configured for a different asset.")
        }

        return TravelPaymentReview(
            intent = intent,
            title = "Review travel payment",
            summary = "${intent.amount} ${intent.assetSymbol} to ${intent.merchantLabel ?: intent.destination} on ${intent.network}",
            warnings = warnings,
            ownerApprovalRequired = true
        )
    }

    override suspend fun canOwnerApprove(review: TravelPaymentReview): OwnerApprovalDecision {
        val blockingWarning = review.warnings.firstOrNull { warning ->
            warning.contains("disabled", ignoreCase = true) ||
                warning.contains("not enabled", ignoreCase = true)
        }

        if (blockingWarning != null) {
            return OwnerApprovalDecision(
                allowed = false,
                reason = blockingWarning
            )
        }

        return OwnerApprovalDecision(
            allowed = true,
            reason = "Owner confirmation required before payment can proceed.",
            requiredConfirmation = OwnerConfirmationMethod.CLOCK_UNLOCK
        )
    }
}
