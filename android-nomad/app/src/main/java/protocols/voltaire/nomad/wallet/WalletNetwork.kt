package protocols.voltaire.nomad.wallet

/**
 * Supported wallet networks for the Nomad development architecture.
 *
 * This model is intentionally small while the app is in closed beta. Production
 * support must be added through audited network adapters.
 */
enum class WalletNetwork(
    val displayName: String,
    val defaultAssetSymbol: String
) {
    BITCOIN("Bitcoin", "BTC"),
    ETHEREUM("Ethereum", "ETH"),
    HEDERA("Hedera", "HBAR"),
    EVM_TESTNET("EVM Testnet", "TEST"),
    STABLE_SANDBOX("Stablecoin Sandbox", "TEST_USD")
}
