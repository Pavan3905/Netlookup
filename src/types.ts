export type DeviceType = 
  | 'GATEWAY_ROUTER' 
  | 'MOBILE_PHONE' 
  | 'LAPTOP_PC' 
  | 'SMART_TV' 
  | 'IOT_SMART_HOME' 
  | 'PRINTER' 
  | 'STORAGE_NAS' 
  | 'GAMING_CONSOLE' 
  | 'UNKNOWN';

export type ReachabilityState = 'REACHABLE' | 'UNRESPONSIVE' | 'STALE' | 'OFFLINE';

export type DiscoveryMethod = 
  | 'ROUTER_DHCP_TABLE' 
  | 'NEIGHBOR_ARP_CACHE' 
  | 'MDNS_BONJOUR' 
  | 'SSDP_UPNP' 
  | 'TCP_SYN_ACK_PROBE' 
  | 'MANUAL_ENTRY';

export type AccessControlState = 
  | 'NORMAL' 
  | 'INTERNET_PAUSED' 
  | 'BLOCKED_FULL_LAN' 
  | 'DNS_RESTRICTED' 
  | 'SCHEDULE_ACTIVE';

export interface InferenceEvidence {
  category: string;
  observedValue: string;
  derivedInference: string;
  confidenceWeight: number;
}

export interface NetworkDevice {
  internalId: string;
  displayName: string;
  ipAddress: string;
  macAddress: string | null;
  hostname: string | null;
  userCustomName: string | null;
  
  // Inferred Manufacturer & Confidence (0.0 to 1.0)
  manufacturer: string | null;
  manufacturerConfidence: number;
  
  // Inferred Device Type & Confidence (0.0 to 1.0)
  deviceType: DeviceType;
  typeConfidence: number;
  
  isRandomizedMac: boolean;
  inferenceEvidence: InferenceEvidence[];
  
  lastSeenTimestamp: number;
  firstSeenTimestamp: number;
  discoveryMethod: DiscoveryMethod;
  reachabilityState: ReachabilityState;
  identityConfidence: number;
  attributeSources: Record<string, string>;
  accessControlState: AccessControlState;
  appliedFilterProfileId: string | null;
  openPorts: number[];
  userNotes: string | null;
  isKnown: boolean;
  pauseExpiresAt?: number | null;
}

export interface RouterCapabilities {
  supportsPauseInternet: boolean;
  supportsLanBlock: boolean;
  supportsMacFiltering: boolean;
  supportsDnsFiltering: boolean;
  supportsScheduledPolicies: boolean;
  supportsRealTimeDeviceInventory: boolean;
  supportsPerClientRateLimit: boolean;
  supportsGuestNetworkIsolation: boolean;
  brandName: string;
  modelName?: string | null;
  firmwareVersion: string | null;
  kernelVersion?: string | null;
  firewallEngine?: 'NFTABLES' | 'IPTABLES' | 'EBTABLES' | 'UNKNOWN';
  authMechanism: 'UBUS_JSON_RPC' | 'LUCI_RPC' | 'SSH_KEY' | 'UNSUPPORTED';
  discoveredAtTimestamp?: number;
  unsupportedReasons: Record<string, string>;
}

export interface ScheduledPolicy {
  id: string;
  name: string;
  targetDeviceId: string;
  targetName: string;
  targetMacOrIp: string;
  action: 'PAUSE_INTERNET' | 'BLOCK_ALL_TRAFFIC' | 'ENFORCE_FAMILY_DNS';
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  activeDays: number[]; // 1=Mon, 7=Sun
  timeZone: string;
  isEnabled: boolean;
  crossesMidnight: boolean;
  lastExecutedTimestamp?: number;
  lastResult?: 'SUCCESS_VERIFIED' | 'UNSUPPORTED' | 'FAILED';
}

export interface FilterProfile {
  id: string;
  name: string;
  description: string;
  isGlobalDefault: boolean;
  enabledCategories: {
    malware: boolean;
    adult: boolean;
    gambling: boolean;
    trackers: boolean;
    social: boolean;
  };
  customBlockedDomains: string[];
  customAllowedDomains: string[];
}

export interface SecurityFinding {
  id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: string;
  target: string;
  recommendation: string;
  detectedAtTimestamp: number;
}

export interface DnsLogEntry {
  id: string;
  timestamp: string;
  domain: string;
  type: string;
  action: 'ALLOWED' | 'BLOCKED_MALWARE' | 'BLOCKED_CATEGORY' | 'BLOCKED_USER';
  clientIp: string;
  latencyMs: number;
}
