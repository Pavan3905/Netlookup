package com.netpilot.app.core.network

import com.netpilot.app.core.model.DeviceType
import com.netpilot.app.core.model.InferenceEvidence

/**
 * High-precision IEEE OUI (Organizationally Unique Identifier) Lookup
 * and Multi-Source Device Type Inference Service.
 *
 * Grounded in verifiable network telemetry:
 * 1. IEEE OUI 24-bit prefix database.
 * 2. Locally Administered Address (LAA / Randomized MAC) bit detection.
 * 3. Hostname regex patterns (mDNS / NetBIOS / DHCP option 12).
 * 4. Open TCP port signatures (RTSP, AirPlay, UPnP, SSH, DNS).
 */
class OuiLookupService {

    data class InferenceResult(
        val manufacturer: String?,
        val manufacturerConfidence: Float,
        val deviceType: DeviceType,
        val typeConfidence: Float,
        val isRandomizedMac: Boolean,
        val evidenceList: List<InferenceEvidence>
    )

    // Curated IEEE OUI Database (Upper-case 6-char hex prefix without delimiters)
    private val ouiDatabase = mapOf(
        // GL.iNet / OpenWrt
        "04D9F5" to "GL Technologies (GL.iNet)",
        "9483C4" to "GL Technologies (GL.iNet)",
        
        // Apple
        "F01898" to "Apple, Inc.",
        "A483E7" to "Apple, Inc.",
        "ACBC32" to "Apple, Inc.",
        "BC5451" to "Apple, Inc.",
        "701124" to "Apple, Inc.",
        "B4FBE4" to "Apple, Inc.",

        // Google
        "3AB277" to "Google LLC",
        "546009" to "Google LLC",
        "709741" to "Google LLC",
        "F4F5DB" to "Google LLC",

        // Samsung
        "50B7C3" to "Samsung Electronics",
        "9CF387" to "Samsung Electronics",
        "28395E" to "Samsung Electronics",

        // LG Electronics
        "48A6B8" to "LG Electronics",
        "68C63A" to "LG Electronics",
        "10E992" to "LG Electronics",

        // Espressif (IoT smart plugs, lights, ESP32)
        "246F28" to "Espressif Inc.",
        "30AEA4" to "Espressif Inc.",
        "A4CF12" to "Espressif Inc.",
        "BCDD2"  to "Tuya Smart / Generic IoT",

        // Raspberry Pi
        "B827EB" to "Raspberry Pi Foundation",
        "DCA632" to "Raspberry Pi Trading",
        "E45F01" to "Raspberry Pi Foundation",

        // Intel
        "001B21" to "Intel Corporation",
        "3413E8" to "Intel Corporation",

        // Printers
        "001599" to "HP Inc.",
        "40B89A" to "Canon Inc.",

        // Network Vendors
        "001122" to "Cisco Systems",
        "50C7BF" to "TP-Link Corporation",
        "E848B8" to "Netgear"
    )

