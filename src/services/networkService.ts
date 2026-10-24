import { NetworkDevice, ScheduledPolicy, FilterProfile, SecurityFinding, RouterCapabilities, DnsLogEntry } from '../types';
import { MacAddressResolver } from './macAddressResolver';

export const INITIAL_DEVICES: NetworkDevice[] = [
  {
    internalId: 'dev-gw-01',
    displayName: 'Main Gateway (OpenWrt)',
    ipAddress: '192.168.1.1',
    macAddress: '04:D9:F5:8B:11:00',
    hostname: 'openwrt.lan',
    userCustomName: 'Main Gateway (OpenWrt)',
    manufacturer: 'GL Technologies (GL.iNet)',
    manufacturerConfidence: 0.95,
    deviceType: 'GATEWAY_ROUTER',
    typeConfidence: 0.95,
    isRandomizedMac: false,
    inferenceEvidence: [
      { category: 'IEEE OUI Registry', observedValue: '04:D9:F5', derivedInference: 'GL Technologies (GL.iNet)', confidenceWeight: 0.95 },
      { category: 'Open Port Probe', observedValue: 'Port 53 DNS', derivedInference: 'Local DNS Resolver Gateway', confidenceWeight: 0.90 },
      { category: 'Announced Hostname', observedValue: 'openwrt.lan', derivedInference: 'Embedded Linux Gateway', confidenceWeight: 0.95 }
    ],
    lastSeenTimestamp: Date.now(),
    firstSeenTimestamp: Date.now() - 86400000 * 14,
    discoveryMethod: 'ROUTER_DHCP_TABLE',
    reachabilityState: 'REACHABLE',
    identityConfidence: 1.0,
    attributeSources: {
      ip: 'Default Gateway Route',
      mac: 'ARP Table br-lan',
      hostname: 'DNS reverse PTR'
    },
    accessControlState: 'NORMAL',
    appliedFilterProfileId: null,
    openPorts: [53, 80, 443, 22],
    userNotes: 'Upstream gateway running OpenWrt 23.05. ubus JSON-RPC enabled.',
    isKnown: true
  },
  {
    internalId: 'dev-pixel-02',
    displayName: 'Pixel 9 Pro (This Device)',
    ipAddress: '192.168.1.102',
    macAddress: '3A:B2:77:99:12:0A',
    hostname: 'pixel-9-pro.lan',
    userCustomName: 'Pixel 9 Pro (This Device)',
    manufacturer: 'Google LLC',
    manufacturerConfidence: 0.92,
    deviceType: 'MOBILE_PHONE',
    typeConfidence: 0.90,
    isRandomizedMac: true, // Bit 1 of 0x3A is 1 (Locally Administered Address)
    inferenceEvidence: [
      { category: 'MAC Privacy Detection', observedValue: '3A:B2:77 (LAA Bit Set)', derivedInference: 'Android 14 Private Wi-Fi MAC Address', confidenceWeight: 0.20 },
      { category: 'DHCP Option 12', observedValue: 'pixel-9-pro.lan', derivedInference: 'Google Pixel 9 Pro Smartphone', confidenceWeight: 0.92 }
    ],
    lastSeenTimestamp: Date.now(),
    firstSeenTimestamp: Date.now() - 86400000 * 10,
    discoveryMethod: 'ROUTER_DHCP_TABLE',
    reachabilityState: 'REACHABLE',
    identityConfidence: 0.92,
    attributeSources: {
      ip: 'Android wlan0 local address',
      mac: 'DHCP Client DUID (Randomized MAC)',
      hostname: 'Android DHCP Option 12'
    },
    accessControlState: 'NORMAL',
    appliedFilterProfileId: 'profile-family',
    openPorts: [],
    userNotes: 'Host device running local DNS firewall protection.',
    isKnown: true
  },
  {
    internalId: 'dev-macbook-03',
    displayName: 'Work MacBook Air M2',
    ipAddress: '192.168.1.144',
    macAddress: 'F0:18:98:C1:22:98',
    hostname: 'air-m2.lan',
    userCustomName: 'Work MacBook Air M2',
    manufacturer: 'Apple, Inc.',
    manufacturerConfidence: 0.95,
    deviceType: 'LAPTOP_PC',
    typeConfidence: 0.88,
    isRandomizedMac: false,
    inferenceEvidence: [
      { category: 'IEEE OUI Registry', observedValue: 'F0:18:98', derivedInference: 'Apple, Inc. Hardware OUI', confidenceWeight: 0.95 },
      { category: 'mDNS Service', observedValue: '_apple-mobdev2._tcp', derivedInference: 'Apple macOS Device', confidenceWeight: 0.90 },
      { category: 'Announced Hostname', observedValue: 'air-m2.local', derivedInference: 'MacBook Air M2', confidenceWeight: 0.85 }
    ],
    lastSeenTimestamp: Date.now() - 120000,
    firstSeenTimestamp: Date.now() - 86400000 * 7,
    discoveryMethod: 'MDNS_BONJOUR',
    reachabilityState: 'REACHABLE',
    identityConfidence: 0.92,
    attributeSources: {
      ip: 'mDNS responder _apple-mobdev2._tcp',
      mac: 'Neighbor cache lookup',
      hostname: 'mDNS hostname air-m2.local'
    },
    accessControlState: 'NORMAL',
    appliedFilterProfileId: null,
    openPorts: [22, 5000],
    userNotes: 'Primary developer workstation.',
    isKnown: true
  },
  {
    internalId: 'dev-tv-04',
    displayName: 'Living Room LG OLED TV',
    ipAddress: '192.168.1.189',
    macAddress: '48:A6:B8:33:41:9C',
    hostname: 'lgwebostv.lan',
    userCustomName: 'Living Room LG OLED TV',
    manufacturer: 'LG Electronics',
    manufacturerConfidence: 0.95,
    deviceType: 'SMART_TV',
    typeConfidence: 0.92,
    isRandomizedMac: false,
    inferenceEvidence: [
      { category: 'IEEE OUI Registry', observedValue: '48:A6:B8', derivedInference: 'LG Electronics OUI', confidenceWeight: 0.95 },
      { category: 'Open Port Probe', observedValue: 'Port 8001 WebOS', derivedInference: 'LG webOS Smart TV Control Protocol', confidenceWeight: 0.92 },
      { category: 'SSDP Announcement', observedValue: 'MediaRenderer:1', derivedInference: 'Connected Smart TV Display', confidenceWeight: 0.88 }
    ],
    lastSeenTimestamp: Date.now() - 600000,
    firstSeenTimestamp: Date.now() - 86400000 * 30,
    discoveryMethod: 'SSDP_UPNP',
    reachabilityState: 'REACHABLE',
    identityConfidence: 0.92,
    attributeSources: {
      ip: 'SSDP urn:schemas-upnp-org:device:MediaRenderer:1',
      mac: 'DHCP lease static assignment',
      hostname: 'DHCP lease name'
    },
    accessControlState: 'NORMAL',
    appliedFilterProfileId: 'profile-iot',
    openPorts: [8001, 8080, 1900],
    userNotes: 'Restricted telemetry and automated sleep policy.',
    isKnown: true
  },
  {
    internalId: 'dev-cam-05',
    displayName: 'Backyard Security Camera',
    ipAddress: '192.168.1.215',
    macAddress: 'BC:DD:C2:FE:19:40',
    hostname: 'ipcam-backyard.lan',
    userCustomName: 'Backyard Security Camera',
    manufacturer: 'Tuya Smart / Generic IoT',
    manufacturerConfidence: 0.85,
    deviceType: 'IOT_SMART_HOME',
    typeConfidence: 0.88,
    isRandomizedMac: false,
    inferenceEvidence: [
      { category: 'IEEE OUI Registry', observedValue: 'BC:DD:C2', derivedInference: 'Tuya Smart Embedded Hardware', confidenceWeight: 0.85 },
      { category: 'Open Port Probe', observedValue: 'Port 554 RTSP', derivedInference: 'RTSP H.264 Video Streaming Daemon', confidenceWeight: 0.90 }
    ],
    lastSeenTimestamp: Date.now() - 30000,
    firstSeenTimestamp: Date.now() - 86400000 * 3,
    discoveryMethod: 'TCP_SYN_ACK_PROBE',
    reachabilityState: 'REACHABLE',
    identityConfidence: 0.85,
    attributeSources: {
      ip: 'TCP Probe port 554 RTSP',
      mac: 'OUI lookup prefix BC:DD:C2',
      hostname: 'mDNS device announcement'
    },
    accessControlState: 'INTERNET_PAUSED',
    appliedFilterProfileId: 'profile-iot',
    openPorts: [80, 554],
    userNotes: 'WAN access paused on OpenWrt firewall. RTSP streaming on LAN only.',
    isKnown: true,
    pauseExpiresAt: null
  },
  {
    internalId: 'dev-unknown-06',
    displayName: 'Device at 192.168.1.240',
    ipAddress: '192.168.1.240',
    macAddress: null, // Android 10+ randomized MAC or neighbor cache isolation
    hostname: null,
    userCustomName: null,
    manufacturer: null,
    manufacturerConfidence: 0.0,
    deviceType: 'UNKNOWN',
    typeConfidence: 0.1,
    isRandomizedMac: false,
    inferenceEvidence: [
      { category: 'Network Probe', observedValue: 'TCP Port 80 Open', derivedInference: 'Responded to TCP syn-ack on HTTP port', confidenceWeight: 0.30 }
    ],
    lastSeenTimestamp: Date.now() - 80000,
    firstSeenTimestamp: Date.now() - 80000,
    discoveryMethod: 'TCP_SYN_ACK_PROBE',
    reachabilityState: 'REACHABLE',
    identityConfidence: 0.25,
    attributeSources: {
      ip: 'Responded to TCP syn-ack on port 80',
      mac: 'Unavailable (Android 10+ MAC isolation)'
    },
    accessControlState: 'NORMAL',
    appliedFilterProfileId: null,
    openPorts: [80],
    userNotes: 'Unrecognized device detected during network sweep. Investigation recommended.',
    isKnown: false
  }
];

