import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Clock, 
  ShieldCheck, 
  Wrench 
} from 'lucide-react';

export type NavTabId = 'overview' | 'devices' | 'control' | 'protection' | 'tools' | 'router' | 'code';

interface BottomNavBarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  unresolvedFindingCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  unresolvedFindingCount
}) => {
  const tabs: Array<{ id: NavTabId; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'devices', label: 'Devices', icon: Layers },
    { id: 'control', label: 'Control', icon: Clock },
    { id: 'protection', label: 'Protection', icon: ShieldCheck },
    { id: 'tools', label: 'Tools', icon: Wrench, badge: unresolvedFindingCount }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 text-slate-500 shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative min-h-[44px] min-w-[44px] transition-colors ${
                isActive ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.3]' : 'stroke-[1.75]'}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1 rounded-full">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] tracking-tight mt-1 whitespace-nowrap ${
                isActive ? 'font-semibold text-emerald-700' : 'font-medium'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 absolute bottom-1" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
