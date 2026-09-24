import React from 'react';
import {
  LayoutDashboard,
  Store,
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Sparkles,
  ExternalLink,
  X,
  Network,
} from 'lucide-react';
import { MasterTab } from '../../types/master';

interface MasterSidebarProps {
  activeTab: MasterTab;
  onSelectTab: (tab: MasterTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onLogoutClick: () => void;
  onNavigateHome: () => void;
  onNavigateAdmin: () => void;
}

interface MenuItem {
  id: MasterTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'network', label: 'Gestão da Rede', icon: Network, badge: '24' },
  { id: 'appointments', label: 'Agendamentos', icon: Calendar, badge: '482' },
  { id: 'subscriptions', label: 'Assinaturas', icon: CreditCard },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export const MasterSidebar: React.FC<MasterSidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onLogoutClick,
  onNavigateHome,
  onNavigateAdmin,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          id="master-sidebar-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="master-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-zinc-900 border-r border-zinc-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-950/40 text-white font-bold tracking-wider text-base">
              BS
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold tracking-tight text-white uppercase">
                  Barber SaaS
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Master
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">Centro de Controle</p>
            </div>
          </div>

          {/* Close button on Mobile */}
          <button
            id="master-sidebar-close-btn"
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 lg:hidden"
            title="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          <div className="px-2.5 pb-2 text-[10px] font-semibold text-zinc-300 uppercase tracking-wider">
            Gestão da Plataforma
          </div>

          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'network' && (activeTab === 'businesses' || activeTab === 'users'));
            return (
              <button
                key={item.id}
                id={`master-nav-${item.id}`}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Shortcuts */}
          <div className="pt-5 px-2.5 pb-2 text-[10px] font-semibold text-zinc-300 uppercase tracking-wider">
            Atalhos Externos
          </div>

          <button
            id="master-shortcut-admin"
            type="button"
            onClick={onNavigateAdmin}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Painel Barbearia (/admin)</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            id="master-shortcut-public"
            type="button"
            onClick={onNavigateHome}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Agendamento Cliente (/)</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>

        {/* Bottom User Area */}
        <div className="p-3.5 border-t border-zinc-800/80 space-y-2 bg-zinc-950/40">
          <button
            id="master-profile-trigger"
            type="button"
            onClick={() => {
              onSelectTab('profile');
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
              activeTab === 'profile'
                ? 'bg-zinc-800 border-indigo-500/50 text-white'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-950 border border-indigo-800/50 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0">
              RL
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-zinc-100 truncate">Rafael Leme</div>
              <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>Master Admin</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0" />
          </button>

          <button
            id="master-logout-btn"
            type="button"
            onClick={onLogoutClick}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair do Master</span>
          </button>
        </div>
      </aside>
    </>
  );
};
