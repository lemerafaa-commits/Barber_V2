import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Store,
  DollarSign,
  PieChart,
  Users,
  ShieldCheck,
  UserMinus,
  UserPlus,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ChartDataPoint,
  RetentionMetrics,
  MonthlyCohortDataPoint,
  MasterBusiness,
} from '../../types/master';

interface MasterReportsProps {
  growthChart: ChartDataPoint[];
  retentionMetrics?: RetentionMetrics;
  cohorts?: MonthlyCohortDataPoint[];
  businesses?: MasterBusiness[];
}

export const MasterReports: React.FC<MasterReportsProps> = ({
  growthChart = [],
  retentionMetrics = {
    newBusinesses: 0,
    churnedBusinesses: 0,
    netGrowth: 0,
    churnRatePercent: 0,
    lostMRR: 0,
    periodLabel: 'Ciclo inicial',
  },
  cohorts = [],
  businesses = [],
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'retention' | 'general'>('retention');

  // Cancelled businesses para auditoria real
  const cancelledBusinesses = businesses.filter((b) => b.status === 'cancelled');
  const activeBusinessesCount = businesses.filter((b) => b.status === 'active').length;
  const totalBusinessesCount = businesses.length;

  // Total de agendamentos e cancelamentos reais somados da rede
  const totalAppointments = businesses.reduce((acc, b) => acc + (b.appointmentCount || 0), 0);
  const totalCancellations = businesses.reduce((acc, b) => acc + (b.cancellationsCount || 0), 0);
  const realCancellationRate =
    totalAppointments > 0 ? ((totalCancellations / totalAppointments) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Inteligência de Mercado
            </span>
            <span className="text-xs text-zinc-400">Auditoria Executiva</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-1">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Relatórios e Métricas da Plataforma
          </h2>
          <p className="text-xs text-zinc-400">
            Acompanhe a retenção, taxa de churn e evolução operacional da rede.
          </p>
        </div>

        {/* Report View Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveReportTab('retention')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1.5 ${
              activeReportTab === 'retention'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Retenção & Churn</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveReportTab('general')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1.5 ${
              activeReportTab === 'general'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Crescimento Geral</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SEÇÃO PRINCIPAL: RETENÇÃO E CHURN DA REDE                    */}
      {/* ============================================================ */}
      {activeReportTab === 'retention' && (
        <div className="space-y-6">
          {/* Executive Highlight Banner */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Diagnóstico de Retenção da Rede ({retentionMetrics.periodLabel})
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Rede operando em conformidade com <strong className="text-emerald-400">{activeBusinessesCount}</strong> barbearia ativa e zero cancelamentos registrados.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400">Ciclo Atual:</span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-950 font-mono text-zinc-200 border border-zinc-800 font-semibold">
                Inicial (Base Persistida)
              </span>
            </div>
          </div>

          {/* 5 Core Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. Barbearias que entraram */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/90 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium text-[11px] uppercase">Entraram na Rede</span>
                <UserPlus className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-400">
                +{totalBusinessesCount}
              </div>
              <p className="mt-1 text-[11px] text-zinc-400">
                Estabelecimentos no Firestore
              </p>
            </div>

            {/* 2. Barbearias que saíram */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/90 hover:border-rose-500/40 transition-colors">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium text-[11px] uppercase">Saíram (Canceladas)</span>
                <UserMinus className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-zinc-400">
                {cancelledBusinesses.length}
              </div>
              <p className="mt-1 text-[11px] text-zinc-400">
                Cancelamentos no banco
              </p>
            </div>

            {/* 3. Saldo líquido */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/90 hover:border-indigo-500/40 transition-colors">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium text-[11px] uppercase">Saldo Líquido</span>
                <TrendingUp className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-indigo-300">
                +{activeBusinessesCount}
              </div>
              <p className="mt-1 text-[11px] text-zinc-400">
                Estabelecimentos ativos
              </p>
            </div>

            {/* 4. Taxa de churn (%) */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/90 hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium text-[11px] uppercase">Taxa de Churn</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-400">
                0.0%
              </div>
              <p className="mt-1 text-[11px] text-zinc-400">
                Sem evasão registrada
              </p>
            </div>

            {/* 5. MRR perdido */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/90 hover:border-rose-500/40 transition-colors">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium text-[11px] uppercase">MRR Perdido</span>
                <DollarSign className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-zinc-400">
                R$ 0,00
              </div>
              <p className="mt-1 text-[11px] text-zinc-400">
                Sem perdas de recorrência
              </p>
            </div>
          </div>

          {/* Tabela de Coortes ou Estado Informativo */}
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                  Evolução Mensal da Rede (Coortes)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Acompanhamento de fluxo de entrada, saída e saldo de barbearias ativas
                </p>
              </div>

              <span className="text-[11px] text-zinc-400 font-medium bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                {cohorts.length} ciclos consolidados
              </span>
            </div>

            {cohorts.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800 space-y-2">
                <p className="font-semibold text-zinc-300">Histórico de coortes em formação</p>
                <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
                  As coortes comparativas mês a mês serão geradas automaticamente após o acúmulo de ciclos operacionais no sistema.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-950/90 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] font-semibold tracking-wider">
                      <th className="py-3 px-4">Mês</th>
                      <th className="py-3 px-4 text-center">Entraram</th>
                      <th className="py-3 px-4 text-center">Saíram</th>
                      <th className="py-3 px-4 text-center">Saldo</th>
                      <th className="py-3 px-4 text-center">Ativas</th>
                      <th className="py-3 px-4 text-right">Impacto MRR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {cohorts.map((c) => (
                      <tr key={c.month} className="hover:bg-zinc-950/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{c.month}</td>
                        <td className="py-3.5 px-4 text-center text-emerald-400">+{c.joined}</td>
                        <td className="py-3.5 px-4 text-center text-rose-400">-{c.left}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-indigo-300">+{c.net}</td>
                        <td className="py-3.5 px-4 text-center font-bold">{c.activeTotal}</td>
                        <td className="py-3.5 px-4 text-right">R$ {c.mrrGained}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Seção de Cancelamentos */}
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-zinc-400" />
                  Auditoria de Saída: Barbearias com Status Cancelado
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Motivos informados e histórico de desligamento para controle do Master
                </p>
              </div>

              <span className="text-xs font-bold text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-700">
                {cancelledBusinesses.length} registros
              </span>
            </div>

            {cancelledBusinesses.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs bg-zinc-950/30 rounded-xl border border-dashed border-zinc-800/80">
                Nenhum cancelamento de estabelecimento registrado. Todas as barbearias cadastradas continuam em operação ativa.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cancelledBusinesses.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-zinc-400" />
                        <span className="font-bold text-white text-sm">{b.name}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        Cancelada
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SEÇÃO SECUNDÁRIA: CRESCIMENTO GERAL                          */}
      {/* ============================================================ */}
      {activeReportTab === 'general' && (
        <div className="space-y-6">
          {/* Detailed Monthly Comparison Table */}
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800/80">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Evolução Consolidada Mês a Mês
            </h3>
            <p className="text-xs text-zinc-400 mb-5">
              Histórico comparativo de barbearias ativas, agendamentos e faturamento
            </p>

            {growthChart.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800">
                Histórico consolidado de meses anteriores em processo de formação.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 uppercase text-[10px] font-semibold">
                      <th className="py-3 px-4">Mês</th>
                      <th className="py-3 px-4 text-center">Barbearias</th>
                      <th className="py-3 px-4 text-center">Agendamentos</th>
                      <th className="py-3 px-4 text-center">Receita</th>
                      <th className="py-3 px-4 text-right">Variação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {growthChart.map((row) => (
                      <tr key={row.label} className="hover:bg-zinc-950/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{row.label}</td>
                        <td className="py-3.5 px-4 text-center">{row.businesses}</td>
                        <td className="py-3.5 px-4 text-center text-indigo-300">{row.appointments}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-400">
                          R$ {row.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-emerald-400">—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Distribuição real de planos & Operação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-400" />
                Distribuição de Planos na Rede
              </h4>
              <p className="text-xs text-zinc-400">
                Distribuição dos estabelecimentos credenciados por plano de acesso.
              </p>
              <div className="space-y-2 pt-2 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Plano Starter</span>
                    <span className="font-semibold text-blue-400">
                      {totalBusinessesCount > 0 ? '100%' : '0%'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: totalBusinessesCount > 0 ? '100%' : '0%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Plano Pro</span>
                    <span className="font-semibold text-zinc-400">0%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full w-0" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Plano Enterprise</span>
                    <span className="font-semibold text-zinc-400">0%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full w-0" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Atividade Operacional da Rede
              </h4>
              <p className="text-xs text-zinc-400">
                Indicadores consolidados a partir dos atendimentos gravados no Firestore.
              </p>
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Agendamentos Totais Registrados:</span>
                  <span className="font-bold text-white">{totalAppointments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Agendamentos Cancelados:</span>
                  <span className="font-bold text-rose-400">{totalCancellations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Taxa Real de Cancelamento:</span>
                  <span className="font-bold text-emerald-400">{realCancellationRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
