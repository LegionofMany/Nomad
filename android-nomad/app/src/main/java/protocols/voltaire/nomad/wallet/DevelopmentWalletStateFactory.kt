package protocols.voltaire.nomad.wallet

import java.time.Instant

/**
 * Creates a closed-beta wallet state for development UI and flow testing.
 *
 * All addresses and balances are placeholders. Do not use with real funds.
 */
object DevelopmentWalletStateFactory {
    fun create(): WalletState {
        return WalletState(
            walletId = "nomad-demo-wallet",
            displayName = "Nomad Demo Wallet",
            createdAt = Instant.EPOCH,
            selectedAccountId = "stable-sandbox-0",
            betaMode = true,
            realFundsEnabled = false,
            accounts = listOf(
                WalletAccountState(
                    accountId = "stable-sandbox-0",
                    label = "Travel Stable Sandbox",
                    network = WalletNetwork.STABLE_SANDBOX,
                    receiveAddress = "nomad_demo_stable_sandbox_0",
                    balance = WalletBalance(
                        assetSymbol = WalletNetwork.STABLE_SANDBOX.defaultAssetSymbol,
                        available = "250.00",
                        pending = "0.00",
                        fiatEstimate = "$250.00 demo"
                    ),
                    addressIndex = 0
                ),
                WalletAccountState(
                    accountId = "hedera-demo-0",
                    label = "Hedera Demo",
                    network = WalletNetwork.HEDERA,
                    receiveAddress = "nomad_demo_hedera_0",
                    balance = WalletBalance(
                        assetSymbol = WalletNetwork.HEDERA.defaultAssetSymbol,
                        available = "100.00",
                        pending = "0.00",
                        fiatEstimate = null
                    ),
                    addressIndex = 0
                ),
                WalletAccountState(
                    accountId = "btc-demo-0",
                    label = "Bitcoin Demo",
                    network = WalletNetwork.BITCOIN,
                    receiveAddress = "nomad_demo_bitcoin_0",
                    balance = WalletBalance(
                        assetSymbol = WalletNetwork.BITCOIN.defaultAssetSymbol,
                        available = "0.01000000",
                        pending = "0.00000000",
                        fiatEstimate = null
                    ),
                    addressIndex = 0
                )
            )
        )
    }
}
