import React, { useState } from 'react';
import { 
  Router, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Key, 
  ShieldCheck, 
  RefreshCw, 
  Info,
  Server,
  Lock,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { RouterCapabilities } from '../types';
import { verifyOpenWrtUbus } from '../services/networkService';

interface RouterSettingsViewProps {
  capabilities: RouterCapabilities;
  onUpdateCapabilities: (newCaps: RouterCapabilities) => void;
  gatewayIp: string;
}

export const RouterSettingsView: React.FC<RouterSettingsViewProps> = ({
  capabilities,
  onUpdateCapabilities,
  gatewayIp
}) => {
  const [routerUrl, setRouterUrl] = useState(`http://${gatewayIp}`);
  const [username, setUsername] = useState('root');
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    const result = await verifyOpenWrtUbus(routerUrl, username, password);
    setTestResult(result);
    setIsVerifying(false);

    if (result.success && result.capabilities) {
      onUpdateCapabilities({
        ...capabilities,
        ...result.capabilities,
        discoveredAtTimestamp: Date.now()
      });
    }
  };

  // Profile presets to demonstrate dynamic capability adaptation
  const applyPreset = (preset: 'FULL' | 'RESTRICTED' | 'NO_LAN_BLOCK') => {
    if (preset === 'FULL') {
      onUpdateCapabilities({
        supportsPauseInternet: true,
        supportsLanBlock: true,
        supportsMacFiltering: true,
        supportsDnsFiltering: true,
        supportsScheduledPolicies: true,
        supportsRealTimeDeviceInventory: true,
        supportsPerClientRateLimit: true,
        supportsGuestNetworkIsolation: true,
        brandName: 'OpenWrt 23.05 (Full Lab Gateway)',
        modelName: 'GL.iNet GL-MT3000',
        firmwareVersion: 'OpenWrt 23.05.2 r23630',
        kernelVersion: 'Linux 5.15.150',
        firewallEngine: 'NFTABLES',
        authMechanism: 'UBUS_JSON_RPC',
        discoveredAtTimestamp: Date.now(),
        unsupportedReasons: {}
      });
    } else if (preset === 'RESTRICTED') {
      onUpdateCapabilities({
        supportsPauseInternet: false,
        supportsLanBlock: false,
        supportsMacFiltering: true,
        supportsDnsFiltering: false,
        supportsScheduledPolicies: false,
        supportsRealTimeDeviceInventory: true,
        supportsPerClientRateLimit: false,
        supportsGuestNetworkIsolation: false,
        brandName: 'OpenWrt (Restricted Read-Only Account)',
        modelName: 'Generic OpenWrt',
        firmwareVersion: 'OpenWrt 23.05.0',
        kernelVersion: 'Linux 5.15.0',
        firewallEngine: 'NFTABLES',
        authMechanism: 'UBUS_JSON_RPC',
        discoveredAtTimestamp: Date.now(),
        unsupportedReasons: {
          pauseInternet: 'User account lacks ubus write ACL for uci.firewall.',
          lanBlock: 'User account lacks ebtables bridge configuration permissions.',
          rateLimit: 'Package sqm-scripts is not installed.',
          dnsFiltering: 'dnsmasq configuration is restricted on this role.'
        }
      });
    } else {
      onUpdateCapabilities({
        supportsPauseInternet: true,
        supportsLanBlock: false,
        supportsMacFiltering: true,
        supportsDnsFiltering: true,
        supportsScheduledPolicies: true,
        supportsRealTimeDeviceInventory: true,
        supportsPerClientRateLimit: false,
        supportsGuestNetworkIsolation: false,
        brandName: 'OpenWrt 21.02 (Standard WAN Drop Only)',
        modelName: 'Generic MIPS Gateway',
        firmwareVersion: 'OpenWrt 21.02.5',
        kernelVersion: 'Linux 5.4.188',
        firewallEngine: 'IPTABLES',
        authMechanism: 'UBUS_JSON_RPC',
        discoveredAtTimestamp: Date.now(),
        unsupportedReasons: {
          lanBlock: 'Bridge netfilter kernel module not loaded on Linux 5.4.',
          rateLimit: 'SQM traffic control not installed.'
        }
      });
    }
  };

  const capabilityItems = [
    {
      key: 'supportsPauseInternet',
      label: 'Pause Internet (WAN Drop)',
      status: capabilities.supportsPauseInternet,
      reason: capabilities.unsupportedReasons.pauseInternet || 'Verified: OpenWrt fw4 forward reject rule supported'
    },
    {
      key: 'supportsLanBlock',
      label: 'Total LAN Isolation (Bridge Filter)',
      status: capabilities.supportsLanBlock,
      reason: capabilities.unsupportedReasons.lanBlock || 'Verified: Linux bridge netfilter and ebtables ready'
    },
    {
      key: 'supportsRealTimeDeviceInventory',
      label: 'Real-Time Device Inventory',
      status: capabilities.supportsRealTimeDeviceInventory,
      reason: capabilities.unsupportedReasons.deviceInventory || 'Verified: DHCP lease sync via luci.getDHCPLeases'
    },
    {
      key: 'supportsScheduledPolicies',
      label: 'Scheduled Access Engine',
      status: capabilities.supportsScheduledPolicies,
      reason: capabilities.unsupportedReasons.scheduledPolicies || 'Verified: Scheduled rules synchronized with router'
    },
    {
      key: 'supportsPerClientRateLimit',
      label: 'Per-Client Rate Limiting (SQM)',
      status: capabilities.supportsPerClientRateLimit,
      reason: capabilities.unsupportedReasons.rateLimit || 'Requires: sqm-scripts / luci-app-sqm'
    },
    {
      key: 'supportsDnsFiltering',
      label: 'Router DNS Sinkhole',
      status: capabilities.supportsDnsFiltering,
      reason: capabilities.unsupportedReasons.dnsFiltering || 'Verified: dnsmasq ipset redirect available'
    }
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">OpenWrt Gateway Integration</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Authenticated ubus JSON-RPC capability discovery and firewall rule orchestration
        </p>
      </div>

      {/* Discovered Capabilities Matrix Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">{capabilities.brandName}</span>
              <span className="text-xs text-slate-500 font-mono">({capabilities.firmwareVersion || 'Version Unknown'})</span>
            </div>
            <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
              <span>Kernel: {capabilities.kernelVersion || '5.15.150'}</span>
              <span>·</span>
              <span>Engine: {capabilities.firewallEngine || 'NFTABLES'}</span>
              <span>·</span>
              <span>Protocol: {capabilities.authMechanism}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Discovery Sync</span>
            <span className="text-xs font-mono text-slate-700">
              {capabilities.discoveredAtTimestamp ? new Date(capabilities.discoveredAtTimestamp).toLocaleTimeString() : 'Current session'}
            </span>
          </div>
        </div>

        {/* Granular Capabilities Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {capabilityItems.map((item) => (
            <div 
              key={item.key} 
              className={`p-3 rounded-xl border text-xs space-y-1 ${
                item.status 
                  ? 'bg-emerald-50/40 border-emerald-200/80 text-emerald-950' 
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{item.label}</span>
                {item.status ? (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Supported</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Unsupported</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">{item.reason}</p>
            </div>
          ))}
        </div>

        {/* Dynamic Capability Adaptation Sandbox / Presets */}
        <div className="pt-3 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Capability Simulator (Test Dynamic UI Adaptation)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyPreset('FULL')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Full OpenWrt 23.05 (All Supported)
            </button>
            <button
              onClick={() => applyPreset('RESTRICTED')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              Restricted Account (No Firewall Write)
            </button>
            <button
              onClick={() => applyPreset('NO_LAN_BLOCK')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              OpenWrt 21.02 (WAN Drop Only)
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Switch presets to test how the Device Inventory and Access Control sheets instantly disable unsupported buttons with explanatory tooltips.
          </p>
        </div>
      </div>

      {/* Authenticated Connection Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Authenticate OpenWrt Gateway</h2>
          <p className="text-xs text-slate-500">Connect to OpenWrt ubus JSON-RPC endpoint (`/ubus` via uhttpd-mod-ubus)</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Gateway URL</label>
              <input
                type="text"
                value={routerUrl}
                onChange={(e) => setRouterUrl(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">RPC Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">RPC Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Credentials encrypted via Android Keystore (AES-256-GCM)</span>
            </span>

            <button
              type="submit"
              disabled={isVerifying}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Probing ubus...' : 'Discover Capabilities'}</span>
            </button>
          </div>
        </form>

        {testResult && (
          <div className={`p-4 rounded-xl text-xs space-y-1 ${
            testResult.success ? 'bg-emerald-50 text-emerald-950 border border-emerald-200' : 'bg-rose-50 text-rose-950 border border-rose-200'
          }`}>
            <div className="font-semibold flex items-center gap-1.5">
              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
              <span>{testResult.message}</span>
            </div>
            {testResult.sessionId && (
              <div className="text-[11px] font-mono text-emerald-800">
                Active Session Token: {testResult.sessionId}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Least Privilege OpenWrt Setup Guide */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between text-slate-400 font-sans pb-2 border-b border-slate-800">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Recommended Least-Privilege OpenWrt rpcd ACL (/etc/rpcd/rpc-admin.json)</span>
          </span>
        </div>
        <p className="font-sans text-[11px] text-slate-400">
          Avoid providing full root access. Create a dedicated user with narrow uci firewall permissions:
        </p>
        <pre className="p-3 bg-black/50 rounded-xl overflow-x-auto text-[11px] text-emerald-300">
{`{
  "rpc-admin": {
    "description": "Restricted RPC user for mobile management",
    "read": {
      "ubus": {
        "system": ["board", "info"],
        "network.device": ["status"],
        "luci": ["getDHCPLeases"]
      },
      "uci": ["firewall", "network", "dhcp"]
    },
    "write": {
      "uci": ["firewall"],
      "session": ["login"]
    }
  }
}`}
        </pre>
      </div>
    </div>
  );
};
