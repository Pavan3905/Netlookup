package com.netpilot.app

import com.netpilot.app.core.model.DeviceType
import com.netpilot.app.core.network.OuiLookupService
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class OuiLookupServiceTest {

    private lateinit var service: OuiLookupService

    @Before
    fun setUp() {
        service = OuiLookupService()
    }

    @Test
    fun testAuthenticAppleOuiLookup() {
        // Apple MAC prefix: F0:18:98
        val result = service.inferDevice(
            macAddress = "F0:18:98:C1:22:98",
            hostname = "air-m2.lan",
            openPorts = listOf(22, 5000)
        )

        assertFalse("Real Apple MAC should not be flagged as randomized", result.isRandomizedMac)
        assertEquals("Apple, Inc.", result.manufacturer)
        assertTrue("OUI confidence should be high for authentic hardware", result.manufacturerConfidence >= 0.90f)
        assertEquals(DeviceType.LAPTOP_PC, result.deviceType)
        assertTrue(result.typeConfidence >= 0.85f)
    }

    @Test
    fun testRandomizedMacAddressDetection() {
        // Pixel 9 with randomized MAC: 3A:B2:77:99:12:0A
        // 0x3A has bit 1 set (0x3A = 0011 1010, bit 1 is 1 -> Locally Administered Address)
        val result = service.inferDevice(
            macAddress = "3A:B2:77:99:12:0A",
            hostname = "pixel-9-pro.lan"
        )

        assertTrue("Randomized MAC (LAA bit) must be detected", result.isRandomizedMac)
        assertEquals("Google", result.manufacturer)
        assertEquals(DeviceType.MOBILE_PHONE, result.deviceType)
        assertTrue("Type confidence from hostname remains high", result.typeConfidence >= 0.90f)
    }

    @Test
    fun testSmartTvHeuristicWithWebOsPort() {
        val result = service.inferDevice(
            macAddress = "48:A6:B8:33:41:9C", // LG Electronics
            hostname = "lgwebostv.lan",
            openPorts = listOf(8001, 8080)
        )

        assertEquals("LG Electronics", result.manufacturer)
        assertEquals(DeviceType.SMART_TV, result.deviceType)
        assertTrue("Port 8001 + LG OUI yields very high TV confidence", result.typeConfidence >= 0.90f)
    }

    @Test
    fun testIpCameraHeuristicWithRtspPort() {
        val result = service.inferDevice(
            macAddress = "BC:DD:C2:FE:19:40",
            hostname = "cam-backyard.lan",
            openPorts = listOf(554) // RTSP port
        )

        assertEquals(DeviceType.IOT_SMART_HOME, result.deviceType)
        assertTrue("Port 554 RTSP strongly infers camera/IoT", result.typeConfidence >= 0.80f)
    }
}
