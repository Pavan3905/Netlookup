import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { BottomNavBar, NavTabId } from './components/BottomNavBar';
import { DashboardView } from './components/DashboardView';
import { DeviceInventoryView } from './components/DeviceInventoryView';
import { AccessControlView } from './components/AccessControlView';
import { DnsVpnView } from './components/DnsVpnView';
import { DiagnosticsView } from './components/DiagnosticsView';
import { RouterSettingsView } from './components/RouterSettingsView';
import { AndroidCodeInspectorView } from './components/AndroidCodeInspectorView';
import { 
  NetworkDevice, 
  RouterCapabilities, 
  ScheduledPolicy, 
  FilterProfile, 
  SecurityFinding, 
  DnsLogEntry 
} from './types';
import { 
  INITIAL_DEVICES, 
  INITIAL_SECURITY_FINDINGS, 
  INITIAL_SCHEDULES, 
  INITIAL_PROFILES, 
  fetchSystemInterfaces,
  executeNetworkScan
} from './services/networkService';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [devices, setDevices] = useState<NetworkDevice[]>(INITIAL_DEVICES);
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);
  const [securityFindings, setSecurityFindings] = useState<SecurityFinding[]>(INITIAL_SECURITY_FINDINGS);
  const [schedules, setSchedules] = useState<ScheduledPolicy[]>(INITIAL_SCHEDULES);
  const [profiles, setProfiles] = useState<FilterProfile[]>(INITIAL_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState<string>('profile-family');
  const [vpnActive, setVpnActive] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [systemInterface, setSystemInterface] = useState<any>(null);

  // Router capabilities
  const [routerCapabilities, setRouterCapabilities] = useState<RouterCapabilities>({
    supportsPauseInternet: true,
    supportsLanBlock: true,
    supportsMacFiltering: true,
    supportsDnsFiltering: true,
    supportsScheduledPolicies: true,
    supportsRealTimeDeviceInventory: true,
    supportsPerClientRateLimit: false,
    supportsGuestNetworkIsolation: true,
    brandName: 'OpenWrt 23.05 (Gateway)',
    modelName: 'GL.iNet GL-MT3000',
    firmwareVersion: 'OpenWrt 23.05.2 r23630',
    kernelVersion: 'Linux 5.15.150',
    firewallEngine: 'NFTABLES',
    authMechanism: 'UBUS_JSON_RPC',
    discoveredAtTimestamp: Date.now() - 7200000,
    unsupportedReasons: {
      rateLimit: "Package 'sqm-scripts' or 'luci-app-sqm' not installed on router."
    }
  });

  // Live DNS Log Entries
  const [dnsLogs, setDnsLogs] = useState<DnsLogEntry[]>([
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 10000).toISOString(),
      domain: 'api.github.com',
      type: 'A',
      action: 'ALLOWED',
      clientIp: '192.168.1.102',
      latencyMs: 14
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 25000).toISOString(),
      domain: 'trackers.adservice.net',
      type: 'A',
      action: 'BLOCKED_CATEGORY',
      clientIp: '192.168.1.102',
      latencyMs: 1
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 40000).toISOString(),
      domain: 'connectivitycheck.gstatic.com',
      type: 'A',
      action: 'ALLOWED',
      clientIp: '192.168.1.102',
      latencyMs: 8
    }
  ]);

  useEffect(() => {
    fetchSystemInterfaces().then((res) => {
      if (res && res.primaryInterface) {
        setSystemInterface(res.primaryInterface);
      }
    });
  }, []);

  // Periodic DNS Packet Simulation when VPN is active
  useEffect(() => {
    if (!vpnActive) return;

    const domainsPool = [
      { d: 'cloud.google.com', cat: 'ALLOWED' as const },
      { d: 'analytics.device-tracking.io', cat: 'BLOCKED_CATEGORY' as const },
      { d: 'raw.githubusercontent.com', cat: 'ALLOWED' as const },
      { d: 'malware-threat-feed.top', cat: 'BLOCKED_MALWARE' as const },
      { d: 'time.cloudflare.com', cat: 'ALLOWED' as const }
    ];

    const interval = setInterval(() => {
      const pick = domainsPool[Math.floor(Math.random() * domainsPool.length)];
      const newEntry: DnsLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        domain: pick.d,
        type: 'A',
        action: pick.cat,
        clientIp: '192.168.1.102',
        latencyMs: pick.cat === 'ALLOWED' ? Math.floor(Math.random() * 20) + 5 : 1
      };

      setDnsLogs(prev => [newEntry, ...prev.slice(0, 49)]);
    }, 5000);

    return () => clearInterval(interval);
  }, [vpnActive]);

  // Network scan
  const handleStartScan = async () => {
    setIsScanning(true);
    try {
      const scanned = await executeNetworkScan(devices);
      setTimeout(() => {
        setDevices(scanned);
        setIsScanning(false);
      }, 1200);
    } catch {
      setIsScanning(false);
    }
  };

  // Device actions
  const handleUpdateDevice = (updated: NetworkDevice) => {
    setDevices(devices.map(d => d.internalId === updated.internalId ? updated : d));
  };

  const handlePauseDevice = (device: NetworkDevice, durationMinutes?: number) => {
    const expiresAt = durationMinutes ? Date.now() + durationMinutes * 60 * 1000 : null;
    const updated: NetworkDevice = {
      ...device,
      accessControlState: 'INTERNET_PAUSED',
      pauseExpiresAt: expiresAt
    };
    handleUpdateDevice(updated);
    if (selectedDevice?.internalId === device.internalId) {
      setSelectedDevice(updated);
    }
  };

  const handleResumeDevice = (device: NetworkDevice) => {
    const updated: NetworkDevice = {
      ...device,
      accessControlState: 'NORMAL',
      pauseExpiresAt: null
    };
    handleUpdateDevice(updated);
    if (selectedDevice?.internalId === device.internalId) {
      setSelectedDevice(updated);
    }
  };

  const handleTogglePause = (device: NetworkDevice) => {
    if (device.accessControlState === 'INTERNET_PAUSED' || device.accessControlState === 'BLOCKED_FULL_LAN') {
      handleResumeDevice(device);
    } else {
      handlePauseDevice(device);
    }
  };

  const handleBlockDevice = (device: NetworkDevice) => {
    const updated: NetworkDevice = {
      ...device,
      accessControlState: 'BLOCKED_FULL_LAN'
    };
    handleUpdateDevice(updated);
    if (selectedDevice?.internalId === device.internalId) {
      setSelectedDevice(updated);
    }
  };

  // Schedule actions
  const handleAddSchedule = (sch: ScheduledPolicy) => {
    setSchedules([...schedules, sch]);
  };

  const handleToggleSchedule = (id: string) => {
    setSchedules(schedules.map(s => s.id === id ? { ...s, isEnabled: !s.isEnabled } : s));
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  const handleRestoreAllPolicies = () => {
    setDevices(devices.map(d => ({ ...d, accessControlState: 'NORMAL', pauseExpiresAt: null })));
  };

  // Category filters
  const handleToggleCategory = (category: 'malware' | 'adult' | 'gambling' | 'trackers' | 'social') => {
    setProfiles(profiles.map(p => {
      if (p.id === activeProfileId) {
        return {
          ...p,
          enabledCategories: {
            ...p.enabledCategories,
            [category]: !p.enabledCategories[category]
          }
        };
      }
      return p;
    }));
  };

  const handleAddDomainRule = (domain: string, isBlock: boolean) => {
    setProfiles(profiles.map(p => {
      if (p.id === activeProfileId) {
        if (isBlock) {
          return { ...p, customBlockedDomains: [...p.customBlockedDomains, domain] };
        } else {
          return { ...p, customAllowedDomains: [...p.customAllowedDomains, domain] };
        }
      }
      return p;
    }));
  };

  const handleRemoveDomainRule = (domain: string, isBlock: boolean) => {
    setProfiles(profiles.map(p => {
      if (p.id === activeProfileId) {
        if (isBlock) {
          return { ...p, customBlockedDomains: p.customBlockedDomains.filter(d => d !== domain) };
        } else {
          return { ...p, customAllowedDomains: p.customAllowedDomains.filter(d => d !== domain) };
        }
      }
      return p;
    }));
  };

  const unresolvedFindingCount = securityFindings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-500/20">
      {/* Top Bar */}
      <TopBar
        activeTab={activeTab}
        isMobileFrame={isMobileFrame}
        onToggleFrame={() => setIsMobileFrame(!isMobileFrame)}
        vpnActive={vpnActive}
        deviceCount={devices.length}
        onOpenRouter={() => setActiveTab('router')}
        onOpenCode={() => setActiveTab('code')}
      />

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto p-4 transition-all ${
        isMobileFrame ? 'max-w-[420px] my-4 shadow-xl rounded-3xl bg-slate-50 border-8 border-slate-900 overflow-hidden min-h-[800px]' : 'max-w-4xl'
      }`}>
        {/* Phone Frame Status Bar */}
        {isMobileFrame && (
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-2 mb-2 border-b border-slate-200">
            <span>09:41</span>
            <span>Wi-Fi 6 · 100%</span>
          </div>
        )}

        {/* Dynamic Category Views */}
        {activeTab === 'overview' && (
          <DashboardView
            devices={devices}
            securityFindings={securityFindings}
            vpnActive={vpnActive}
            onToggleVpn={() => setVpnActive(!vpnActive)}
            isScanning={isScanning}
            onStartScan={handleStartScan}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSelectDevice={(device) => {
              setSelectedDevice(device);
              setActiveTab('devices');
            }}
            onTogglePauseDevice={handleTogglePause}
            systemInterface={systemInterface}
          />
        )}

        {activeTab === 'devices' && (
          <DeviceInventoryView
            devices={devices}
            routerCapabilities={routerCapabilities}
            onUpdateDevice={handleUpdateDevice}
            onPauseDevice={handlePauseDevice}
            onResumeDevice={handleResumeDevice}
            onBlockDevice={handleBlockDevice}
            onUnblockDevice={handleResumeDevice}
            selectedDevice={selectedDevice}
            onSelectDevice={setSelectedDevice}
          />
        )}

        {activeTab === 'control' && (
          <AccessControlView
            schedules={schedules}
            devices={devices}
            routerCapabilities={routerCapabilities}
            onAddSchedule={handleAddSchedule}
            onToggleSchedule={handleToggleSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onRestoreAllPolicies={handleRestoreAllPolicies}
          />
        )}

        {activeTab === 'protection' && (
          <DnsVpnView
            vpnActive={vpnActive}
            onToggleVpn={() => setVpnActive(!vpnActive)}
            profiles={profiles}
            activeProfileId={activeProfileId}
            onSelectProfile={setActiveProfileId}
            onToggleCategory={handleToggleCategory}
            onAddDomainRule={handleAddDomainRule}
            onRemoveDomainRule={handleRemoveDomainRule}
            dnsLogs={dnsLogs}
          />
        )}

        {activeTab === 'tools' && (
          <DiagnosticsView
            securityFindings={securityFindings}
            gatewayIp="192.168.1.1"
          />
        )}

        {activeTab === 'router' && (
          <RouterSettingsView
            capabilities={routerCapabilities}
            onUpdateCapabilities={setRouterCapabilities}
            gatewayIp="192.168.1.1"
          />
        )}

        {activeTab === 'code' && (
          <AndroidCodeInspectorView />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavBar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        unresolvedFindingCount={unresolvedFindingCount}
      />
    </div>
  );
}
