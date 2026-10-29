package protocols.voltaire.nomad.travel

/**
 * Travel pocket boundary for Nomad Android.
 *
 * The travel pocket protects the main wallet by limiting Travel Mode spending
 * to a user-funded, user-visible allowance.
 */
interface TravelPocketManager {
    suspend fun createOrFundPocket(request: TravelPocketFundingRequest): TravelPocketResult
    suspend fun getActivePocket(regionCode: String, assetSymbol: String): TravelPocket?
    suspend fun listPockets(): List<TravelPocket>
    suspend fun reviewDebit(request: TravelPocketDebitRequest): TravelPocketResult
    suspend fun applyDebit(request: TravelPocketDebitRequest): TravelPocketResult
    suspend fun disablePocket(pocketId: String): TravelPocketResult
}
