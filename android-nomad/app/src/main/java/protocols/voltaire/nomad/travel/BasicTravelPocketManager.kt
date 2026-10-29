package protocols.voltaire.nomad.travel

import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

/**
 * Development implementation of TravelPocketManager.
 *
 * Uses local memory only. Production versions must connect to audited wallet
 * accounting and secure storage.
 */
class BasicTravelPocketManager : TravelPocketManager {
    private val pockets = mutableMapOf<String, TravelPocket>()

    override suspend fun createOrFundPocket(request: TravelPocketFundingRequest): TravelPocketResult {
        val amount = parseAmount(request.amount)
        val dailyLimit = parseAmount(request.dailyLimit)
        val tripLimit = parseAmount(request.tripLimit)

        if (amount <= BigDecimal.ZERO) {
            return TravelPocketResult(false, null, "Funding amount must be greater than zero.")
        }

        if (dailyLimit <= BigDecimal.ZERO || tripLimit <= BigDecimal.ZERO) {
            return TravelPocketResult(false, null, "Spending limits must be greater than zero.")
        }

        if (dailyLimit > tripLimit) {
            return TravelPocketResult(false, null, "Daily limit cannot exceed trip limit.")
        }

        val existing = getActivePocket(request.regionCode, request.assetSymbol)
        val pocket = if (existing == null) {
            TravelPocket(
                pocketId = UUID.randomUUID().toString(),
                regionCode = request.regionCode.uppercase(),
                assetSymbol = request.assetSymbol.uppercase(),
                availableAmount = amount.toPlainString(),
                dailyLimit = dailyLimit.toPlainString(),
                tripLimit = tripLimit.toPlainString(),
                spentToday = "0",
                spentThisTrip = "0",
                enabled = true,
                expiresAtIso = request.expiresAtIso ?: Instant.now().plusSeconds(60L * 60L * 24L * 14L).toString()
            )
        } else {
            existing.copy(
                availableAmount = parseAmount(existing.availableAmount).plus(amount).toPlainString(),
                dailyLimit = dailyLimit.toPlainString(),
                tripLimit = tripLimit.toPlainString(),
                enabled = true,
                expiresAtIso = request.expiresAtIso ?: existing.expiresAtIso
            )
        }

        pockets[pocket.pocketId] = pocket
        return TravelPocketResult(true, pocket, "Travel pocket funded.")
    }

    override suspend fun getActivePocket(regionCode: String, assetSymbol: String): TravelPocket? {
        return pockets.values.firstOrNull {
            it.enabled &&
                it.regionCode.equals(regionCode, ignoreCase = true) &&
                it.assetSymbol.equals(assetSymbol, ignoreCase = true)
        }
    }

    override suspend fun listPockets(): List<TravelPocket> = pockets.values.toList()

    override suspend fun reviewDebit(request: TravelPocketDebitRequest): TravelPocketResult {
        val pocket = pockets[request.pocketId]
            ?: return TravelPocketResult(false, null, "Travel pocket not found.")

        if (!pocket.enabled) {
            return TravelPocketResult(false, pocket, "Travel pocket is disabled.")
        }

        val amount = parseAmount(request.amount)
        if (amount <= BigDecimal.ZERO) {
            return TravelPocketResult(false, pocket, "Payment amount must be greater than zero.")
        }

        val available = parseAmount(pocket.availableAmount)
        val spentToday = parseAmount(pocket.spentToday)
        val spentTrip = parseAmount(pocket.spentThisTrip)
        val dailyLimit = parseAmount(pocket.dailyLimit)
        val tripLimit = parseAmount(pocket.tripLimit)

        if (amount > available) {
            return TravelPocketResult(false, pocket, "Payment exceeds available Travel Pocket balance.")
        }

        if (spentToday.plus(amount) > dailyLimit) {
            return TravelPocketResult(false, pocket, "Payment exceeds daily Travel Pocket limit.")
        }

        if (spentTrip.plus(amount) > tripLimit) {
            return TravelPocketResult(false, pocket, "Payment exceeds trip Travel Pocket limit.")
        }

        return TravelPocketResult(true, pocket, "Travel Pocket debit can be approved by owner.")
    }

    override suspend fun applyDebit(request: TravelPocketDebitRequest): TravelPocketResult {
        val review = reviewDebit(request)
        if (!review.accepted || review.pocket == null) return review

        val pocket = review.pocket
        val amount = parseAmount(request.amount)
        val updated = pocket.copy(
            availableAmount = parseAmount(pocket.availableAmount).minus(amount).toPlainString(),
            spentToday = parseAmount(pocket.spentToday).plus(amount).toPlainString(),
            spentThisTrip = parseAmount(pocket.spentThisTrip).plus(amount).toPlainString()
        )

        pockets[updated.pocketId] = updated
        return TravelPocketResult(true, updated, "Travel Pocket debit applied after owner approval.")
    }

    override suspend fun disablePocket(pocketId: String): TravelPocketResult {
        val pocket = pockets[pocketId]
            ?: return TravelPocketResult(false, null, "Travel pocket not found.")
        val updated = pocket.copy(enabled = false)
        pockets[pocketId] = updated
        return TravelPocketResult(true, updated, "Travel pocket disabled.")
    }

    private fun parseAmount(raw: String): BigDecimal {
        return raw.trim().ifBlank { "0" }.toBigDecimal()
    }
}
