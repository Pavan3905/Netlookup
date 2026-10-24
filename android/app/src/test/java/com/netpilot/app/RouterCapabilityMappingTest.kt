package com.netpilot.app

import com.netpilot.app.core.model.RouterCapabilities
import com.netpilot.app.core.network.MockRouterAdapter
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class RouterCapabilityMappingTest {

    @Test
    fun testMockRouterCapabilitiesDeclaredCorrectly() = runBlocking {
        val adapter = MockRouterAdapter()
        val caps: RouterCapabilities = adapter.capabilities.value

        assertTrue("Mock router must report pauseInternet capability", caps.supportsPauseInternet)
        assertTrue("Mock router must report LAN block capability", caps.supportsLanBlock)
        assertTrue("Mock router must report DNS filtering capability", caps.supportsDnsFiltering)
        assertEquals("OpenWrt 23.05.2 r23630", caps.firmwareVersion)
    }
}