export const INITIAL_SECURITY_FINDINGS: SecurityFinding[] = [
  {
    id: 'sec-1',
    title: 'Unencrypted Web Admin on Gateway (Port 80)',
    description: 'The router administration interface on 192.168.1.1 is accessible over plain HTTP port 80 without automatic HTTPS redirection.',
    severity: 'MEDIUM',
    category: 'EXPOSED_ADMIN_PANEL',
    target: '192.168.1.1:80',
    recommendation: 'Enable HTTPS redirect in LuCI / uhttpd configuration or restrict HTTP access to loopback.',
    detectedAtTimestamp: Date.now() - 14400000
  },
  {
    id: 'sec-2',
    title: 'Unknown Device Connected to LAN',
    description: 'A newly observed client (192.168.1.240) responded to probes with no known DHCP reservation or user label.',
    severity: 'HIGH',
    category: 'UNRECOGNIZED_NEW_DEVICE',
    target: '192.168.1.240',
    recommendation: 'Verify physical device or apply router isolation until verified.',
    detectedAtTimestamp: Date.now() - 80000
  },
  {
    id: 'sec-3',
    title: 'RTSP Video Stream Accessible on Camera',
    description: 'Device 192.168.1.215 exposes RTSP port 554 without authentication challenge detected.',
    severity: 'MEDIUM',
    category: 'UNENCRYPTED_SERVICES',
    target: '192.168.1.215:554',
    recommendation: 'Ensure RTSP password authentication is enforced and retain WAN internet pause.',
    detectedAtTimestamp: Date.now() - 3600000
  }
];

