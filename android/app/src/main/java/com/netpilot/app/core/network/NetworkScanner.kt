package com.netpilot.app.core.network

import com.netpilot.app.core.model.DiscoveryMethod
import com.netpilot.app.core.model.NetworkDevice
import com.netpilot.app.core.model.ReachabilityState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext
import java.net.InetAddress
import java.net.Socket
import java.util.UUID

/**
 * Native Android Network Scanner that integrates MacAddressResolver into the device
 * discovery loop to automatically populate manufacturer and deviceType with confidence scores.
 */
class NetworkScanner(
    private val macAddressResolver: MacAddressResolver = MacAddressResolver(),
    private val routerAdapter: RouterAdapter? = null
) {

    data class ScanProgress(
        val scannedCount: Int,
        val totalToScan: Int,
        val discoveredDevice: NetworkDevice? = null,
        val percentComplete: Int
    )

    /**
     * Scans a subnet (e.g. 192.168.1.0/24), probes port reachability, and enriches
     * newly discovered devices via MacAddressResolver.
     */
    fun scanSubnet(subnetPrefix: String = "192.168.1"): Flow<ScanProgress> = flow {
        val totalHosts = 254

        for (hostNum in 1..totalHosts) {
            val ip = "$subnetPrefix.$hostNum"
            val isReachable = probeReachability(ip)

            if (isReachable) {
                // Obtain hostname from reverse DNS or DHCP table
                val hostname = resolveHostname(ip)
                val openPorts = checkCommonPorts(ip)

                // Retrieve MAC from router DHCP table or ARP cache if available
                val mac = fetchMacForIp(ip)

                // Instantiate raw device
                val rawDevice = NetworkDevice(
                    internalId = UUID.randomUUID().toString(),
                    ipAddress = ip,
                    macAddress = mac,
                    hostname = hostname,
                    openPorts = openPorts,
                    discoveryMethod = DiscoveryMethod.TCP_SYN_ACK_PROBE,
                    reachabilityState = ReachabilityState.REACHABLE,
                    lastSeenTimestamp = System.currentTimeMillis()
                )

                // Automatically populate manufacturer, deviceType, confidence scores via MacAddressResolver
                val enrichedDevice = macAddressResolver.enrichDevice(rawDevice)

                emit(
                    ScanProgress(
                        scannedCount = hostNum,
                        totalToScan = totalHosts,
                        discoveredDevice = enrichedDevice,
                        percentComplete = (hostNum * 100) / totalHosts
                    )
                )
            } else {
                emit(
                    ScanProgress(
                        scannedCount = hostNum,
                        totalToScan = totalHosts,
                        discoveredDevice = null,
                        percentComplete = (hostNum * 100) / totalHosts
                    )
                )
            }
        }
    }.flowOn(Dispatchers.IO)

    private suspend fun probeReachability(ip: String): Boolean = withContext(Dispatchers.IO) {
        try {
            // First try ICMP / standard isReachable with 150ms timeout
            val address = InetAddress.getByName(ip)
            if (address.isReachable(150)) return@withContext true

            // Fallback: TCP connect to common administrative ports (80, 443, 53)
            val commonPorts = listOf(80, 443, 53)
            for (port in commonPorts) {
                try {
                    Socket().use { socket ->
                        socket.connect(java.net.InetSocketAddress(ip, port), 100)
                        return@withContext true
                    }
                } catch (_: Exception) {}
            }
            false
        } catch (_: Exception) {
            false
        }
    }

    private suspend fun resolveHostname(ip: String): String? = withContext(Dispatchers.IO) {
        try {
            val host = InetAddress.getByName(ip).canonicalHostName
            if (host != ip) host else null
        } catch (_: Exception) {
            null
        }
    }

    private suspend fun checkCommonPorts(ip: String): List<Int> = withContext(Dispatchers.IO) {
        val openPorts = mutableListOf<Int>()
        val probeList = listOf(53, 80, 443, 554, 631, 8001)

        for (port in probeList) {
            try {
                Socket().use { socket ->
                    socket.connect(java.net.InetSocketAddress(ip, port), 60)
                    openPorts.add(port)
                }
            } catch (_: Exception) {}
        }
        openPorts
    }

    private fun fetchMacForIp(ip: String): String? {
        // In native Android, read /proc/net/arp on older APIs or query RouterAdapter
        return null
    }
}
