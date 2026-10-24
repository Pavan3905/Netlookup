package com.netpilot.app.core.network

import com.netpilot.app.core.model.DeviceType
import com.netpilot.app.core.model.InferenceEvidence
import com.netpilot.app.core.model.NetworkDevice
import java.util.Locale

/**
 * Production MacAddressResolver Service for NetPilot.
 *
 * Implements an in-memory, highly efficient local IEEE OUI database mapping
 * 24-bit MAC prefixes (and extended prefixes) to hardware manufacturers.
 *
 * Automatically detects Android 10+ Locally Administered Addresses (Randomized MACs),
 * cross-correlates hostname and port telemetry, and outputs populated `NetworkDevice`
 * models with rated confidence scores and audit evidence.
 */
class MacAddressResolver {

    data class ResolutionResult(
        val manufacturer: String?,
        val manufacturerConfidence: Float,
        val deviceType: DeviceType,
        val typeConfidence: Float,
        val isRandomizedMac: Boolean,
        val evidenceList: List<InferenceEvidence>
    )

    // Comprehensive Local IEEE OUI Database (Normalized 6-character hex uppercase)
    private val ouiDatabase: Map<String, String> = mapOf(
        // GL Technologies / OpenWrt Gateways
        "04D9F5" to "GL Technologies (GL.iNet)",
        "9483C4" to "GL Technologies (GL.iNet)",
        "E4956E" to "GL Technologies (GL.iNet)",

        // Apple Inc. (iPhones, iPads, MacBooks, Apple TV)
        "F01898" to "Apple, Inc.",
        "A483E7" to "Apple, Inc.",
        "ACBC32" to "Apple, Inc.",
        "BC5451" to "Apple, Inc.",
        "701124" to "Apple, Inc.",
        "B4FBE4" to "Apple, Inc.",
        "F4F15A" to "Apple, Inc.",
        "3C22FB" to "Apple, Inc.",
        "A85C2C" to "Apple, Inc.",
        "147DDA" to "Apple, Inc.",

        // Google LLC (Pixel, Nest, Chromecast)
        "3AB277" to "Google LLC",
        "546009" to "Google LLC",
        "709741" to "Google LLC",
        "F4F5DB" to "Google LLC",
        "D4E6B7" to "Google LLC",
        "1C56FE" to "Google LLC",

        // Samsung Electronics (Galaxy, Smart TVs, Appliances)
        "50B7C3" to "Samsung Electronics",
        "9CF387" to "Samsung Electronics",
        "28395E" to "Samsung Electronics",
        "842519" to "Samsung Electronics",
        "B407C1" to "Samsung Electronics",
        "CC07AB" to "Samsung Electronics",

        // LG Electronics (webOS Smart TVs, Washers, Monitors)
        "48A6B8" to "LG Electronics",
        "68C63A" to "LG Electronics",
        "10E992" to "LG Electronics",
        "702C1F" to "LG Electronics",

        // Espressif Inc. & Tuya (Smart Home Plugs, ESP32, IoT Sensors)
        "246F28" to "Espressif Inc.",
        "30AEA4" to "Espressif Inc.",
        "A4CF12" to "Espressif Inc.",
        "24D7EB" to "Espressif Inc.",
        "BCDD2"  to "Tuya Smart / Generic IoT",
        "D8B04C" to "Tuya Smart / Generic IoT",

        // Raspberry Pi Foundation
        "B827EB" to "Raspberry Pi Foundation",
        "DCA632" to "Raspberry Pi Trading",
        "E45F01" to "Raspberry Pi Foundation",
        "28CDC1" to "Raspberry Pi Foundation",

        // Sony Interactive Entertainment (PlayStation, BRAVIA)
        "001315" to "Sony Interactive Entertainment",
        "F8461C" to "Sony Corporation",
        "0019C5" to "Sony Corporation",

        // Microsoft Corporation (Xbox, Surface)
        "0050F2" to "Microsoft Corporation",
        "70480F" to "Microsoft Corporation",
        "281878" to "Microsoft Corporation",

        // Amazon Technologies (Echo, Kindle, Fire TV)
        "44650D" to "Amazon Technologies Inc.",
        "6837E9" to "Amazon Technologies Inc.",
        "747548" to "Amazon Technologies Inc.",
        "FC65DE" to "Amazon Technologies Inc.",

        // Network Infrastructure & Routing
        "001122" to "Cisco Systems",
        "50C7BF" to "TP-Link Corporation",
        "E848B8" to "Netgear Inc.",
        "C05627" to "Belkin International",
        "001788" to "Philips Lighting (Hue)",
        "000E58" to "Sonos, Inc.",
        "001132" to "Synology Inc.",
        "245EBE" to "QNAP Systems",

        // Intel & Workstations
        "001B21" to "Intel Corporation",
        "3413E8" to "Intel Corporation",
        "001599" to "HP Inc.",
        "40B89A" to "Canon Inc."
    )

