import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { FilterProfile, DnsLogEntry } from '../types';

interface DnsVpnViewProps {
  vpnActive: boolean;
  onToggleVpn: () => void;
  profiles: FilterProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onToggleCategory: (category: 'malware' | 'adult' | 'gambling' | 'trackers' | 'social') => void;
  onAddDomainRule: (domain: string, isBlock: boolean) => void;
  onRemoveDomainRule: (domain: string, isBlock: boolean) => void;
  dnsLogs: DnsLogEntry[];
}

export const DnsVpnView: React.FC<DnsVpnViewProps> = ({
  vpnActive,
  onToggleVpn,
  profiles,
  activeProfileId,
  onToggleCategory,
  onAddDomainRule,
  onRemoveDomainRule,
  dnsLogs
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [ruleType, setRuleType] = useState<'BLOCK' | 'ALLOW'>('BLOCK');

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    onAddDomainRule(newDomain.trim().toLowerCase(), ruleType === 'BLOCK');
    setNewDomain('');
  };

  const categories = [
    { key: 'malware', label: 'Malware & Phishing', desc: 'Blocks suspicious and known malicious domains' },
    { key: 'trackers', label: 'Ads & Web Trackers', desc: 'Stops background trackers and analytics' },
    { key: 'adult', label: 'Adult Content', desc: 'Family-friendly filtering for explicit websites' },
    { key: 'gambling', label: 'Gambling', desc: 'Restricts betting and gambling portals' }
  ] as const;

  const blockedCount = dnsLogs.filter(l => l.action.startsWith('BLOCKED')).length;

  return (
    <div className="space-y-4 pb-24">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Protection</h1>
        <p className="text-xs text-slate-500">Device-level DNS firewall and content filters</p>
      </div>

      {/* Main VPN Shield Card */}
      <div className={`p-6 rounded-3xl text-center space-y-4 transition-all shadow-xs ${
        vpnActive 
          ? 'bg-slate-900 text-white' 
          : 'bg-white border border-slate-200/80 text-slate-900'
      }`}>
        <div className="flex flex-col items-center justify-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
            vpnActive 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
              : 'bg-slate-100 text-slate-400'
          }`}>
            {vpnActive ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
          </div>

          <h2 className="text-base font-bold mt-3">
            {vpnActive ? 'Protection Active' : 'Protection Disabled'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {vpnActive 
              ? `Filtered ${blockedCount} threats on this device` 
              : 'Turn on to filter ads, trackers, and malware'}
          </p>
        </div>

        <button
          onClick={onToggleVpn}
          className={`w-full py-3 rounded-2xl text-xs font-bold transition-all shadow-xs ${
            vpnActive 
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          {vpnActive ? 'Turn Off Protection' : 'Enable DNS Shield'}
        </button>
      </div>

      {/* Category Toggles */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-1">Filter Categories</h2>

        <div className="space-y-2">
          {categories.map((cat) => {
            const isEnabled = activeProfile.enabledCategories[cat.key];
            return (
              <div
                key={cat.key}
                onClick={() => onToggleCategory(cat.key)}
                className="p-3 rounded-xl hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900">{cat.label}</div>
                  <div className="text-[11px] text-slate-500">{cat.desc}</div>
                </div>

                <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                  isEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}>
                  <div className="bg-white w-4 h-4 rounded-full shadow-xs" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expandable Domain Custom Rules */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700"
        >
          <span>Custom Domain Rules ({activeProfile.customBlockedDomains.length + activeProfile.customAllowedDomains.length})</span>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="pt-2 space-y-3">
            <form onSubmit={handleAddDomain} className="flex gap-2">
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as 'BLOCK' | 'ALLOW')}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="BLOCK">Block</option>
                <option value="ALLOW">Allow</option>
              </select>
              <input
                type="text"
                placeholder="domain.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Add
              </button>
            </form>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1 font-mono text-xs">
              {activeProfile.customBlockedDomains.map((d) => (
                <div key={d} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between">
                  <span className="text-slate-800">{d}</span>
                  <button onClick={() => onRemoveDomainRule(d, true)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
