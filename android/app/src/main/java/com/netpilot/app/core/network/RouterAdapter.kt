package com.netpilot.app.core.network

import com.netpilot.app.core.model.OperationResult
import com.netpilot.app.core.model.RouterCapabilities
import com.netpilot.app.core.model.RouterConnectionState
import com.netpilot.app.core.model.RouterDevice
import com.netpilot.app.core.model.RouterPolicy
import kotlinx.coroutines.flow.StateFlow

/**
 * Pluggable interface for router integrations.
 * Every implementation MUST discover capabilities, verify applied state, and report unsupported operations.
 */
interface RouterAdapter {
    val connectionState: StateFlow<RouterConnectionState>
    val capabilities: StateFlow<RouterCapabilities>

    suspend fun authenticate(endpointUrl: String, credentials: RouterCredentials): OperationResult<Boolean>
    suspend fun disconnect()

    suspend fun getDeviceInventory(): OperationResult<List<RouterDevice>>
    suspend fun pauseInternet(targetMac: String, durationMinutes: Int? = null): OperationResult<RouterPolicy>
    suspend fun resumeInternet(targetMac: String): OperationResult<Boolean>
    suspend fun blockDeviceFromLan(targetMac: String): OperationResult<RouterPolicy>
    suspend fun unblockDevice(targetMac: String): OperationResult<Boolean>
    suspend fun getActivePolicies(): OperationResult<List<RouterPolicy>>
    suspend fun verifyPolicyApplied(policyId: String): OperationResult<Boolean>
}

data class RouterCredentials(
    val username: String,
    val password: String? = null,
    val token: String? = null,
    val sslCertificatePinnedSha256: String? = null
)
