package protocols.voltaire.nomad.travel

/**
 * Resolves the preferred regional stable-value asset for a travel location.
 *
 * These symbols are capability placeholders while Nomad is in closed beta. A
 * production release must replace this resolver with audited asset, issuer,
 * jurisdiction, liquidity, and compliance metadata.
 */
class RegionalStableAssetResolver {
    fun resolve(countryCode: String): RegionalStableAsset {
        val normalized = countryCode.trim().uppercase()
        return regionalAssets.firstOrNull { asset -> normalized in asset.countryCodes }
            ?: fallbackAsset(normalized)
    }

    fun allSupportedAssets(): List<RegionalStableAsset> = regionalAssets

    private fun fallbackAsset(countryCode: String): RegionalStableAsset {
        return RegionalStableAsset(
            regionLabel = "Global travel fallback",
            countryCodes = setOf(countryCode),
            assetSymbol = "USDC",
            displayName = "USD stable-value fallback",
            betaStatus = RegionalStableAssetStatus.PENDING_SANDBOX,
            notes = "Fallback asset for locations without a configured regional stablecoin."
        )
    }

    private val regionalAssets: List<RegionalStableAsset> = listOf(
        RegionalStableAsset(
            regionLabel = "Canada",
            countryCodes = setOf("CA", "CAN"),
            assetSymbol = "CADC",
            displayName = "Canadian dollar stable-value asset",
            betaStatus = RegionalStableAssetStatus.PENDING_SANDBOX,
            notes = "Used for Canadian travel-mode testing."
        ),
        RegionalStableAsset(
            regionLabel = "United States",
            countryCodes = setOf("US", "USA"),
            assetSymbol = "USDC",
            displayName = "US dollar stable-value asset",
            betaStatus = RegionalStableAssetStatus.PENDING_SANDBOX,
            notes = "Default North American travel fallback."
        ),
        RegionalStableAsset(
            regionLabel = "United Kingdom",
            countryCodes = setOf("GB", "UK", "LONDON"),
            assetSymbol = "GBPT",
            displayName = "British pound stable-value asset",
            betaStatus = RegionalStableAssetStatus.PENDING_SANDBOX,
            notes = "Used for UK and London examples."
        ),
        RegionalStableAsset(
            regionLabel = "European Union",
            countryCodes = setOf("EU", "EUR", "FR", "DE", "ES", "IT", "NL", "BE", "PT", "IE", "AT", "FI", "GR"),
            assetSymbol = "EUROC",
            displayName = "Euro stable-value asset",
            betaStatus = RegionalStableAssetStatus.PENDING_SANDBOX,
            notes = "Used for Eurozone travel-mode testing."
        ),
        RegionalStableAsset(
            regionLabel = "Australia",
            countryCodes = setOf("AU", "AUS"),
            assetSymbol = "AUDD",
            displayName = "Australian dollar stable-value asset",
            betaStatus = RegionalStableAssetStatus.PENDING_SANDBOX,
            notes = "Used for Australian travel-mode testing."
        ),
        RegionalStableAsset(
            regionLabel = "United Arab Emirates",
            countryCodes = setOf("AE", "UAE", "DXB"),
            assetSymbol = "AED_STABLE",
            displayName = "UAE dirham stable-value asset",
            betaStatus = RegionalStableAssetStatus.PENDING_SANDBOX,
            notes = "Used for UAE travel-mode testing."
        ),
        RegionalStableAsset(
            regionLabel = "Japan",
            countryCodes = setOf("JP", "JPN"),
            assetSymbol = "JPYC",
            displayName = "Japanese yen stable-value asset",
            betaStatus = RegionalStableAssetStatus.PENDING_SANDBOX,
            notes = "Used for Japan travel-mode testing."
        ),
        RegionalStableAsset(
            regionLabel = "Singapore",
            countryCodes = setOf("SG", "SGP"),
            assetSymbol = "XSGD",
            displayName = "Singapore dollar stable-value asset",
            betaStatus = RegionalStableAssetStatus.PENDING_SANDBOX,
            notes = "Used for Singapore travel-mode testing."
        ),
        RegionalStableAsset(
            regionLabel = "Mexico",
            countryCodes = setOf("MX", "MEX"),
            assetSymbol = "MXN_STABLE",
            displayName = "Mexican peso stable-value asset",
            betaStatus = RegionalStableAssetStatus.PENDING_SANDBOX,
            notes = "Used for Mexico travel-mode testing."
        ),
        RegionalStableAsset(
            regionLabel = "Brazil",
            countryCodes = setOf("BR", "BRA"),
            assetSymbol = "BRL_STABLE",
            displayName = "Brazilian real stable-value asset",
            betaStatus = RegionalStableAssetStatus.PENDING_SANDBOX,
            notes = "Used for Brazil travel-mode testing."
        ),
        RegionalStableAsset(
            regionLabel = "South Africa",
            countryCodes = setOf("ZA", "ZAF"),
            assetSymbol = "ZAR_STABLE",
            displayName = "South African rand stable-value asset",
            betaStatus = RegionalStableAssetStatus.PENDING_SANDBOX,
            notes = "Used for South Africa travel-mode testing."
        )
    )
}

data class RegionalStableAsset(
    val regionLabel: String,
    val countryCodes: Set<String>,
    val assetSymbol: String,
    val displayName: String,
    val betaStatus: RegionalStableAssetStatus,
    val notes: String
)

enum class RegionalStableAssetStatus {
    PENDING_SANDBOX,
    TESTNET_READY,
    PRODUCTION_LOCKED,
    PRODUCTION_READY
}
