import React, { useState } from 'react';
import { 
  Activity, 
  Globe, 
  ShieldCheck, 
  Download, 
  ArrowRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { SecurityFinding } from '../types';
import { executePing, executeDnsLookup } from '../services/networkService';

interface DiagnosticsViewProps {
  securityFindings: SecurityFinding[];
  gatewayIp: string;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({
  securityFindings,
  gatewayIp
}) => {
  const [pingHost, setPingHost] = useState(gatewayIp);
  const [pingResult, setPingResult] = useState<any>(null);
  const [isPinging, setIsPinging] = useState(false);

  const [dnsHost, setDnsHost] = useState('google.com');
  const [dnsResult, setDnsResult] = useState<any>(null);
  const [isResolving, setIsResolving] = useState(false);

  const handlePing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPinging(true);
    const res = await executePing(pingHost, 80);
    setPingResult(res);
    setIsPinging(false);
  };

  const handleDns = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResolving(true);
    const res = await executeDnsLookup(dnsHost, 'A');
    setDnsResult(res);
    setIsResolving(false);
  };

  const exportReport = () => {
    const reportData = {
      title: 'Network Security Audit Report',
      date: new Date().toLocaleDateString(),
      findings: securityFindings
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Tools</h1>
          <p className="text-xs text-slate-500">Latency tests, DNS resolution, and network audits</p>
        </div>

        <button
          onClick={exportReport}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit</span>
        </button>
      </div>

      {/* Latency Test Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900">Latency & Connection Test</h2>
            <p className="text-[11px] text-slate-500">Tests real network roundtrip time</p>
          </div>
        </div>

        <form onSubmit={handlePing} className="flex gap-2">
          <input
            type="text"
            value={pingHost}
            onChange={(e) => setPingHost(e.target.value)}
            placeholder="Host or IP"
            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
          />
          <button
            type="submit"
            disabled={isPinging}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
          >
            {isPinging ? 'Testing...' : 'Test'}
          </button>
        </form>

        {pingResult && (
          <div className="p-3 bg-slate-50 rounded-xl text-xs flex items-center justify-between font-mono">
            <span className="text-slate-600">Response from {pingResult.host}:</span>
            <span className={`font-bold ${pingResult.success ? 'text-emerald-700' : 'text-rose-600'}`}>
              {pingResult.success ? `${pingResult.latencyMs} ms (Connected)` : 'Host Unreachable'}
            </span>
          </div>
        )}
      </div>

      {/* DNS Lookup Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900">DNS Domain Lookup</h2>
            <p className="text-[11px] text-slate-500">Query resolved IP records</p>
          </div>
        </div>

        <form onSubmit={handleDns} className="flex gap-2">
          <input
            type="text"
            value={dnsHost}
            onChange={(e) => setDnsHost(e.target.value)}
            placeholder="e.g. google.com"
            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
          />
          <button
            type="submit"
            disabled={isResolving}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
          >
            {isResolving ? 'Resolving...' : 'Lookup'}
          </button>
        </form>

        {dnsResult && (
          <div className="p-3 bg-slate-50 rounded-xl text-xs font-mono flex items-center justify-between">
            <span className="text-slate-600">{dnsResult.host}:</span>
            <span className="font-bold text-slate-900">
              {Array.isArray(dnsResult.records) ? dnsResult.records[0] : dnsResult.records || 'Resolved'}
            </span>
          </div>
        )}
      </div>

      {/* Security Findings List */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-1">
          Network Security Checks ({securityFindings.length})
        </h2>

        <div className="space-y-2">
          {securityFindings.map((finding) => (
            <div key={finding.id} className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900">{finding.title}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  finding.severity === 'CRITICAL' || finding.severity === 'HIGH'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {finding.severity}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">{finding.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
