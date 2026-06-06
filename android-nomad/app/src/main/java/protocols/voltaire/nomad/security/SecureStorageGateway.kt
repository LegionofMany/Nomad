package protocols.voltaire.nomad.security

/**
 * Secure storage boundary for Nomad Android.
 *
 * Production implementations must use OS-backed protected storage where
 * available. Demo or in-memory storage must never be accepted for release
 * builds that can handle real wallet material.
 */
interface SecureStorageGateway {
    suspend fun putString(key: SecureStorageKey, value: String)
    suspend fun getString(key: SecureStorageKey): String?
    suspend fun remove(key: SecureStorageKey)
    suspend fun clearWalletScopedValues()
    fun isProductionSafe(): Boolean
}

enum class SecureStorageKey(val raw: String) {
    WALLET_META("nomad.wallet.meta"),
    ENCRYPTED_SEED("nomad.wallet.encryptedSeed"),
    UNLOCK_TIME("nomad.wallet.unlockTime"),
    LOCKOUT_STATE("nomad.wallet.lockout"),
    TRAVEL_STATE("nomad.wallet.travel"),
    DEVICE_SALT("nomad.device.salt")
}
