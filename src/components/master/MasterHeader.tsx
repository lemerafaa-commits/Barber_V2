import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Store,
} from 'lucide-react';
import { MasterTab } from '../../types/master';

interface MasterHeaderProps {
  activeTab: MasterTab;
  onOpenMobileSidebar: () => void;
  onNavigateHome: () => void;
  onNavigateAdmin: () => void;
  onSelectTab: (tab: MasterTab) => void;
}

const TAB_TITLES: Record<MasterTab, { title: string; subtitle: string }> = {
  overview: {
    title: 'Dashboard',
    subtitle: 'Visão geral da plataforma',
  },
  network: {
    title: 'Gestão da Rede',
    subtitle: 'Barbearias credenciadas e usuários da plataforma',
  },
  businesses: {
    title: 'Barbearias',
    subtitle: 'Gerenciamento de estabelecimentos cadastrados',
  },
  users: {
    title: 'Usuários',
    subtitle: 'Diretório global de administradores e operadores',
  },
  appointments: {
    title: 'Agendamentos',
    subtitle: 'Visão unificada de atendimentos em toda a rede',
  },
  subscriptions: {
    title: 'Assinaturas',
    subtitle: 'Controle de planos SaaS e faturamento recorrente',
  },
  reports: {
    title: 'Relatórios',
    subtitle: 'Inteligência de mercado, taxas de conversão e métricas MRR',
  },
  settings: {
    title: 'Configurações',
    subtitle: 'Parâmetros globais da plataforma e integrações',
  },
  profile: {
    title: 'Meu Perfil',
    subtitle: 'Credenciais de superadministrador da plataforma',
  },
};

export const MasterHeader: React.FC<MasterHeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  onNavigateHome,
  onNavigateAdmin,
  onSelectTab,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const current = TAB_TITLES[activeTab] || TAB_TITLES.overview;

  return (
    <header
      id="master-header"
      className="sticky top-0 z-30 w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-6 lg:px-8 py-3.5 transition-all"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Trigger + Page Title */}
        <div className="flex items-center gap-3">
          <button
            id="master-mobile-menu-toggle"
            type="button"
            onClick={onOpenMobileSidebar}
            className="p-2 -ml-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/80 lg:hidden focus:outline-none"
            title="Abrir menu lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {current.title}
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                SaaS Master
              </span>
            </h1>
            <p className="text-xs text-zinc-400 hidden sm:block">{current.subtitle}</p>
          </div>
        </div>

        {/* Center/Right: Visual Global Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="master-global-search-input"
              type="text"
              readOnly
              placeholder="Buscar barbearia, usuário ou agendamento... (Ctrl+K)"
              className="w-full pl-9 pr-14 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
              onClick={() => onSelectTab('businesses')}
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-400 rounded border border-zinc-700">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Actions: Quick Links, Notifications & Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct Switch to /admin */}
          <button
            id="master-quick-link-admin"
            type="button"
            onClick={onNavigateAdmin}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-300 bg-amber-950/40 border border-amber-800/50 hover:bg-amber-900/50 transition-colors"
            title="Ir para o painel da barbearia (/admin)"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Ver Barbearia /admin</span>
          </button>

          {/* Notifications Dropdown Trigger */}
          <div className="relative">
            <button
              id="master-notifications-btn"
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
              title="Notificações da plataforma"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-zinc-950 animate-pulse" />
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div
                  id="master-notifications-dropdown"
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl p-4 z-50 text-left animate-in fade-in zoom-in-95"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">Notificações da Rede</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-indigo-500/20 text-indigo-300 rounded">
                        3 novas
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200"
                    >
                      Marcar lidas
                    </button>
                  </div>

                  <div className="divide-y divide-zinc-800/60 py-1 max-h-72 overflow-y-auto">
                    <div className="py-2.5 flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-medium text-zinc-200">Novo cadastro confirmado</p>
                        <p className="text-[11px] text-zinc-400">
                          Barbearia &quot;Faca &amp; Tesoura Club&quot; iniciou o Trial.
                        </p>
                        <span className="text-[10px] text-zinc-400">Há 15 min</span>
                      </div>
                    </div>

                    <div className="py-2.5 flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-medium text-zinc-200">Upgrade de plano</p>
                        <p className="text-[11px] text-zinc-400">
                          Alfa Club Barber migrou para o plano Pro.
                        </p>
                        <span className="text-[10px] text-zinc-400">Há 45 min</span>
                      </div>
                    </div>

                    <div className="py-2.5 flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-medium text-zinc-200">Falha em fatura recorrente</p>
                        <p className="text-[11px] text-zinc-400">
                          Corte Real Lounge precisa regularizar o cartão.
                        </p>
                        <span className="text-[10px] text-zinc-400">Ontem às 19:40</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Chip */}
          <button
            id="master-header-avatar-btn"
            type="button"
            onClick={() => onSelectTab('profile')}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 transition-colors"
          >
            <span className="text-xs font-medium text-zinc-200 hidden sm:inline-block">
              Rafael Macedo
            </span>
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs">
              R
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