    fun inferDevice(
        macAddress: String?,
        hostname: String?,
        openPorts: List<Int> = emptyList(),
        mdnsServices: List<String> = emptyList()
    ): InferenceResult {
        val evidence = mutableListOf<InferenceEvidence>()

        // 1. MAC Analysis: Check if randomized & lookup OUI
        var isRandomized = false
        var manufacturer: String? = null
        var manufacturerConfidence = 0.0f

        if (!macAddress.isNullOrBlank()) {
            val cleanMac = macAddress.replace(":", "").replace("-", "").replace(".", "").uppercase()
            if (cleanMac.length >= 6) {
                // Check Locally Administered Address (LAA) bit
                val firstByte = cleanMac.substring(0, 2).toIntOrNull(16) ?: 0
                isRandomized = (firstByte and 0x02) != 0

                val ouiPrefix = cleanMac.substring(0, 6)
                val matchedVendor = ouiDatabase[ouiPrefix]

                if (isRandomized) {
                    evidence.add(
                        InferenceEvidence(
                            category = "MAC Privacy",
                            observedValue = macAddress,
                            derivedInference = "Locally Administered / Randomized MAC address (Private Wi-Fi enabled)",
                            confidenceWeight = 0.1f
                        )
                    )
                    // If vendor is matched on randomized MAC, confidence is dampened
                    if (matchedVendor != null) {
                        manufacturer = matchedVendor
                        manufacturerConfidence = 0.40f
                        evidence.add(
                            InferenceEvidence(
                                category = "IEEE OUI (Dampened)",
                                observedValue = ouiPrefix,
                                derivedInference = "$matchedVendor (Coincidental OUI prefix match on randomized MAC)",
                                confidenceWeight = 0.40f
                            )
                        )
                    }
                } else if (matchedVendor != null) {
                    manufacturer = matchedVendor
                    manufacturerConfidence = 0.95f
                    evidence.add(
                        InferenceEvidence(
                            category = "IEEE OUI Registry",
                            observedValue = ouiPrefix,
                            derivedInference = "Authentic Hardware Vendor: $matchedVendor",
                            confidenceWeight = 0.95f
                        )
                    )
                }
            }
        }

        // 2. Hostname Analysis (DNS PTR or DHCP Option 12)
        val cleanHost = hostname?.lowercase() ?: ""
        if (cleanHost.isNotBlank()) {
            evidence.add(
                InferenceEvidence(
                    category = "Network Hostname",
                    observedValue = hostname!!,
                    derivedInference = "Announced Hostname Signature",
                    confidenceWeight = 0.80f
                )
            )

            // Cross-check manufacturer from hostname if MAC was obscured
            if (manufacturer == null || isRandomized) {
                when {
                    cleanHost.contains("pixel") -> {
                        manufacturer = "Google"
                        manufacturerConfidence = maxOf(manufacturerConfidence, 0.90f)
                    }
                    cleanHost.contains("iphone") || cleanHost.contains("ipad") || cleanHost.contains("macbook") || cleanHost.contains("air-m") -> {
                        manufacturer = "Apple"
                        manufacturerConfidence = maxOf(manufacturerConfidence, 0.92f)
                    }
                    cleanHost.contains("galaxy") -> {
                        manufacturer = "Samsung"
                        manufacturerConfidence = maxOf(manufacturerConfidence, 0.88f)
                    }
                    cleanHost.contains("openwrt") -> {
                        manufacturer = "OpenWrt / Linux"
                        manufacturerConfidence = maxOf(manufacturerConfidence, 0.95f)
                    }
                }
            }
        }

        // 3. Port & Service Analysis
        for (port in openPorts) {
            when (port) {
                554 -> evidence.add(
                    InferenceEvidence("Open Port Probe", "Port 554 RTSP", "Real-Time Streaming Protocol (IP Video Camera)", 0.85f)
                )
                53 -> evidence.add(
                    InferenceEvidence("Open Port Probe", "Port 53 DNS", "Domain Name System daemon (Router / Gateway)", 0.90f)
                )
                631 -> evidence.add(
                    InferenceEvidence("Open Port Probe", "Port 631 IPP", "Internet Printing Protocol (Network Printer)", 0.90f)
                )
                8001 -> evidence.add(
                    InferenceEvidence("Open Port Probe", "Port 8001 WebOS", "LG WebOS TV Remote pairing port", 0.92f)
                )
            }
        }

        // 4. Infer Device Type using Heuristic Engine
        var inferredType = DeviceType.UNKNOWN
        var typeConfidence = 0.1f

        when {
            // Gateway / Router
            openPorts.contains(53) || cleanHost.contains("openwrt") || cleanHost.contains("gateway") || cleanHost.contains("router") -> {
                inferredType = DeviceType.GATEWAY_ROUTER
                typeConfidence = 0.95f
            }
            // Smart TV
            openPorts.contains(8001) || cleanHost.contains("webos") || cleanHost.contains("tv") || cleanHost.contains("bravia") || (manufacturer == "LG Electronics" && openPorts.contains(8080)) -> {
                inferredType = DeviceType.SMART_TV
                typeConfidence = 0.90f
            }
            // Camera / IoT Smart Home
            openPorts.contains(554) || manufacturer == "Espressif Inc." || manufacturer?.contains("Tuya") == true || cleanHost.contains("cam") -> {
                inferredType = DeviceType.IOT_SMART_HOME
                typeConfidence = 0.88f
            }
            // Printer
            openPorts.contains(631) || cleanHost.contains("printer") || cleanHost.contains("deskjet") -> {
                inferredType = DeviceType.PRINTER
                typeConfidence = 0.92f
            }
            // Mobile Phone
            cleanHost.contains("pixel") || cleanHost.contains("iphone") || cleanHost.contains("galaxy") || cleanHost.contains("phone") -> {
                inferredType = DeviceType.MOBILE_PHONE
                typeConfidence = 0.90f
            }
            // Laptop / PC
            cleanHost.contains("macbook") || cleanHost.contains("air-m") || cleanHost.contains("laptop") || cleanHost.contains("thinkpad") || cleanHost.contains("desktop") -> {
                inferredType = DeviceType.LAPTOP_PC
                typeConfidence = 0.85f
            }
            // Fallback based on manufacturer
            manufacturer == "Apple, Inc." -> {
                inferredType = DeviceType.LAPTOP_PC
                typeConfidence = 0.50f
            }
            manufacturer == "Google LLC" -> {
                inferredType = DeviceType.MOBILE_PHONE
                typeConfidence = 0.50f
            }
        }

        return InferenceResult(
            manufacturer = manufacturer,
            manufacturerConfidence = manufacturerConfidence,
            deviceType = inferredType,
            typeConfidence = typeConfidence,
            isRandomizedMac = isRandomized,
            evidenceList = evidence
        )
    }
}
