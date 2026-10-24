package com.netpilot.app

import com.netpilot.app.core.model.DeviceType
import com.netpilot.app.core.model.NetworkDevice
import com.netpilot.app.core.network.MacAddressResolver
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class MacAddressResolverTest {

    private lateinit var resolver: MacAddressResolver

    @Before
    fun setUp() {
        resolver = MacAddressResolver()
    }

    @Test
    fun testAuthenticGlInetRouterOUI() {
        val result = resolver.resolve(
            macAddress = "04:D9:F5:8B:11:00",
            hostname = "openwrt.lan",
            openPorts = listOf(53, 80, 443)
        )

        assertEquals("GL Technologies (GL.iNet)", result.manufacturer)
        assertTrue("Confidence must be >= 0.95 for direct IEEE OUI match", result.manufacturerConfidence >= 0.95f)
        assertEquals(DeviceType.GATEWAY_ROUTER, result.deviceType)
        assertTrue(result.typeConfidence >= 0.90f)
        assertFalse("Real hardware OUI must not be flagged as randomized", result.isRandomizedMac)
    }

    @Test
    fun testRandomizedMacDampening() {
        // 3A:B2:77 has LAA bit set (bit 1 of 0x3A = 1)
        val result = resolver.resolve(
            macAddress = "3A:B2:77:99:12:0A",
            hostname = "pixel-9-pro.lan"
        )

        assertTrue("Randomized MAC bit must be detected", result.isRandomizedMac)
        // Corroborated with Google from hostname
        assertEquals("Google LLC", result.manufacturer)
        assertEquals(DeviceType.MOBILE_PHONE, result.deviceType)
        assertTrue(result.typeConfidence >= 0.90f)
    }

    @Test
    fun testEnrichDeviceMethod() {
        val rawDevice = NetworkDevice(
            internalId = "test-raw-1",
            ipAddress = "192.168.1.189",
            macAddress = "48:A6:B8:33:41:9C",
            hostname = "lgwebostv.lan",
            openPorts = listOf(8001, 8080)
        )

        val enriched = resolver.enrichDevice(rawDevice)

        assertEquals("LG Electronics", enriched.manufacturer)
        assertEquals(DeviceType.SMART_TV, enriched.deviceType)
        assertTrue(enriched.manufacturerConfidence >= 0.90f)
        assertTrue(enriched.typeConfidence >= 0.90f)
        assertTrue("Evidence list must not be empty", enriched.inferenceEvidence.isNotEmpty())
    }
}