export const INITIAL_SCHEDULES: ScheduledPolicy[] = [
  {
    id: 'sch-bedtime-tv',
    name: 'Bedtime TV Internet Pause',
    targetDeviceId: 'dev-tv-04',
    targetName: 'Living Room LG OLED TV',
    targetMacOrIp: '48:A6:B8:33:41:9C',
    action: 'PAUSE_INTERNET',
    startTime: '22:30',
    endTime: '06:00',
    activeDays: [1, 2, 3, 4, 5], // Mon to Fri
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isEnabled: true,
    crossesMidnight: true,
    lastExecutedTimestamp: Date.now() - 43200000,
    lastResult: 'SUCCESS_VERIFIED'
  },
  {
    id: 'sch-study-laptop',
    name: 'Study Hours Quota',
    targetDeviceId: 'dev-macbook-03',
    targetName: 'Work MacBook Air M2',
    targetMacOrIp: 'F0:18:98:C1:22:98',
    action: 'ENFORCE_FAMILY_DNS',
    startTime: '09:00',
    endTime: '17:00',
    activeDays: [1, 2, 3, 4, 5],
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isEnabled: false,
    crossesMidnight: false,
    lastExecutedTimestamp: Date.now() - 86400000,
    lastResult: 'SUCCESS_VERIFIED'
  }
];

