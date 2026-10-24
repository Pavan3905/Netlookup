package com.netpilot.app.core.model

import java.util.UUID

/**
 * Core model representing a discovered device on the local network.
 * Accurately tracks inference confidence and evidence trails.
 *
 * Privacy & Android restrictions:
 * On Android 10+ (API 29+), client devices commonly use randomized MAC addresses
 * (Locally Administered Address bit set: bit 1 of the first byte is 1).
 * NetPilot explicitly flags randomized addresses, notes that physical OUI is obscured,
 * and falls back to DHCP options, mDNS service announcements, or router lease data.
 */
data class NetworkDevice(
    val internalId: String = UUID.randomUUID().toString(),
    val ipAddress: String,
    val macAddress: String? = null,
    val hostname: String? = null,
    val userCustomName: String? = null,
    
    // Inferred Manufacturer & Confidence (0.0 to 1.0)
    val manufacturer: String? = null,
    val manufacturerConfidence: Float = 0.0f,
    
    // Inferred Device Type & Confidence (0.0 to 1.0)
    val deviceType: DeviceType = DeviceType.UNKNOWN,
    val typeConfidence: Float = 0.0f,
    
    // MAC address metadata
    val isRandomizedMac: Boolean = false,
    
    // Detailed evidence trail for forensic transparency
    val inferenceEvidence: List<InferenceEvidence> = emptyList(),
    
    val lastSeenTimestamp: Long = System.currentTimeMillis(),
    val firstSeenTimestamp: Long = System.currentTimeMillis(),
    val discoveryMethod: DiscoveryMethod = DiscoveryMethod.TCP_PROBE,
    val reachabilityState: ReachabilityState = ReachabilityState.REACHABLE,
    val identityConfidence: Float = 0.5f,
    val attributeSources: Map<String, String> = emptyMap(),
    val accessControlState: AccessControlState = AccessControlState.NORMAL,
    val appliedFilterProfileId: String? = null,
    val openPorts: List<Int> = emptyList(),
    val userNotes: String? = null,
    val isKnown: Boolean = false
) {
    val displayName: String
        get() = userCustomName?.takeIf { it.isNotBlank() }
            ?: hostname?.takeIf { it.isNotBlank() }
            ?: manufacturer?.let { "$it Device" }
            ?: "Device at $ipAddress"

    /**
     * Confidence rating bucket for high-level UI badges: HIGH (>= 0.8), MEDIUM (0.5 to 0.79), LOW (< 0.5)
     */
    val confidenceGrade: ConfidenceGrade
        get() = when {
            identityConfidence >= 0.80f -> ConfidenceGrade.HIGH
            identityConfidence >= 0.50f -> ConfidenceGrade.MEDIUM
            else -> ConfidenceGrade.LOW
        }
}

enum class ConfidenceGrade {
    HIGH,
    MEDIUM,
    LOW
}

data class InferenceEvidence(
    val category: String, // e.g. "IEEE OUI", "mDNS Service", "DHCP Client ID", "Open Ports"
    val observedValue: String,
    val derivedInference: String,
    val confidenceWeight: Float
)

enum class DeviceType {
    GATEWAY_ROUTER,
    MOBILE_PHONE,
    LAPTOP_PC,
    SMART_TV,
    IOT_SMART_HOME,
    PRINTER,
    STORAGE_NAS,
    GAMING_CONSOLE,
    UNKNOWN
}

enum class DiscoveryMethod {
    ROUTER_DHCP_TABLE,
    NEIGHBOR_ARP_CACHE,
    MDNS_BONJOUR,
    SSDP_UPNP,
    TCP_SYN_ACK_PROBE,
    MANUAL_ENTRY
}

enum class ReachabilityState {
    REACHABLE,
    UNRESPONSIVE,
    STALE,
    OFFLINE
}

enum class AccessControlState {
    NORMAL,
    INTERNET_PAUSED,
    BLOCKED_FULL_LAN,
    DNS_RESTRICTED,
    SCHEDULE_ACTIVE
}
