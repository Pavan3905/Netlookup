import React from 'react';
import { 
  Wifi, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  ArrowRight, 
  Pause, 
  Play, 
  Laptop, 
  Smartphone, 
  Tv, 
  Camera, 
  Cpu, 
  Printer, 
  Radio
} from 'lucide-react';
import { NetworkDevice, SecurityFinding, DeviceType } from '../types';

interface DashboardViewProps {
  devices: NetworkDevice[];
  securityFindings: SecurityFinding[];
  vpnActive: boolean;
  onToggleVpn: () => void;
  isScanning: boolean;
  onStartScan: () => void;
  onNavigateTab: (tab: any) => void;
  onSelectDevice: (device: NetworkDevice) => void;
  onTogglePauseDevice: (device: NetworkDevice) => void;
  systemInterface: any;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  devices,
  securityFindings,
  vpnActive,
  onToggleVpn,
  isScanning,
  onStartScan,
  onNavigateTab,
  onSelectDevice,
  onTogglePauseDevice,
  systemInterface
}) => {
  const pausedCount = devices.filter(d => d.accessControlState === 'INTERNET_PAUSED' || d.accessControlState === 'BLOCKED_FULL_LAN').length;
  const criticalCount = securityFindings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').length;

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'GATEWAY_ROUTER': return Radio;
      case 'MOBILE_PHONE': return Smartphone;
      case 'LAPTOP_PC': return Laptop;
      case 'SMART_TV': return Tv;
      case 'IOT_SMART_HOME': return Camera;
      case 'PRINTER': return Printer;
      default: return Cpu;
    }
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Hero Connection Card */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">Home Wi-Fi</h1>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded">
                  Connected
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Gateway 192.168.1.1 · Latency 4ms
              </div>
            </div>
          </div>

          <button
            onClick={onStartScan}
            disabled={isScanning}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Scan Network'}</span>
          </button>
        </div>

        {isScanning && (
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        )}
      </div>

      {/* 3 Clean Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div 
          onClick={() => onNavigateTab('devices')}
          className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 cursor-pointer transition-all shadow-2xs"
        >
          <div className="text-xs font-medium text-slate-500">Devices</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">{devices.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">All active</div>
        </div>

        <div 
          onClick={() => onNavigateTab('control')}
          className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 cursor-pointer transition-all shadow-2xs"
        >
          <div className="text-xs font-medium text-slate-500">Paused</div>
          <div className={`text-2xl font-bold mt-1 font-mono tabular-nums ${pausedCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {pausedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Internet paused</div>
        </div>

        <div 
          onClick={() => onNavigateTab('protection')}
          className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 cursor-pointer transition-all shadow-2xs"
        >
          <div className="text-xs font-medium text-slate-500">DNS Shield</div>
          <div className={`text-2xl font-bold mt-1 ${vpnActive ? 'text-emerald-600' : 'text-slate-400'}`}>
            {vpnActive ? 'On' : 'Off'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Local protection</div>
        </div>
      </div>

      {/* Protection Quick Toggle Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            vpnActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
          }`}>
            {vpnActive ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Phone Protection (DNS Shield)</div>
            <div className="text-xs text-slate-500">Blocks malware, ads, and telemetry on this phone</div>
          </div>
        </div>

        <button
          onClick={onToggleVpn}
          className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
            vpnActive ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
          }`}
        >
          <div className="bg-white w-4 h-4 rounded-full shadow-xs" />
        </button>
      </div>

      {/* Discovered Devices Quick List */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Connected Devices</h2>
          <button
            onClick={() => onNavigateTab('devices')}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>See all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {devices.slice(0, 5).map((device) => {
            const DeviceIcon = getDeviceIcon(device.deviceType);
            const isPaused = device.accessControlState === 'INTERNET_PAUSED';

            return (
              <div 
                key={device.internalId}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 -mx-2 rounded-xl transition-colors cursor-pointer"
                onClick={() => onSelectDevice(device)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <DeviceIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{device.displayName}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                      <span>{device.ipAddress}</span>
                      <span>·</span>
                      <span className="font-sans">{device.manufacturer || 'Unknown vendor'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onTogglePauseDevice(device)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                      isPaused 
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-3 h-3 fill-amber-800" />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3" />
                        <span>Pause</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