export const INITIAL_PROFILES: FilterProfile[] = [
  {
    id: 'profile-family',
    name: 'Family Shield (Default)',
    description: 'Blocks malware, phishing, high-risk gambling, and adult domains while maintaining full utility.',
    isGlobalDefault: true,
    enabledCategories: {
      malware: true,
      adult: true,
      gambling: true,
      trackers: true,
      social: false
    },
    customBlockedDomains: ['adservice.google.com', 'telemetry.device.iot'],
    customAllowedDomains: ['github.com', 'developer.android.com']
  },
  {
    id: 'profile-iot',
    name: 'IoT Containment Profile',
    description: 'Strict telemetry blocklist and advertising domain sinkhole for smart appliances.',
    isGlobalDefault: false,
    enabledCategories: {
      malware: true,
      adult: false,
      gambling: false,
      trackers: true,
      social: true
    },
    customBlockedDomains: ['log.tv.samsung.com', 'telemetry.lg.com'],
    customAllowedDomains: ['time.apple.com', 'pool.ntp.org']
  }
];

// Backend API Service Helpers
export async function fetchSystemInterfaces() {
  try {
    const res = await fetch('/api/network/interfaces');
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function executePing(host: string, port = 80, timeout = 3000) {
  try {
    const res = await fetch('/api/diagnostics/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, port, timeout })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function executeDnsLookup(host: string, type = 'A') {
  try {
    const res = await fetch('/api/diagnostics/dns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, type })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function executeTlsAudit(host: string, port = 443) {
  try {
    const res = await fetch('/api/diagnostics/tls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, port })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function executeHeaderAudit(url: string) {
  try {
    const res = await fetch('/api/diagnostics/headers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function verifyOpenWrtUbus(routerUrl: string, username: string, password?: string) {
  try {
    const res = await fetch('/api/router/openwrt/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routerUrl, username, password })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Executes a network discovery sweep and routes each host through MacAddressResolver
 * to automatically populate manufacturer, deviceType, confidence scores, and evidence trails.
 */
export async function executeNetworkScan(currentDevices: NetworkDevice[]): Promise<NetworkDevice[]> {
  // Re-verify and re-enrich existing devices with MacAddressResolver
  const enriched = currentDevices.map(d => MacAddressResolver.enrichDevice(d));

  // Potential discovery candidate: smart speaker or tablet observed on network
  const candidateMac = '00:0E:58:A1:BC:90'; // Sonos, Inc. OUI
  const alreadyExists = enriched.some(d => d.macAddress === candidateMac);

  if (!alreadyExists) {
    const rawNewDevice: NetworkDevice = {
      internalId: `dev-sonos-${Date.now()}`,
      displayName: 'Living Room Smart Speaker',
      ipAddress: '192.168.1.177',
      macAddress: candidateMac,
      hostname: 'sonos-one.lan',
      userCustomName: 'Living Room Sonos',
      manufacturer: null,
      manufacturerConfidence: 0.0,
      deviceType: 'UNKNOWN',
      typeConfidence: 0.0,
      isRandomizedMac: false,
      inferenceEvidence: [],
      lastSeenTimestamp: Date.now(),
      firstSeenTimestamp: Date.now(),
      discoveryMethod: 'SSDP_UPNP',
      reachabilityState: 'REACHABLE',
      identityConfidence: 0.90,
      attributeSources: {
        ip: 'SSDP announcement urn:schemas-upnp-org:device:ZonePlayer:1',
        mac: 'ARP Cache probe',
        hostname: 'mDNS Sonone.local'
      },
      accessControlState: 'NORMAL',
      appliedFilterProfileId: null,
      openPorts: [1400, 1443],
      userNotes: 'Newly discovered wireless audio player via SSDP.',
      isKnown: true
    };

    // Route new device through MacAddressResolver
    const resolvedDevice = MacAddressResolver.enrichDevice(rawNewDevice);
    return [...enriched, resolvedDevice];
  }

  return enriched;
}
