import React, { useState } from 'react';
import { 
  Search, 
  Pause, 
  Play, 
  Ban, 
  Laptop, 
  Smartphone, 
  Tv, 
  Radio, 
  Camera, 
  Cpu, 
  Printer, 
  X, 
  ChevronRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { NetworkDevice, RouterCapabilities, DeviceType } from '../types';

interface DeviceInventoryViewProps {
  devices: NetworkDevice[];
  routerCapabilities: RouterCapabilities;
  onUpdateDevice: (device: NetworkDevice) => void;
  onPauseDevice: (device: NetworkDevice, durationMinutes?: number) => void;
  onResumeDevice: (device: NetworkDevice) => void;
  onBlockDevice: (device: NetworkDevice) => void;
  onUnblockDevice: (device: NetworkDevice) => void;
  selectedDevice: NetworkDevice | null;
  onSelectDevice: (device: NetworkDevice | null) => void;
}

export const DeviceInventoryView: React.FC<DeviceInventoryViewProps> = ({
  devices,
  routerCapabilities,
  onUpdateDevice,
  onPauseDevice,
  onResumeDevice,
  onBlockDevice,
  onUnblockDevice,
  selectedDevice,
  onSelectDevice
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PHONES' | 'COMPUTERS' | 'TV' | 'IOT' | 'PAUSED'>('ALL');
  const [editingCustomName, setEditingCustomName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  const filteredDevices = devices.filter((device) => {
    const matchesSearch = 
      device.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.ipAddress.includes(searchQuery) ||
      (device.manufacturer && device.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (categoryFilter === 'PHONES') return device.deviceType === 'MOBILE_PHONE';
    if (categoryFilter === 'COMPUTERS') return device.deviceType === 'LAPTOP_PC';
    if (categoryFilter === 'TV') return device.deviceType === 'SMART_TV';
    if (categoryFilter === 'IOT') return device.deviceType === 'IOT_SMART_HOME';
    if (categoryFilter === 'PAUSED') return device.accessControlState === 'INTERNET_PAUSED' || device.accessControlState === 'BLOCKED_FULL_LAN';
    return true;
  });

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

  const handleOpenDetail = (device: NetworkDevice) => {
    onSelectDevice(device);
    setEditingCustomName(device.userCustomName || '');
    setIsEditingName(false);
  };

  const handleSaveCustomName = () => {
    if (!selectedDevice) return;
    const updated = {
      ...selectedDevice,
      userCustomName: editingCustomName.trim() || null,
      displayName: editingCustomName.trim() || selectedDevice.hostname || `${selectedDevice.manufacturer || 'Device'} at ${selectedDevice.ipAddress}`,
      isKnown: true
    };
    onUpdateDevice(updated);
    onSelectDevice(updated);
    setIsEditingName(false);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Title & Simple Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Devices</h1>
          <p className="text-xs text-slate-500">{devices.length} devices connected to your network</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search device or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
          />
        </div>
      </div>

      {/* Clean Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ALL', label: `All (${devices.length})` },
          { id: 'PHONES', label: 'Phones' },
          { id: 'COMPUTERS', label: 'Computers' },
          { id: 'TV', label: 'Smart TVs' },
          { id: 'IOT', label: 'Smart Home' },
          { id: 'PAUSED', label: 'Paused' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategoryFilter(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
              categoryFilter === tab.id
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Devices List */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
        {filteredDevices.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No devices found in this category.
          </div>
        ) : (
          filteredDevices.map((device) => {
            const DeviceIcon = getDeviceIcon(device.deviceType);
            const isPaused = device.accessControlState === 'INTERNET_PAUSED';
            const isBlocked = device.accessControlState === 'BLOCKED_FULL_LAN';

            return (
              <div
                key={device.internalId}
                onClick={() => handleOpenDetail(device)}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <DeviceIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>{device.displayName}</span>
                      {device.isRandomizedMac && (
                        <span className="text-[10px] text-slate-400 font-normal">· Private MAC</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                      <span>{device.ipAddress}</span>
                      <span>·</span>
                      <span className="font-sans font-medium text-slate-700">
                        {device.manufacturer || 'Unknown'}
                      </span>
                      {device.manufacturerConfidence > 0 && (
                        <span className="font-sans text-[10px] text-emerald-700">
                          ({Math.round(device.manufacturerConfidence * 100)}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      if (isPaused || isBlocked) {
                        onResumeDevice(device);
                      } else {
                        onPauseDevice(device);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      isPaused || isBlocked
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isPaused || isBlocked ? (
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
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sleek Device Details Modal */}
      {selectedDevice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Device Details</span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">{selectedDevice.displayName}</h2>
              </div>
              <button
                onClick={() => onSelectDevice(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Custom Name Edit */}
            <div className="p-3 bg-slate-50 rounded-xl text-xs flex items-center justify-between gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={editingCustomName}
                    onChange={(e) => setEditingCustomName(e.target.value)}
                    placeholder="Enter device name..."
                    className="flex-1 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                  <button
                    onClick={handleSaveCustomName}
                    className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="px-2 py-1 text-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-slate-600">Label: <strong>{selectedDevice.displayName}</strong></span>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-emerald-700 font-semibold"
                  >
                    Rename
                  </button>
                </>
              )}
            </div>

            {/* Inferred Identity Card */}
            <div className="p-4 bg-slate-50 rounded-2xl space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block text-[11px]">Manufacturer</span>
                  <span className="font-semibold text-slate-900">{selectedDevice.manufacturer || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Confidence</span>
                  <span className="font-semibold text-emerald-700">
                    {Math.round(selectedDevice.manufacturerConfidence * 100)}% (IEEE OUI)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">IP Address</span>
                  <span className="font-mono text-slate-900">{selectedDevice.ipAddress}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">MAC Address</span>
                  <span className="font-mono text-slate-900">{selectedDevice.macAddress || 'Isolated'}</span>
                </div>
              </div>

              {selectedDevice.isRandomizedMac && (
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  Private Wi-Fi Address is enabled on this device for privacy.
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex items-center justify-between gap-3">
              {selectedDevice.accessControlState === 'INTERNET_PAUSED' ? (
                <button
                  onClick={() => onResumeDevice(selectedDevice)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Resume Internet</span>
                </button>
              ) : (
                <button
                  onClick={() => onPauseDevice(selectedDevice)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Internet</span>
                </button>
              )}

              <button
                onClick={() => onSelectDevice(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
