package com.netpilot.app.core.model

/**
 * Granular capability matrix discovered from an authenticated router.
 * NetPilot uses this to dynamically enable, disable, or adapt management controls.
 */
data class RouterCapabilities(
    val supportsPauseInternet: Boolean = false,
    val supportsLanBlock: Boolean = false,
    val supportsMacFiltering: Boolean = false,
    val supportsDnsFiltering: Boolean = false,
    val supportsScheduledPolicies: Boolean = false,
    val supportsRealTimeDeviceInventory: Boolean = false,
    val supportsPerClientRateLimit: Boolean = false,
    val supportsGuestNetworkIsolation: Boolean = false,
    val brandName: String = "Generic / Unknown Gateway",
    val modelName: String? = null,
    val firmwareVersion: String? = null,
    val kernelVersion: String? = null,
    val firewallEngine: FirewallEngine = FirewallEngine.UNKNOWN,
    val authMechanism: AuthMechanism = AuthMechanism.UBUS_JSON_RPC,
    val discoveredAtTimestamp: Long = System.currentTimeMillis(),
    val unsupportedReasons: Map<String, String> = emptyMap()
) {
    /**
     * Returns true if the router provides baseline management capabilities (inventory + pause or block).
     */
    val isManageable: Boolean
        get() = supportsRealTimeDeviceInventory && (supportsPauseInternet || supportsLanBlock)
}

enum class FirewallEngine {
    NFTABLES,   // OpenWrt 22.03+ default (fw4)
    IPTABLES,   // OpenWrt 21.02 and older (fw3)
    EBTABLES,   // Linux bridge filtering
    UNKNOWN
}

enum class AuthMechanism {
    UBUS_JSON_RPC,      // OpenWrt default rpcd ubus
    LUCI_RPC,           // LuCI RPC module
    SSH_AUTHORIZED_KEY, // SSH shell with public key
    REST_API,           // Vendor proprietary REST
    UNSUPPORTED
}

enum class RouterConnectionState {
    DISCONNECTED,
    CONNECTING,
    AUTHENTICATED,
    AUTH_FAILED,
    UNREACHABLE,
    CAPABILITY_DISCOVERY_IN_PROGRESS,
    CAPABILITY_MISMATCH
}

data class RouterDevice(
    val ip: String,
    val mac: String,
    val hostname: String?,
    val leaseExpiresInSeconds: Long?,
    val interfaceName: String = "br-lan"
)

data class RouterPolicy(
    val policyId: String,
    val targetMacOrIp: String,
    val policyType: PolicyType,
    val appliedTimestamp: Long,
    val expiresAtTimestamp: Long? = null,
    val verifiedOnRouter: Boolean = false,
    val uciRuleName: String? = null,
    val statusExplanation: String? = null
)

enum class PolicyType {
    INTERNET_PAUSE,
    FULL_LAN_BLOCK,
    DNS_SINKHOLE,
    SCHEDULED_QUOTA,
    BANDWIDTH_THROTTLE
}

sealed class OperationResult<out T> {
    data class Success<out T>(val data: T, val verified: Boolean, val message: String? = null) : OperationResult<T>()
    data class PartialSuccess<out T>(val data: T, val warning: String) : OperationResult<T>()
    data class Unsupported(val reason: String, val alternativeSuggestion: String? = null) : OperationResult<Nothing>()
    data class Failure(val error: AdapterError) : OperationResult<Nothing>()
}

data class AdapterError(
    val code: ErrorCode,
    val message: String,
    val canRetrySafely: Boolean,
    val technicalDetails: String? = null
)

enum class ErrorCode {
    AUTH_INVALID_CREDENTIALS,
    ROUTER_UNREACHABLE,
    TIMEOUT,
    UCI_COMMIT_FAILED,
    FIREWALL_RELOAD_FAILED,
    PERMISSION_DENIED,
    UNSUPPORTED_FIRMWARE,
    CAPABILITY_DISCOVERY_FAILED
}
