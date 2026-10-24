import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Globe, 
  Download, 
  ArrowRight,
  AlertTriangle,
  Lock,
  Radio,
  Search,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { SecurityFinding } from '../types';
import { executePing, executeDnsLookup, executePortAudit, executeHeaderAudit } from '../services/networkService';

interface DiagnosticsViewProps {
  securityFindings: SecurityFinding[];
  gatewayIp: string;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({
  securityFindings,
  gatewayIp
}) => {
  // Service & Port Exposure Auditor State
  const [targetHost, setTargetHost] = useState(gatewayIp);
  const [portAuditResult, setPortAuditResult] = useState<any>(null);
  const [isAuditingPorts, setIsAuditingPorts] = useState(false);

  // Web Security Headers Audit State
  const [webUrl, setWebUrl] = useState(`http://${gatewayIp}`);
  const [webAuditResult, setWebAuditResult] = useState<any>(null);
  const [isAuditingWeb, setIsAuditingWeb] = useState(false);

  // DNS & SPF/DMARC Recon State
  const [dnsTarget, setDnsTarget] = useState('cloudflare.com');
  const [dnsRecordType, setDnsRecordType] = useState('TXT');
  const [dnsResult, setDnsResult] = useState<any>(null);
  const [isQueryingDns, setIsQueryingDns] = useState(false);

  // Real Ping Latency
  const [pingResult, setPingResult] = useState<any>(null);
  const [isPinging, setIsPinging] = useState(false);

  const handlePortAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetHost.trim()) return;
    setIsAuditingPorts(true);
    const res = await executePortAudit(targetHost.trim());
    setPortAuditResult(res);
    setIsAuditingPorts(false);
  };

  const handleWebAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webUrl.trim()) return;
    setIsAuditingWeb(true);
    const res = await executeHeaderAudit(webUrl.trim());
    setWebAuditResult(res);
    setIsAuditingWeb(false);
  };

  const handleDnsRecon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dnsTarget.trim()) return;
    setIsQueryingDns(true);
    const res = await executeDnsLookup(dnsTarget.trim(), dnsRecordType);
    setDnsResult(res);
    setIsQueryingDns(false);
  };

  const handleQuickPing = async () => {
    setIsPinging(true);
    const res = await executePing(gatewayIp, 80);
    setPingResult(res);
    setIsPinging(false);
  };

  const exportSecurityReport = () => {
    const reportData = {
      title: 'Ethical Security Audit & Exposure Assessment',
      generatedAt: new Date().toISOString(),
      scope: 'Authorized Target Assessment',
      summary: {
        activeFindings: securityFindings.length,
        criticalIssues: securityFindings.filter(f => f.severity === 'CRITICAL').length,
        highIssues: securityFindings.filter(f => f.severity === 'HIGH').length
      },
      findings: securityFindings,
      portAudit: portAuditResult,
      webSecurityAudit: webAuditResult,
      dnsReconnaissance: dnsResult
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Title & Scope Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Security Audits</h1>
          <p className="text-xs text-slate-500">Ethical exposure auditing, open service inspection, and defense assessment</p>
        </div>

        <button
          onClick={exportSecurityReport}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-2xs self-start sm:self-auto transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Report</span>
        </button>
      </div>

      {/* Security Findings Summary Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Observed Vulnerabilities & Misconfigurations ({securityFindings.length})
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">Scope: Authorized LAN</span>
        </div>

        <div className="space-y-2">
          {securityFindings.map((finding) => (
            <div key={finding.id} className="p-3 bg-slate-50 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    finding.severity === 'CRITICAL' ? 'bg-rose-600 text-white' :
                    finding.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                    finding.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {finding.severity}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{finding.title}</span>
                </div>
                <span className="text-xs font-mono text-slate-500">{finding.target}</span>
              </div>
              <p className="text-xs text-slate-600 leading-normal">{finding.description}</p>
              <div className="text-[11px] text-slate-700 pt-1 border-t border-slate-200/60 font-medium">
                Remediation: <span className="font-normal text-slate-600">{finding.recommendation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tool 1: Port & Service Exposure Auditor */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900">Port & Service Exposure Audit</h2>
            <p className="text-[11px] text-slate-500">Audits authorized host for cleartext or high-risk listening services</p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Common Admin & Media Ports</span>
        </div>

        <form onSubmit={handlePortAudit} className="flex gap-2">
          <input
            type="text"
            value={targetHost}
            onChange={(e) => setTargetHost(e.target.value)}
            placeholder="Target IP or Hostname"
            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
          />
          <button
            type="submit"
            disabled={isAuditingPorts}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            {isAuditingPorts ? 'Auditing...' : 'Audit Target'}
          </button>
        </form>

        {portAuditResult && (
          <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 font-mono">
              <span>Target: {portAuditResult.target}</span>
              <span>{portAuditResult.openCount} open ports discovered ({portAuditResult.durationMs}ms)</span>
            </div>

            {portAuditResult.openPorts.length === 0 ? (
              <div className="text-slate-400 italic">No exposed standard services detected on this target.</div>
            ) : (
              <div className="space-y-1.5 pt-1">
                {portAuditResult.openPorts.map((p: any) => (
                  <div key={p.port} className="p-2 bg-white rounded-lg border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">Port {p.port} ({p.name})</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        p.risk === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                        p.risk === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {p.risk}
                      </span>
                      <span className="text-slate-600 text-[11px]">{p.issue}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-sans">Fix: {p.remediation}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tool 2: Web Security Headers & XSS/Clickjacking Defense */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div>
          <h2 className="text-xs font-bold text-slate-900">Web Defense & HTTP Headers Assessment</h2>
          <p className="text-[11px] text-slate-500">Evaluates HSTS, Content-Security-Policy, and clickjacking defenses</p>
        </div>

        <form onSubmit={handleWebAudit} className="flex gap-2">
          <input
            type="text"
            value={webUrl}
            onChange={(e) => setWebUrl(e.target.value)}
            placeholder="http://192.168.1.1 or https://example.com"
            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
          />
          <button
            type="submit"
            disabled={isAuditingWeb}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            {isAuditingWeb ? 'Evaluating...' : 'Inspect Web'}
          </button>
        </form>

        {webAuditResult && webAuditResult.success && (
          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-600 font-mono">
              <span>Status: HTTP {webAuditResult.statusCode}</span>
              <span>Latency: {webAuditResult.latencyMs}ms</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
              <div className={`p-2 rounded-lg border ${
                webAuditResult.securityAudits.hsts.present ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}>
                <div className="font-bold">HSTS</div>
                <div>{webAuditResult.securityAudits.hsts.present ? 'Enforced' : 'Missing'}</div>
              </div>
              <div className={`p-2 rounded-lg border ${
                webAuditResult.securityAudits.csp.present ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}>
                <div className="font-bold">CSP</div>
                <div>{webAuditResult.securityAudits.csp.present ? 'Configured' : 'Missing'}</div>
              </div>
              <div className={`p-2 rounded-lg border ${
                webAuditResult.securityAudits.xFrameOptions.present ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                <div className="font-bold">X-Frame</div>
                <div>{webAuditResult.securityAudits.xFrameOptions.present ? 'Protected' : 'None'}</div>
              </div>
              <div className={`p-2 rounded-lg border ${
                webAuditResult.securityAudits.xContentTypeOptions.present ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}>
                <div className="font-bold">MIME Sniff</div>
                <div>{webAuditResult.securityAudits.xContentTypeOptions.present ? 'nosniff' : 'Missing'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tool 3: DNS & Anti-Spoofing Reconnaissance */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div>
          <h2 className="text-xs font-bold text-slate-900">DNS & Email Spoofing Defense Recon (SPF / DMARC)</h2>
          <p className="text-[11px] text-slate-500">Queries authoritative DNS records to evaluate email domain impersonation risk</p>
        </div>

        <form onSubmit={handleDnsRecon} className="flex gap-2">
          <input
            type="text"
            value={dnsTarget}
            onChange={(e) => setDnsTarget(e.target.value)}
            placeholder="Domain (e.g. cloudflare.com)"
            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
          />
          <select
            value={dnsRecordType}
            onChange={(e) => setDnsRecordType(e.target.value)}
            className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
          >
            <option value="TXT">TXT (SPF/DMARC)</option>
            <option value="A">A</option>
            <option value="AAAA">AAAA</option>
            <option value="MX">MX (Mail)</option>
            <option value="PTR">PTR (Reverse)</option>
          </select>
          <button
            type="submit"
            disabled={isQueryingDns}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            {isQueryingDns ? 'Querying...' : 'Query DNS'}
          </button>
        </form>

        {dnsResult && (
          <div className="p-3 bg-slate-50 rounded-xl text-xs font-mono space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span>{dnsResult.type} Records for {dnsResult.host}:</span>
              <span>{dnsResult.durationMs}ms</span>
            </div>
            <div className="text-slate-900 break-all pt-1">
              {Array.isArray(dnsResult.records) 
                ? dnsResult.records.map((r: any, idx: number) => (
                    <div key={idx} className="py-0.5 border-b border-slate-200/50 last:border-none">
                      {typeof r === 'object' ? JSON.stringify(r) : String(r)}
                    </div>
                  ))
                : String(dnsResult.records || 'No records returned')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
