package protocols.voltaire.nomad.security

/**
 * Development-only secure storage implementation.
 *
 * This class is intentionally not production safe. It exists so the Android
 * scaffold can be wired and tested before Android Keystore integration is added.
 */
class InMemorySecureStorageGateway : SecureStorageGateway {
    private val values = mutableMapOf<SecureStorageKey, String>()

    override suspend fun putString(key: SecureStorageKey, value: String) {
        values[key] = value
    }

    override suspend fun getString(key: SecureStorageKey): String? {
        return values[key]
    }

    override suspend fun remove(key: SecureStorageKey) {
        values.remove(key)
    }

    override suspend fun clearWalletScopedValues() {
        values.remove(SecureStorageKey.WALLET_META)
        values.remove(SecureStorageKey.ENCRYPTED_SEED)
        values.remove(SecureStorageKey.UNLOCK_TIME)
        values.remove(SecureStorageKey.LOCKOUT_STATE)
        values.remove(SecureStorageKey.TRAVEL_STATE)
    }

    override fun isProductionSafe(): Boolean = false
}
