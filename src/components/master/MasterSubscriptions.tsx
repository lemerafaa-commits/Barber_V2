import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { MasterSubscription, SubscriptionStatus } from '../../types/master';

interface MasterSubscriptionsProps {
  subscriptions: MasterSubscription[];
}

export const MasterSubscriptions: React.FC<MasterSubscriptionsProps> = ({ subscriptions }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | SubscriptionStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Aggregated KPI counts
  const totalCount = subscriptions.length;
  const activeCount = subscriptions.filter((s) => s.status === 'active').length;
  const trialCount = subscriptions.filter((s) => s.status === 'trial').length;
  const cancelledCount = subscriptions.filter((s) => s.status === 'cancelled').length;
  const totalMRR = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((s) => {
      const matchesSearch =
        s.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.plan.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [subscriptions, searchTerm, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-400" />
          Assinaturas e Planos SaaS
        </h2>
        <p className="text-xs text-zinc-400">
          Controle de recorrência, saúde financeira e faturamento da plataforma
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Assinaturas */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80">
          <span className="text-xs font-medium text-zinc-400">Total de Assinaturas</span>
          <div className="mt-2 text-2xl font-extrabold text-white">{totalCount}</div>
          <p className="mt-1 text-[11px] text-zinc-500">Cadastros totais</p>
        </div>

        {/* Ativas */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80">
          <span className="text-xs font-medium text-zinc-400">Assinaturas Ativas</span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400">{activeCount}</div>
          <p className="mt-1 text-[11px] text-emerald-500/80">Faturamento recorrente</p>
        </div>

        {/* Em Trial */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80">
          <span className="text-xs font-medium text-zinc-400">Em Trial (Testes)</span>
          <div className="mt-2 text-2xl font-extrabold text-blue-400">{trialCount}</div>
          <p className="mt-1 text-[11px] text-blue-400/80">14 dias gratuitos</p>
        </div>

        {/* Canceladas */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80">
          <span className="text-xs font-medium text-zinc-400">Canceladas / Suspensas</span>
          <div className="mt-2 text-2xl font-extrabold text-rose-400">{cancelledCount}</div>
          <p className="mt-1 text-[11px] text-rose-400/80">Churn de 4.1%</p>
        </div>

        {/* MRR Consolidado */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-indigo-500/30 col-span-2 lg:col-span-1 bg-gradient-to-br from-indigo-950/40 to-zinc-900">
          <span className="text-xs font-medium text-indigo-300">MRR Mensal Ativo</span>
          <div className="mt-2 text-2xl font-extrabold text-white">
            R$ {totalMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-[11px] text-indigo-400">Previsão próximo ciclo</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="master-sub-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por barbearia ou plano..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'all', label: 'Todas' },
              { id: 'active', label: 'Ativas' },
              { id: 'trial', label: 'Trial' },
              { id: 'cancelled', label: 'Canceladas' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === filter.id
                  ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-3.5 px-4 sm:px-6">Barbearia</th>
                <th className="py-3.5 px-4">Plano</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Valor</th>
                <th className="py-3.5 px-4">Início</th>
                <th className="py-3.5 px-4">Próxima Cobrança</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Método de Cobrança</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    Nenhuma assinatura encontrada com os critérios informados.
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => {
                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-zinc-950/40 transition-colors"
                    >
                      {/* Barbearia */}
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-white">
                        <div>{sub.businessName}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{sub.id}</div>
                      </td>

                      {/* Plano */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            sub.plan === 'enterprise'
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                              : sub.plan === 'pro'
                              ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          {sub.plan}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {sub.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Ativa
                          </span>
                        ) : sub.status === 'trial' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Clock className="w-3 h-3" />
                            Trial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <AlertCircle className="w-3 h-3" />
                            Cancelada
                          </span>
                        )}
                      </td>

                      {/* Valor */}
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {sub.amount > 0 ? `R$ ${sub.amount.toFixed(2)}/mês` : 'R$ 0,00 (Trial)'}
                      </td>

                      {/* Início */}
                      <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                        {sub.createdAt}
                      </td>

                      {/* Próxima cobrança */}
                      <td className="py-3.5 px-4 text-zinc-300 font-medium text-[11px]">
                        {sub.nextBillingAt}
                      </td>

                      {/* Método */}
                      <td className="py-3.5 px-4 sm:px-6 text-right text-zinc-400 text-[11px]">
                        {sub.paymentMethod}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-400">
          <span>
            {filteredSubscriptions.length} assinaturas registradas
          </span>
          <span className="text-[11px] text-zinc-500">
            Módulo preparado para Stripe Billing &amp; Webhooks
          </span>
        </div>
      </div>
    </div>
  );
};
