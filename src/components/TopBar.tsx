import React from 'react';
import { 
  Wifi, 
  Smartphone, 
  Maximize2,
  Router
} from 'lucide-react';

interface TopBarProps {
  activeTab: string;
  isMobileFrame: boolean;
  onToggleFrame: () => void;
  vpnActive: boolean;
  deviceCount: number;
  onOpenRouter: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  isMobileFrame,
  onToggleFrame,
  vpnActive,
  deviceCount,
  onOpenRouter
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 select-none">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        {/* Network & Active State */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <Wifi className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-900">Local Network</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500 font-mono tabular-nums">{deviceCount} online</span>
            <span className="text-slate-300">·</span>
            <span className={vpnActive ? 'text-emerald-700 font-medium' : 'text-slate-400 font-normal'}>
              {vpnActive ? 'DNS Shield On' : 'DNS Shield Off'}
            </span>
          </div>
        </div>

        {/* Essential Working Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenRouter}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'router'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Gateway Router Settings"
          >
            <Router className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gateway</span>
          </button>

          <button
            onClick={onToggleFrame}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title={isMobileFrame ? 'Expand View' : 'Phone View'}
          >
            {isMobileFrame ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
