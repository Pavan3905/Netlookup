package com.netpilot.app.core.network

import com.netpilot.app.core.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID

/**
 * Deterministic MockRouterAdapter for UI development, previews, and CI testing.
 * Accurately simulates capabilities, authentication states, and verification steps.
 */
class MockRouterAdapter : RouterAdapter {

    private val _connectionState = MutableStateFlow(RouterConnectionState.DISCONNECTED)
    override val connectionState: StateFlow<RouterConnectionState> = _connectionState.asStateFlow()

    private val _capabilities = MutableStateFlow(
        RouterCapabilities(
            supportsPauseInternet = true,
            supportsLanBlock = true,
            supportsMacFiltering = true,
            supportsDnsFiltering = true,
            supportsScheduledPolicies = true,
            supportsRealTimeDeviceInventory = true,
            supportsPerClientRateLimit = false,
            brandName = "NetPilot Reference Lab Router (Simulated OpenWrt 23.05)",
            firmwareVersion = "OpenWrt 23.05.2 r23630",
            authMechanism = AuthMechanism.UBUS_JSON_RPC
        )
    )
    override val capabilities: StateFlow<RouterCapabilities> = _capabilities.asStateFlow()

    private val activePolicies = mutableMapOf<String, RouterPolicy>()

    override suspend fun authenticate(endpointUrl: String, credentials: RouterCredentials): OperationResult<Boolean> {
        _connectionState.value = RouterConnectionState.CONNECTING
        if (credentials.username.isBlank()) {
            _connectionState.value = RouterConnectionState.AUTH_FAILED
            return OperationResult.Failure(
                AdapterError(ErrorCode.AUTH_INVALID_CREDENTIALS, "Username cannot be empty", canRetrySafely = true)
            )
        }

        _connectionState.value = RouterConnectionState.AUTHENTICATED
        return OperationResult.Success(data = true, verified = true, message = "Authenticated with Mock OpenWrt ubus")
    }

    override suspend fun disconnect() {
        _connectionState.value = RouterConnectionState.DISCONNECTED
    }

    override suspend fun getDeviceInventory(): OperationResult<List<RouterDevice>> {
        val sampleDevices = listOf(
            RouterDevice("192.168.1.1", "00:11:22:33:44:55", "openwrt.lan", null, "br-lan"),
            RouterDevice("192.168.1.102", "3A:B2:77:99:12:0A", "pixel-9-pro.lan", 42300, "br-lan"),
            RouterDevice("192.168.1.144", "B4:FB:E4:31:8C:99", "macbook-air-m2.lan", 85000, "br-lan"),
            RouterDevice("192.168.1.189", "68:C6:3A:42:11:F2", "living-room-tv.lan", 86400, "br-lan")
        )
        return OperationResult.Success(data = sampleDevices, verified = true)
    }

    override suspend fun pauseInternet(targetMac: String, durationMinutes: Int?): OperationResult<RouterPolicy> {
        val policyId = UUID.randomUUID().toString()
        val expiresAt = durationMinutes?.let { System.currentTimeMillis() + it * 60 * 1000L }
        val policy = RouterPolicy(
            policyId = policyId,
            targetMacOrIp = targetMac,
            policyType = PolicyType.INTERNET_PAUSE,
            appliedTimestamp = System.currentTimeMillis(),
            expiresAtTimestamp = expiresAt,
            verifiedOnRouter = true,
            uciRuleName = "firewall.drop_wan_$targetMac"
        )
        activePolicies[targetMac] = policy
        return OperationResult.Success(data = policy, verified = true, message = "WAN forward rejected for $targetMac")
    }

    override suspend fun resumeInternet(targetMac: String): OperationResult<Boolean> {
        activePolicies.remove(targetMac)
        return OperationResult.Success(data = true, verified = true, message = "Internet resumed for $targetMac")
    }

    override suspend fun blockDeviceFromLan(targetMac: String): OperationResult<RouterPolicy> {
        val policyId = UUID.randomUUID().toString()
        val policy = RouterPolicy(
            policyId = policyId,
            targetMacOrIp = targetMac,
            policyType = PolicyType.FULL_LAN_BLOCK,
            appliedTimestamp = System.currentTimeMillis(),
            verifiedOnRouter = true,
            uciRuleName = "ebtables.drop_lan_$targetMac"
        )
        activePolicies[targetMac] = policy
        return OperationResult.Success(data = policy, verified = true, message = "Device isolated from LAN and WAN")
    }

    override suspend fun unblockDevice(targetMac: String): OperationResult<Boolean> {
        activePolicies.remove(targetMac)
        return OperationResult.Success(data = true, verified = true, message = "Device unblocked")
    }

    override suspend fun getActivePolicies(): OperationResult<List<RouterPolicy>> {
        return OperationResult.Success(data = activePolicies.values.toList(), verified = true)
    }

    override suspend fun verifyPolicyApplied(policyId: String): OperationResult<Boolean> {
        val exists = activePolicies.values.any { it.policyId == policyId }
        return OperationResult.Success(data = exists, verified = true)
    }
}
