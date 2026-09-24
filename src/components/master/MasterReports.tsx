import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Store,
  Calendar,
  DollarSign,
  PieChart,
  Users,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  UserMinus,
  UserPlus,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import {
  ChartDataPoint,
  RetentionMetrics,
  MonthlyCohortDataPoint,
  MasterBusiness,
} from '../../types/master';
import {
  MOCK_RETENTION_METRICS,
  MOCK_MONTHLY_COHORTS,
  MOCK_MASTER_BUSINESSES,
} from '../../data/masterMockData';

interface MasterReportsProps {
  growthChart: ChartDataPoint[];
  retentionMetrics?: RetentionMetrics;
  cohorts?: MonthlyCohortDataPoint[];
  businesses?: MasterBusiness[];
}

export const MasterReports: React.FC<MasterReportsProps> = ({
  growthChart,
  retentionMetrics = MOCK_RETENTION_METRICS,
  cohorts = MOCK_MONTHLY_COHORTS,
  businesses = MOCK_MASTER_BUSINESSES,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'3m' | '6m' | '12m'>('6m');
  const [activeReportTab, setActiveReportTab] = useState<'retention' | 'general'>('retention');

  // Cancelled businesses for audit view
  const cancelledBusinesses = businesses.filter((b) => b.status === 'cancelled');

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Inteligência de Mercado
            </span>
            <span className="text-xs text-zinc-300">Auditoria Executiva</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-1">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Relatórios e Métricas da Plataforma
          </h2>
          <p className="text-xs text-zinc-300">
            Acompanhe a retenção, churn de estabelecimentos e evolução líquida da rede.
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
                  Diagnóstico de Saúde da Rede ({retentionMetrics.periodLabel})
                </h3>
                <p className="text-xs text-zinc-300 mt-0.5">
                  A taxa de aquisição supera o churn em <strong className="text-emerald-400">5x</strong>, mantendo saldo líquido positivo contínuo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-300">Período Analisado:</span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-950 font-mono text-zinc-200 border border-zinc-800 font-semibold">
                Mai/2026 - Set/2026
              </span>
            </div>
          </div>

          {/* 5 Core Metric Cards as Requested */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. Barbearias que entraram */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/90 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span className="font-medium text-[11px] uppercase">Entraram na Rede</span>
                <UserPlus className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-400">
                +{retentionMetrics.newBusinesses}
              </div>
              <p className="mt-1 text-[11px] text-zinc-300">
                Novas barbearias credenciadas
              </p>
            </div>

            {/* 2. Barbearias que saíram */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/90 hover:border-rose-500/40 transition-colors">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span className="font-medium text-[11px] uppercase">Saíram (Canceladas)</span>
                <UserMinus className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-rose-400">
                -{retentionMetrics.churnedBusinesses}
              </div>
              <p className="mt-1 text-[11px] text-zinc-300">
                Descredenciamentos registrados
              </p>
            </div>

            {/* 3. Saldo líquido */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/90 hover:border-indigo-500/40 transition-colors">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span className="font-medium text-[11px] uppercase">Saldo Líquido</span>
                <TrendingUp className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-indigo-300">
                +{retentionMetrics.netGrowth}
              </div>
              <p className="mt-1 text-[11px] text-zinc-300">
                Expansão real (Novas - Canceladas)
              </p>
            </div>

            {/* 4. Taxa de churn (%) */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/90 hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span className="font-medium text-[11px] uppercase">Taxa de Churn</span>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-amber-300">
                {retentionMetrics.churnRatePercent}%
              </div>
              <p className="mt-1 text-[11px] text-zinc-300">
                Média de cancelamento no período
              </p>
            </div>

            {/* 5. MRR perdido */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/90 hover:border-rose-500/40 transition-colors">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span className="font-medium text-[11px] uppercase">MRR Perdido</span>
                <DollarSign className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-rose-300">
                R$ {retentionMetrics.lostMRR.toFixed(2)}
              </div>
              <p className="mt-1 text-[11px] text-zinc-300">
                Receita recorrente cessada/mês
              </p>
            </div>
          </div>

          {/* Tabela Comparativa Mês a Mês: Entraram, Saíram, Saldo, Total Ativas */}
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                  Evolução Mensal da Rede (Aquisições vs. Churn)
                </h3>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Acompanhamento de fluxo de entrada, saída e saldo de barbearias ativas
                </p>
              </div>

              <span className="text-[11px] text-zinc-300 font-medium bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                5 Coortes Mensais
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-950/90 border-b border-zinc-800 text-zinc-300 uppercase text-[10px] font-semibold tracking-wider">
                    <th className="py-3 px-4">Mês</th>
                    <th className="py-3 px-4 text-center">Entraram (Novas)</th>
                    <th className="py-3 px-4 text-center">Saíram (Churn)</th>
                    <th className="py-3 px-4 text-center">Saldo Líquido</th>
                    <th className="py-3 px-4 text-center">Total de Ativas</th>
                    <th className="py-3 px-4 text-right">Impacto MRR (Ganho / Perdido)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {cohorts.map((c) => (
                    <tr key={c.month} className="hover:bg-zinc-950/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        {c.month} / 2026
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          +{c.joined}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {c.left > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            -{c.left}
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-mono text-[11px]">0</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-extrabold text-indigo-300 text-xs">
                          +{c.net}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-white text-xs px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700">
                          {c.activeTotal} ativas
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="text-emerald-400 font-bold text-xs mr-2">
                          +R$ {c.mrrGained}
                        </span>
                        {c.mrrLost > 0 ? (
                          <span className="text-rose-400 text-xs font-semibold">
                            -R$ {c.mrrLost}
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-xs font-mono">R$ 0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Seção de Motivos de Cancelamento & Casos Reais de Churn */}
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Auditoria de Saída: Barbearias com Status Cancelado
                </h3>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Motivos informados e histórico de desligamento para controle do Master
                </p>
              </div>

              <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                {cancelledBusinesses.length} registros no histórico
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cancelledBusinesses.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-zinc-300" />
                      <span className="font-bold text-white text-sm">{b.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      Cancelada
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300 pt-1 border-t border-zinc-800/60">
                    <div>
                      <span className="text-zinc-300 block">Data de Saída:</span>
                      <strong className="text-zinc-100">{b.cancelledAt || '28/08/2026'}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-300 block">Plano Anterior:</span>
                      <strong className="text-zinc-100 uppercase">{b.previousPlan || b.plan}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-300 block">Proprietário:</span>
                      <span className="text-zinc-200">{b.ownerName}</span>
                    </div>
                    <div>
                      <span className="text-zinc-300 block">Localização:</span>
                      <span className="text-zinc-200">{b.city}/{b.state}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/60">
                    <span className="text-zinc-300 text-[11px] block font-semibold">
                      Motivo Declarado do Churn:
                    </span>
                    <p className="text-zinc-200 mt-0.5 text-xs font-medium">
                      {b.cancelReason || 'Encerramento de ponto comercial'}
                    </p>
                    {b.cancelFeedback && (
                      <p className="text-zinc-300 italic text-[11px] mt-1 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                        "{b.cancelFeedback}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
            <p className="text-xs text-zinc-300 mb-5">
              Histórico comparativo de barbearias ativas, agendamentos e faturamento
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-300 uppercase text-[10px] font-semibold">
                    <th className="py-3 px-4">Mês</th>
                    <th className="py-3 px-4 text-center">Barbearias na Rede</th>
                    <th className="py-3 px-4 text-center">Agendamentos Criados</th>
                    <th className="py-3 px-4 text-center">Receita da Plataforma</th>
                    <th className="py-3 px-4 text-right">Variação Mensal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {growthChart.map((row, idx) => {
                    const prev = idx > 0 ? growthChart[idx - 1] : null;
                    const percentChange = prev
                      ? (((row.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1)
                      : '+10.5';

                    return (
                      <tr key={row.label} className="hover:bg-zinc-950/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{row.label} / 2026</td>
                        <td className="py-3.5 px-4 text-center font-semibold text-zinc-200">
                          {row.businesses} estabelecimentos
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-indigo-300">
                          {row.appointments} agendamentos
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-400">
                          R$ {row.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-emerald-400">
                          +{percentChange}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cohort & Plan distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-400" />
                Preferência de Planos Pelos Clientes
              </h4>
              <p className="text-xs text-zinc-300">
                O plano Pro representa 58% da base instalada devido ao recurso de WhatsApp automatizado.
              </p>
              <div className="space-y-2 pt-2 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Plano Pro (R$ 189)</span>
                    <span className="font-semibold text-indigo-400">58%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full w-[58%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Plano Starter (R$ 99)</span>
                    <span className="font-semibold text-blue-400">25%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full w-[25%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Plano Enterprise (R$ 349)</span>
                    <span className="font-semibold text-purple-400">17%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full w-[17%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Engajamento e Atividade dos Barbeiros
              </h4>
              <p className="text-xs text-zinc-300">
                A média de agendamentos por barbearia ativa aumentou de 18 para 23 agendamentos diários.
              </p>
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-300">Taxa de Ocupação da Agenda:</span>
                  <span className="font-bold text-emerald-400">84.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-300">Cancelamentos de Clientes:</span>
                  <span className="font-bold text-zinc-300">Apenas 3.1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-300">Confirmações via WhatsApp:</span>
                  <span className="font-bold text-indigo-400">92% entregues</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
