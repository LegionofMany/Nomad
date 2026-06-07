package protocols.voltaire.nomad.ui

/**
 * UI-safe owner confirmation model.
 *
 * This model exists so Nomad can show the owner exactly what is being requested
 * before any approval is recorded. It carries display data only and does not
 * contain signing material.
 */
data class OwnerConfirmationReviewModel(
    val reviewId: String,
    val title: String,
    val source: String,
    val destination: String,
    val amount: String,
    val assetSymbol: String,
    val network: String,
    val estimatedFee: String,
    val requiresOwnerConfirmation: Boolean,
    val warnings: List<String>,
    val approveAction: OwnerConfirmationAction,
    val denyAction: OwnerConfirmationAction
)

data class OwnerConfirmationAction(
    val id: String,
    val label: String,
    val enabled: Boolean,
    val description: String
)
