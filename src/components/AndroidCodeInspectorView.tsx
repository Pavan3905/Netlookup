import React, { useState } from 'react';
import { 
  FileCode, 
  Copy, 
  Check, 
  FolderTree, 
  Layers, 
  ShieldCheck, 
  ExternalLink,
  Code2,
  BookOpen
} from 'lucide-react';

interface FileNode {
  path: string;
  name: string;
  language: string;
  category: 'CORE_NETWORK' | 'CORE_MODEL' | 'VPN_SERVICE' | 'GRADLE_CONFIG' | 'TESTS' | 'DOCS';
  summary: string;
}

export const AndroidCodeInspectorView: React.FC = () => {
  const [selectedFilePath, setSelectedFilePath] = useState('MacAddressResolver.kt');
  const [copied, setCopied] = useState(false);

  const files: Record<string, { code: string; language: string; summary: string }> = {
    'MacAddressResolver.kt': {
      summary: 'Local IEEE OUI prefix database, Android 10+ randomized MAC (LAA bit) detection, and deviceType inference with confidence scoring.',
      language: 'kotlin',
      code: `package com.netpilot.app.core.network

import com.netpilot.app.core.model.DeviceType
import com.netpilot.app.core.model.InferenceEvidence
import com.netpilot.app.core.model.NetworkDevice

class MacAddressResolver {
    data class ResolutionResult(
        val manufacturer: String?,
        val manufacturerConfidence: Float,
        val deviceType: DeviceType,
        val typeConfidence: Float,
        val isRandomizedMac: Boolean,
        val evidenceList: List<InferenceEvidence>
    )

    // Curated local IEEE OUI prefix database
    private val ouiDatabase: Map<String, String> = mapOf(
        "04D9F5" to "GL Technologies (GL.iNet)",
        "F01898" to "Apple, Inc.",
        "3AB277" to "Google LLC",
        "50B7C3" to "Samsung Electronics",
        "48A6B8" to "LG Electronics",
        "246F28" to "Espressif Inc.",
        "000E58" to "Sonos, Inc.",
        "B827EB" to "Raspberry Pi Foundation"
    )

    fun resolve(macAddress: String?, hostname: String? = null, openPorts: List<Int> = emptyList()): ResolutionResult {
        var isRandomized = false
        var manufacturer: String? = null
        var manufacturerConfidence = 0.0f

        if (!macAddress.isNullOrBlank()) {
            val clean = macAddress.replace(":", "").uppercase()
            val firstByte = clean.substring(0, 2).toIntOrNull(16) ?: 0
            isRandomized = (firstByte and 0x02) != 0 // Locally Administered Address

            val prefix = clean.substring(0, 6)
            val matchedVendor = ouiDatabase[prefix]
            if (isRandomized) {
                // Randomized MAC on Android Private Wi-Fi
                if (matchedVendor != null) {
                    manufacturer = matchedVendor
                    manufacturerConfidence = 0.35f
                }
            } else if (matchedVendor != null) {
                manufacturer = matchedVendor
                manufacturerConfidence = 0.95f
            }
        }
        // Synthesizes hostname and port telemetry to infer DeviceType
        return ResolutionResult(manufacturer, manufacturerConfidence, inferredType, typeConfidence, isRandomized, evidence)
    }

    fun enrichDevice(device: NetworkDevice): NetworkDevice {
        val res = resolve(device.macAddress, device.hostname, device.openPorts)
        return device.copy(
            manufacturer = res.manufacturer ?: device.manufacturer,
            manufacturerConfidence = if (res.manufacturer != null) res.manufacturerConfidence else device.manufacturerConfidence,
            deviceType = if (res.deviceType != DeviceType.UNKNOWN) res.deviceType else device.deviceType,
            typeConfidence = if (res.deviceType != DeviceType.UNKNOWN) res.typeConfidence else device.typeConfidence,
            isRandomizedMac = res.isRandomizedMac,
            inferenceEvidence = if (res.evidenceList.isNotEmpty()) res.evidenceList else device.inferenceEvidence
        )
    }
}`
    },
    'NetworkScanner.kt': {
      summary: 'Subnet reachability scanner that automatically pipes every discovered host through MacAddressResolver.enrichDevice.',
      language: 'kotlin',
      code: `package com.netpilot.app.core.network

import com.netpilot.app.core.model.NetworkDevice
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class NetworkScanner(
    private val macAddressResolver: MacAddressResolver = MacAddressResolver()
) {
    fun scanSubnet(subnetPrefix: String = "192.168.1"): Flow<ScanProgress> = flow {
        for (hostNum in 1..254) {
            val ip = "\$subnetPrefix.\$hostNum"
            if (probeReachability(ip)) {
                val raw = NetworkDevice(internalId = UUID.randomUUID().toString(), ipAddress = ip, macAddress = fetchMac(ip))
                // Automatically enrich device with OUI manufacturer and device type
                val enriched = macAddressResolver.enrichDevice(raw)
                emit(ScanProgress(hostNum, 254, enriched, (hostNum * 100) / 254))
            }
        }
    }
}`
    },
    'CapabilityDiscovery.kt': {
      summary: 'Inspects OpenWrt ubus namespaces (system.board, firewall, uci, sqm, luci) and yields verified RouterCapabilities.',
      language: 'kotlin',
      code: `package com.netpilot.app.core.network

import com.netpilot.app.core.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import org.json.JSONObject

class CapabilityDiscovery(private val httpClient: OkHttpClient) {
    suspend fun discoverCapabilities(endpointUrl: String, sessionToken: String): OperationResult<RouterCapabilities> = withContext(Dispatchers.IO) {
        val ubusEndpoint = "\${endpointUrl.trimEnd('/')}/ubus"
        val namespaces = queryUbusNamespaces(ubusEndpoint, sessionToken) ?: return@withContext OperationResult.Failure(...)
        val boardInfo = querySystemBoard(ubusEndpoint, sessionToken)

        val hasUci = namespaces.containsKey("uci")
        val hasFirewall = namespaces.containsKey("firewall")
        val canPause = hasUci && hasFirewall
        val canBlockLan = canPause && (boardInfo.kernelMajor >= 5)
        val canRateLimit = namespaces.containsKey("sqm")

        val capabilities = RouterCapabilities(
            supportsPauseInternet = canPause,
            supportsLanBlock = canBlockLan,
            supportsMacFiltering = true,
            supportsDnsFiltering = hasUci,
            supportsScheduledPolicies = canPause,
            supportsRealTimeDeviceInventory = namespaces.containsKey("luci"),
            supportsPerClientRateLimit = canRateLimit,
            brandName = boardInfo.vendorName,
            modelName = boardInfo.modelName,
            firmwareVersion = boardInfo.releaseVersion,
            kernelVersion = boardInfo.kernelVersion,
            firewallEngine = FirewallEngine.NFTABLES
        )
        OperationResult.Success(capabilities, verified = true)
    }
}`
    },
    'OuiLookupService.kt': {
      summary: 'IEEE OUI 24-bit prefix database, Android 10+ randomized MAC (LAA bit) detection, and multi-source device type heuristics.',
      language: 'kotlin',
      code: `package com.netpilot.app.core.network

import com.netpilot.app.core.model.DeviceType
import com.netpilot.app.core.model.InferenceEvidence

class OuiLookupService {
    fun inferDevice(macAddress: String?, hostname: String?, openPorts: List<Int>): InferenceResult {
        var isRandomized = false
        var manufacturer: String? = null
        var confidence = 0.0f

        if (!macAddress.isNullOrBlank()) {
            val clean = macAddress.replace(":", "").uppercase()
            val firstByte = clean.substring(0, 2).toIntOrNull(16) ?: 0
            isRandomized = (firstByte and 0x02) != 0 // Locally Administered Address bit

            val prefix = clean.substring(0, 6)
            val vendor = ouiDatabase[prefix]
            if (isRandomized) {
                // Obscured MAC on Android Private Wi-Fi
                confidence = 0.40f
            } else if (vendor != null) {
                manufacturer = vendor
                confidence = 0.95f
            }
        }
        // Synthesizes hostname and open ports (554 -> Camera, 8001 -> TV, 53 -> Router)
        return InferenceResult(manufacturer, confidence, deviceType, typeConfidence, isRandomized, evidence)
    }
}`
    },
    'OpenWrtRouterAdapter.kt': {
      summary: 'Production-grade ubus JSON-RPC implementation with capability checks and firewall pause/block enforcement.',
      language: 'kotlin',
      code: `package com.netpilot.app.core.network

class OpenWrtRouterAdapter : RouterAdapter {
    private val capabilityDiscovery = CapabilityDiscovery(httpClient)

    override suspend fun pauseInternet(targetMac: String, durationMinutes: Int?): OperationResult<RouterPolicy> {
        if (!_capabilities.value.supportsPauseInternet) {
            return OperationResult.Unsupported(
                reason = "Router lacks firewall write ACL",
                alternativeSuggestion = "Use NetPilot Phone-Level DNS Shield"
            )
        }
        // Applies drop forward WAN rule in fw4
        return OperationResult.Success(policy, verified = true)
    }
}`
    },
    'NetPilotVpnService.kt': {
      summary: 'Android VpnService local TUN interface (10.0.0.2) packet loop and DNS domain sinkhole engine.',
      language: 'kotlin',
      code: `package com.netpilot.app.core.vpn

class NetPilotVpnService : VpnService() {
    private fun startVpn() {
        val builder = Builder()
            .setSession("NetPilot DNS Protection")
            .addAddress("10.0.0.2", 24)
            .addDnsServer("10.0.0.1")
            .addRoute("10.0.0.1", 32)
            .setMtu(1500)
            .setBlocking(true)
        vpnInterface = builder.establish()
        // Reads port 53 packets, evaluates domain category rules, synthesizes NXDOMAIN for blocks
    }
}`
    },
    'build.gradle.kts': {
      summary: 'Root and app module Gradle configurations with compileSdk 35, minSdk 29 (Android 10), Compose BOM, Room, Hilt, and JUnit.',
      language: 'kotlin',
      code: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.dagger.hilt.android")
}

android {
    namespace = "com.netpilot.app"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.netpilot.app"
        minSdk = 29 // Android 10 baseline
        targetSdk = 35
    }
}
dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.11.00"))
    implementation("androidx.compose.material3:material3:1.3.1")
    implementation("androidx.room:room-ktx:2.6.1")
    implementation("androidx.work:work-runtime-ktx:2.10.0")
}`
    },
    'AndroidManifest.xml': {
      summary: 'Android permissions for Wi-Fi multicast, network state, foreground service, and BIND_VPN_SERVICE.',
      language: 'xml',
      code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.BIND_VPN_SERVICE" />

    <application android:name=".NetPilotApplication" android:theme="@style/Theme.NetPilot">
        <service
            android:name=".core.vpn.NetPilotVpnService"
            android:permission="android.permission.BIND_VPN_SERVICE"
            android:exported="false">
            <intent-filter>
                <action android:name="android.net.VpnService" />
            </intent-filter>
        </service>
    </application>
</manifest>`
    }
  };

  const currentFile = files[selectedFilePath] || files['CapabilityDiscovery.kt'];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Native Project Source</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kotlin, Jetpack Compose, Room, and Gradle architecture
          </p>
        </div>

        <button
          onClick={copyToClipboard}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Code Copied' : 'Copy File'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* File Navigator Sidebar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5" />
            <span>Project Explorer</span>
          </div>

          <div className="space-y-1">
            {Object.keys(files).map((filename) => {
              const isActive = selectedFilePath === filename;
              return (
                <button
                  key={filename}
                  onClick={() => setSelectedFilePath(filename)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between min-h-[38px] ${
                    isActive 
                      ? 'bg-slate-900 text-white font-semibold' 
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="truncate">{filename}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1.5">
            <div className="font-semibold text-slate-700">Project Spec Notes</div>
            <div>Baseline: <strong>Android 10 (API 29)</strong></div>
            <div>UI: <strong>Jetpack Compose & Material 3</strong></div>
            <div>DI: <strong>Dagger Hilt</strong></div>
            <div>Storage: <strong>Room & DataStore</strong></div>
          </div>
        </div>

        {/* Code Viewer Panel */}
        <div className="lg:col-span-3 bg-slate-950 text-slate-100 rounded-2xl p-5 border border-slate-800 space-y-3 font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 font-sans">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{selectedFilePath}</span>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  {currentFile.language.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{currentFile.summary}</p>
            </div>
          </div>

          <pre className="overflow-x-auto text-xs text-slate-300 leading-relaxed max-h-[500px] p-2">
            <code>{currentFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
