package protocols.voltaire.nomad.travel

/**
 * TravelPocket is a capped spending pocket used during Travel Mode.
 *
 * The main wallet should not be exposed directly to NFC travel spending.
 * A travel pocket represents a user-visible, prefunded allowance that can be
 * reviewed and limited before travel payments are approved.
 */
data class TravelPocket(
    val pocketId: String,
    val regionCode: String,
    val assetSymbol: String,
    val availableAmount: String,
    val dailyLimit: String,
    val tripLimit: String,
    val spentToday: String,
    val spentThisTrip: String,
    val enabled: Boolean,
    val expiresAtIso: String? = null
)

data class TravelPocketFundingRequest(
    val regionCode: String,
    val assetSymbol: String,
    val amount: String,
    val dailyLimit: String,
    val tripLimit: String,
    val expiresAtIso: String? = null
)

data class TravelPocketDebitRequest(
    val pocketId: String,
    val amount: String,
    val merchantLabel: String?,
    val requestId: String
)

data class TravelPocketResult(
    val accepted: Boolean,
    val pocket: TravelPocket?,
    val message: String
)