    /**
     * Resolves raw hardware and network telemetry into verified manufacturer
     * and device type inferences with an evidence trail.
     */
    fun resolve(
        macAddress: String?,
        hostname: String? = null,
        openPorts: List<Int> = emptyList()
    ): ResolutionResult {
        val evidence = mutableListOf<InferenceEvidence>()
        var isRandomized = false
        var manufacturer: String? = null
        var manufacturerConfidence = 0.0f

        // 1. MAC Address Analysis & OUI Lookup
        if (!macAddress.isNullOrBlank()) {
            val cleanMac = normalizeMac(macAddress)
            if (cleanMac.length >= 6) {
                // Check Locally Administered Address (LAA / Randomized MAC) bit
                val firstByte = cleanMac.substring(0, 2).toIntOrNull(16) ?: 0
                isRandomized = (firstByte and 0x02) != 0

                val ouiPrefix = cleanMac.substring(0, 6)
                val matchedVendor = ouiDatabase[ouiPrefix]

                if (isRandomized) {
                    evidence.add(
                        InferenceEvidence(
                            category = "MAC Privacy",
                            observedValue = macAddress,
                            derivedInference = "Locally Administered / Randomized MAC (Android Private Wi-Fi)",
                            confidenceWeight = 0.15f
                        )
                    )
                    // If vendor prefix matched a randomized MAC, mark as coincidental
                    if (matchedVendor != null) {
                        manufacturer = matchedVendor
                        manufacturerConfidence = 0.35f
                        evidence.add(
                            InferenceEvidence(
                                category = "IEEE OUI (Dampened)",
                                observedValue = ouiPrefix,
                                derivedInference = "$matchedVendor (Coincidental OUI match on randomized MAC)",
                                confidenceWeight = 0.35f
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

        // 2. Hostname Corroboration (mDNS, NetBIOS, DHCP Option 12)
        val cleanHost = hostname?.lowercase(Locale.ROOT) ?: ""
        if (cleanHost.isNotBlank()) {
            evidence.add(
                InferenceEvidence(
                    category = "Network Hostname",
                    observedValue = hostname!!,
                    derivedInference = "Host Announcement Signature",
                    confidenceWeight = 0.80f
                )
            )

            // Fill in or boost manufacturer if MAC was obscured by Android 10+ randomization
            if (manufacturer == null || isRandomized) {
                when {
                    cleanHost.contains("pixel") -> {
                        manufacturer = "Google LLC"
                        manufacturerConfidence = maxOf(manufacturerConfidence, 0.92f)
                    }
                    cleanHost.contains("iphone") || cleanHost.contains("ipad") || cleanHost.contains("macbook") || cleanHost.contains("air-m") -> {
                        manufacturer = "Apple, Inc."
                        manufacturerConfidence = maxOf(manufacturerConfidence, 0.92f)
                    }
                    cleanHost.contains("galaxy") || cleanHost.contains("samsung") -> {
                        manufacturer = "Samsung Electronics"
                        manufacturerConfidence = maxOf(manufacturerConfidence, 0.90f)
                    }
                    cleanHost.contains("openwrt") || cleanHost.contains("gl-inet") -> {
                        manufacturer = "GL Technologies / OpenWrt"
                        manufacturerConfidence = maxOf(manufacturerConfidence, 0.95f)
                    }
                    cleanHost.contains("bravia") || cleanHost.contains("playstation") || cleanHost.contains("ps5") -> {
                        manufacturer = "Sony Corporation"
                        manufacturerConfidence = maxOf(manufacturerConfidence, 0.92f)
                    }
                }
            }
        }

        // 3. Port Telemetry Corroboration
        for (port in openPorts) {
            when (port) {
                53, 67 -> evidence.add(
                    InferenceEvidence("Open Port Probe", "Port $port (DNS/DHCP)", "Gateway / Core Network Router Service", 0.95f)
                )
                554 -> evidence.add(
                    InferenceEvidence("Open Port Probe", "Port 554 (RTSP)", "Video Streaming Daemon (IP Camera)", 0.88f)
                )
                8001, 8080 -> evidence.add(
                    InferenceEvidence("Open Port Probe", "Port $port (WebOS/Control)", "Connected Display / Media Server", 0.85f)
                )
                631 -> evidence.add(
                    InferenceEvidence("Open Port Probe", "Port 631 (IPP)", "Internet Printing Protocol Daemon", 0.92f)
                )
                5000, 5001 -> evidence.add(
                    InferenceEvidence("Open Port Probe", "Port $port (DSM/NAS)", "Network Attached Storage Interface", 0.85f)
                )
            }
        }

        // 4. Heuristic Device Type Classification
        var inferredType = DeviceType.UNKNOWN
        var typeConfidence = 0.20f

        when {
            // Core Router / Gateway
            openPorts.contains(53) || cleanHost.contains("openwrt") || cleanHost.contains("gateway") || cleanHost.contains("router") -> {
                inferredType = DeviceType.GATEWAY_ROUTER
                typeConfidence = 0.95f
            }
            // Smart TV
            openPorts.contains(8001) || cleanHost.contains("webos") || cleanHost.contains("tv") || cleanHost.contains("bravia") || (manufacturer == "LG Electronics" && openPorts.contains(8080)) -> {
                inferredType = DeviceType.SMART_TV
                typeConfidence = 0.92f
            }
            // IP Camera / Smart Home
            openPorts.contains(554) || manufacturer == "Espressif Inc." || manufacturer?.contains("Tuya") == true || cleanHost.contains("cam") || cleanHost.contains("plug") -> {
                inferredType = DeviceType.IOT_SMART_HOME
                typeConfidence = 0.88f
            }
            // Network Printer
            openPorts.contains(631) || cleanHost.contains("printer") || cleanHost.contains("deskjet") || cleanHost.contains("laserjet") -> {
                inferredType = DeviceType.PRINTER
                typeConfidence = 0.92f
            }
            // Smartphone / Mobile
            cleanHost.contains("pixel") || cleanHost.contains("iphone") || cleanHost.contains("galaxy") || cleanHost.contains("phone") -> {
                inferredType = DeviceType.MOBILE_PHONE
                typeConfidence = 0.90f
            }
            // Laptop / PC Workstation
            cleanHost.contains("macbook") || cleanHost.contains("air-m") || cleanHost.contains("laptop") || cleanHost.contains("thinkpad") || cleanHost.contains("desktop") -> {
                inferredType = DeviceType.LAPTOP_PC
                typeConfidence = 0.88f
            }
            // Storage NAS
            openPorts.contains(5000) || manufacturer == "Synology Inc." || manufacturer == "QNAP Systems" || cleanHost.contains("nas") -> {
                inferredType = DeviceType.STORAGE_NAS
                typeConfidence = 0.90f
            }
            // Gaming Console
            cleanHost.contains("playstation") || cleanHost.contains("ps5") || cleanHost.contains("xbox") || cleanHost.contains("nintendo") -> {
                inferredType = DeviceType.GAMING_CONSOLE
                typeConfidence = 0.92f
            }
            // Fallback by manufacturer profile
            manufacturer == "Apple, Inc." -> {
                inferredType = DeviceType.LAPTOP_PC
                typeConfidence = 0.50f
            }
            manufacturer == "Google LLC" -> {
                inferredType = DeviceType.MOBILE_PHONE
                typeConfidence = 0.50f
            }
            manufacturer == "Samsung Electronics" -> {
                inferredType = DeviceType.MOBILE_PHONE
                typeConfidence = 0.50f
            }
        }

        return ResolutionResult(
            manufacturer = manufacturer,
            manufacturerConfidence = manufacturerConfidence,
            deviceType = inferredType,
            typeConfidence = typeConfidence,
            isRandomizedMac = isRandomized,
            evidenceList = evidence
        )
    }

    /**
     * Enriches an existing or freshly observed NetworkDevice with OUI resolution telemetry.
     */
    fun enrichDevice(device: NetworkDevice): NetworkDevice {
        val result = resolve(
            macAddress = device.macAddress,
            hostname = device.hostname,
            openPorts = device.openPorts
        )

        return device.copy(
            manufacturer = result.manufacturer ?: device.manufacturer,
            manufacturerConfidence = if (result.manufacturer != null) result.manufacturerConfidence else device.manufacturerConfidence,
            deviceType = if (result.deviceType != DeviceType.UNKNOWN) result.deviceType else device.deviceType,
            typeConfidence = if (result.deviceType != DeviceType.UNKNOWN) result.typeConfidence else device.typeConfidence,
            isRandomizedMac = result.isRandomizedMac,
            inferenceEvidence = if (result.evidenceList.isNotEmpty()) result.evidenceList else device.inferenceEvidence
        )
    }

    private fun normalizeMac(mac: String): String {
        return mac.replace(":", "")
            .replace("-", "")
            .replace(".", "")
            .trim()
            .uppercase(Locale.ROOT)
    }
}
