package protocols.voltaire.nomad.travel

/**
 * A TravelPaymentIntent represents a payment request detected during Travel Mode.
 *
 * NFC or QR can create an intent, but it must not move value by itself. The
 * wallet owner must review and approve the intent before any transfer proceeds.
 */
data class TravelPaymentIntent(
    val requestId: String,
    val merchantLabel: String?,
    val destination: String,
    val regionCode: String,
    val assetSymbol: String,
    val amount: String,
    val network: String,
    val source: TravelPaymentSource,
    val createdAtIso: String
)

enum class TravelPaymentSource {
    NFC,
    QR,
    MANUAL
}

data class TravelPaymentReview(
    val intent: TravelPaymentIntent,
    val title: String,
    val summary: String,
    val warnings: List<String>,
    val ownerApprovalRequired: Boolean = true
)
