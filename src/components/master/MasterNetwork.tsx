import React, { useState, useMemo } from 'react';
import {
  Store,
  Users,
  Search,
  Filter,
  ExternalLink,
  MessageSquare,
  Building2,
  Calendar,
  Eye,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowUpDown,
  Plus,
} from 'lucide-react';
import { MasterBusiness, MasterUser } from '../../types/master';
import { MasterBusinessDetailModal } from './MasterBusinessDetailModal';
import { MasterUserDetailModal } from './MasterUserDetailModal';

interface MasterNetworkProps {
  businesses: MasterBusiness[];
  users: MasterUser[];
  defaultSubTab?: 'businesses' | 'users';
}

export const MasterNetwork: React.FC<MasterNetworkProps> = ({
  businesses,
  users,
  defaultSubTab = 'businesses',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'businesses' | 'users'>(defaultSubTab);

  // Selected for modals
  const [selectedBusiness, setSelectedBusiness] = useState<MasterBusiness | null>(null);
  const [selectedUser, setSelectedUser] = useState<MasterUser | null>(null);

  // Filter state for Barbearias
  const [bizSearch, setBizSearch] = useState('');
  const [bizStatusFilter, setBizStatusFilter] = useState<'all' | 'active' | 'trial' | 'suspended' | 'cancelled'>('all');
  const [bizPlanFilter, setBizPlanFilter] = useState<'all' | 'starter' | 'pro' | 'enterprise'>('all');

  // Filter state for Usuários
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'master' | 'business_admin'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [userBizFilter, setUserBizFilter] = useState<string>('all');

  // Helpers
  const cleanPhoneForWa = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  };

  // Filtered Businesses
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      const q = bizSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.ownerName.toLowerCase().includes(q) ||
        b.ownerEmail.toLowerCase().includes(q) ||
        b.ownerPhone.includes(q);

      const matchesStatus = bizStatusFilter === 'all' || b.status === bizStatusFilter;
      const matchesPlan = bizPlanFilter === 'all' || b.plan === bizPlanFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [businesses, bizSearch, bizStatusFilter, bizPlanFilter]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = userSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        (u.businessName && u.businessName.toLowerCase().includes(q));

      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
      const matchesBiz = userBizFilter === 'all' || u.businessId === userBizFilter;

      return matchesSearch && matchesRole && matchesStatus && matchesBiz;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter, userBizFilter]);

  // Unique businesses for user filter
  const businessListOptions = useMemo(() => {
    const map = new Map<string, string>();
    businesses.forEach((b) => map.set(b.id, b.name));
    return Array.from(map.entries());
  }, [businesses]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Gestão da Rede: Executive Header & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/40 border border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Módulo Unificado
            </span>
            <span className="text-xs text-zinc-300">Estrutura Multi-Tenant</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Gestão da Rede
          </h2>
          <p className="text-xs text-zinc-300 mt-0.5 max-w-2xl">
            Acompanhe a rede sob duas perspectivas conectadas. A <strong className="text-zinc-200">Barbearia</strong> é a entidade principal, centralizando proprietários, assinaturas e operadores vinculados.
          </p>
        </div>

        {/* Sub-Tab Selector */}
        <div className="flex items-center p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 shrink-0">
          <button
            id="tab-network-businesses"
            type="button"
            onClick={() => setActiveSubTab('businesses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'businesses'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Barbearias</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeSubTab === 'businesses'
                  ? 'bg-white/20 text-white'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {businesses.length}
            </span>
          </button>

          <button
            id="tab-network-users"
            type="button"
            onClick={() => setActiveSubTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'users'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Usuários</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeSubTab === 'users'
                  ? 'bg-white/20 text-white'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {users.length}
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PERSPECTIVA 1: BARBEARIAS                                   */}
      {/* ============================================================ */}
      {activeSubTab === 'businesses' && (
        <div className="space-y-4">
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold block">
                Total na Rede
              </span>
              <div className="text-xl font-bold text-white mt-1">{businesses.length}</div>
              <span className="text-[10px] text-zinc-300">Unidades cadastradas</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold block">
                Ativas & Adimplentes
              </span>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {businesses.filter((b) => b.status === 'active').length}
              </div>
              <span className="text-[10px] text-zinc-300">Em operação regular</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold block">
                Em Período Trial
              </span>
              <div className="text-xl font-bold text-blue-400 mt-1">
                {businesses.filter((b) => b.status === 'trial').length}
              </div>
              <span className="text-[10px] text-zinc-300">Avaliação gratuita</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold block">
                Canceladas (Churn)
              </span>
              <div className="text-xl font-bold text-rose-400 mt-1">
                {businesses.filter((b) => b.status === 'cancelled').length}
              </div>
              <span className="text-[10px] text-zinc-300">Histórico de saídas</span>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={bizSearch}
                onChange={(e) => setBizSearch(e.target.value)}
                placeholder="Buscar por barbearia, slug, cidade, dono..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <span className="text-[11px] text-zinc-400 font-medium whitespace-nowrap">Status:</span>
              <select
                value={bizStatusFilter}
                onChange={(e) => setBizStatusFilter(e.target.value as any)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativas</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspensas</option>
                <option value="cancelled">Canceladas</option>
              </select>

              <span className="text-[11px] text-zinc-400 font-medium whitespace-nowrap ml-2">Plano:</span>
              <select
                value={bizPlanFilter}
                onChange={(e) => setBizPlanFilter(e.target.value as any)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="all">Todos os planos</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          {/* Barbearias Table */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] font-semibold tracking-wider">
                    <th className="py-3 px-4">Barbearia</th>
                    <th className="py-3 px-3">Proprietário</th>
                    <th className="py-3 px-3">WhatsApp</th>
                    <th className="py-3 px-3">E-mail</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Plano</th>
                    <th className="py-3 px-3 text-center">Agendamentos</th>
                    <th className="py-3 px-3">Criado em</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {filteredBusinesses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-zinc-400 text-xs">
                        Nenhuma barbearia encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredBusinesses.map((b) => (
                      <tr key={b.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                              <Store className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-zinc-100 block">{b.name}</span>
                              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                                <span className="font-mono text-zinc-400">/{b.slug}</span>
                                <span>•</span>
                                <span>{b.city}/{b.state}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="text-zinc-200 font-medium block">{b.ownerName}</span>
                          <span className="text-[10px] text-zinc-400">Business Admin</span>
                        </td>

                        <td className="py-3 px-3">
                          <a
                            href={`https://wa.me/${cleanPhoneForWa(b.ownerPhone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 font-medium transition-colors"
                            title="Abrir WhatsApp direto do proprietário"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>{b.ownerPhone}</span>
                          </a>
                        </td>

                        <td className="py-3 px-3 font-mono text-zinc-400 text-[11px]">
                          {b.ownerEmail}
                        </td>

                        <td className="py-3 px-3">
                          {b.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Ativa
                            </span>
                          ) : b.status === 'trial' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              Trial
                            </span>
                          ) : b.status === 'cancelled' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                              Cancelada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Suspensa
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              b.plan === 'enterprise'
                                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                : b.plan === 'pro'
                                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                                : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                            }`}
                          >
                            {b.plan}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="font-bold text-white text-xs">{b.appointmentCount}</span>
                          {b.cancellationsCount !== undefined && (
                            <span className="text-[10px] text-zinc-400 block">
                              ({b.cancellationsCount} canc.)
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-zinc-400 text-[11px]">
                          {b.createdAt}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            id={`btn-view-business-${b.id}`}
                            type="button"
                            onClick={() => setSelectedBusiness(b)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.2 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver detalhes</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PERSPECTIVA 2: USUÁRIOS                                      */}
      {/* ============================================================ */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar por nome, e-mail, WhatsApp, barbearia..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <span className="text-[11px] text-zinc-400 font-medium whitespace-nowrap">Função:</span>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as any)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="all">Todas as funções</option>
                <option value="master">Master</option>
                <option value="business_admin">Business Admin</option>
              </select>

              <span className="text-[11px] text-zinc-400 font-medium whitespace-nowrap ml-2">Status:</span>
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value as any)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="suspended">Suspenso</option>
              </select>

              <span className="text-[11px] text-zinc-400 font-medium whitespace-nowrap ml-2">Barbearia:</span>
              <select
                value={userBizFilter}
                onChange={(e) => setUserBizFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-hidden focus:border-indigo-500 max-w-[160px] truncate"
              >
                <option value="all">Todas as barbearias</option>
                {businessListOptions.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] font-semibold tracking-wider">
                    <th className="py-3 px-4">Nome</th>
                    <th className="py-3 px-3">WhatsApp</th>
                    <th className="py-3 px-3">E-mail</th>
                    <th className="py-3 px-3">Função</th>
                    <th className="py-3 px-3">Barbearia Vinculada</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Último Acesso</th>
                    <th className="py-3 px-3">Criado em</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-zinc-400 text-xs">
                        Nenhum usuário encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300 text-xs shrink-0">
                              {u.name.charAt(0)}
                            </div>
                            <span className="font-bold text-zinc-100">{u.name}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {u.phone ? (
                            <a
                              href={`https://wa.me/${cleanPhoneForWa(u.phone)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
                              title="Conversar via WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{u.phone}</span>
                            </a>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono text-zinc-400 text-[11px]">
                          {u.email}
                        </td>

                        <td className="py-3 px-3">
                          {u.role === 'master' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                              <ShieldCheck className="w-3 h-3 text-indigo-400" />
                              Master
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                              Business Admin
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {u.businessName ? (
                            <span className="text-zinc-200 font-medium flex items-center gap-1">
                              <Store className="w-3 h-3 text-zinc-400" />
                              {u.businessName}
                            </span>
                          ) : (
                            <span className="text-zinc-500 italic">Global (Plataforma)</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                              u.status === 'active'
                                ? 'text-emerald-400'
                                : u.status === 'suspended'
                                ? 'text-amber-400'
                                : 'text-zinc-400'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {u.status === 'active'
                              ? 'Ativo'
                              : u.status === 'suspended'
                              ? 'Suspenso'
                              : 'Inativo'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-zinc-400 text-[11px]">
                          {u.lastLoginAt}
                        </td>

                        <td className="py-3 px-3 text-zinc-400 text-[11px]">
                          {u.createdAt}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            id={`btn-view-user-${u.id}`}
                            type="button"
                            onClick={() => setSelectedUser(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.2 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Ver detalhes</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 360° Business Detail Modal */}
      {selectedBusiness && (
        <MasterBusinessDetailModal
          business={selectedBusiness}
          users={users}
          onClose={() => setSelectedBusiness(null)}
        />
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <MasterUserDetailModal
          user={selectedUser}
          business={
            selectedUser.businessId
              ? businesses.find((b) => b.id === selectedUser.businessId)
              : null
          }
          onClose={() => setSelectedUser(null)}
          onViewBusiness={(bizId) => {
            const biz = businesses.find((b) => b.id === bizId);
            if (biz) {
              setActiveSubTab('businesses');
              setSelectedBusiness(biz);
            }
          }}
        />
      )}
    </div>
  );
};
