import React, { useState } from 'react';
import {
  Store,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Clock,
  ChevronRight,
  Sparkles,
  Users,
  ShieldCheck,
} from 'lucide-react';
import {
  PlatformMetrics,
  MasterActivityItem,
  ChartDataPoint,
  MasterTab,
} from '../../types/master';

interface MasterOverviewProps {
  metrics: PlatformMetrics;
  activities: MasterActivityItem[];
  growthChart: ChartDataPoint[];
  onSelectTab: (tab: MasterTab) => void;
}

export const MasterOverview: React.FC<MasterOverviewProps> = ({
  metrics,
  activities,
  growthChart,
  onSelectTab,
}) => {
  const [activeChartFilter, setActiveChartFilter] = useState<'appointments' | 'revenue'>('appointments');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // SVG Chart computation
  const maxVal = Math.max(
    ...growthChart.map((d) => (activeChartFilter === 'appointments' ? d.appointments : d.revenue))
  );
  const minVal = Math.min(
    ...growthChart.map((d) => (activeChartFilter === 'appointments' ? d.appointments : d.revenue))
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* 1. TOP METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Barbearias */}
        <div
          id="master-metric-total-businesses"
          onClick={() => onSelectTab('businesses')}
          className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:border-indigo-500/40 transition-all cursor-pointer group shadow-sm hover:shadow-indigo-950/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300">Total de Barbearias</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {metrics.totalBusinesses}
            </span>
            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +{metrics.growthRatePercent}%
            </span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-300">
            {metrics.trialBusinesses} em período de teste (trial)
          </p>
        </div>

        {/* Barbearias Ativas */}
        <div
          id="master-metric-active-businesses"
          onClick={() => onSelectTab('businesses')}
          className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:border-emerald-500/40 transition-all cursor-pointer group shadow-sm hover:shadow-emerald-950/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300">Barbearias Ativas</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
              {metrics.activeBusinesses}
            </span>
            <span className="inline-flex items-center text-[11px] font-medium text-zinc-300">
              {((metrics.activeBusinesses / metrics.totalBusinesses) * 100).toFixed(0)}% ativas
            </span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-300">
            {metrics.suspendedBusinesses} suspensa temporariamente
          </p>
        </div>

        {/* Agendamentos */}
        <div
          id="master-metric-appointments"
          onClick={() => onSelectTab('appointments')}
          className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:border-blue-500/40 transition-all cursor-pointer group shadow-sm hover:shadow-blue-950/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300">Agendamentos (Mês)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {metrics.appointmentsThisMonth}
            </span>
            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +14.8%
            </span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-300">
            {metrics.totalAppointments.toLocaleString('pt-BR')} acumulados na rede
          </p>
        </div>

        {/* Receita da Plataforma (MRR) */}
        <div
          id="master-metric-revenue"
          onClick={() => onSelectTab('subscriptions')}
          className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:border-purple-500/40 transition-all cursor-pointer group shadow-sm hover:shadow-purple-950/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300">Receita da Plataforma</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              R$ {metrics.platformRevenueMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +12.2%
            </span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-300">
            MRR de assinaturas recorrentes
          </p>
        </div>
      </div>

      {/* 2. CHART SECTION + QUICK STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Growth Chart */}
        <div
          id="master-growth-chart-card"
          className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/70">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Crescimento da Plataforma
                </h2>
                <p className="text-xs text-zinc-300">
                  Evolução mensal de agendamentos e receita em toda a rede
                </p>
              </div>

              {/* Toggle metric */}
              <div className="inline-flex items-center p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveChartFilter('appointments')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeChartFilter === 'appointments'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  Agendamentos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartFilter('revenue')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeChartFilter === 'revenue'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  Receita (R$)
                </button>
              </div>
            </div>

            {/* SVG Visual Chart */}
            <div className="mt-6 pt-2">
              <div className="h-56 w-full flex items-end justify-between gap-2 sm:gap-4 px-2">
                {growthChart.map((point, index) => {
                  const val =
                    activeChartFilter === 'appointments' ? point.appointments : point.revenue;
                  const heightPercent = Math.max(15, Math.round((val / maxVal) * 100));
                  const isHovered = hoveredPointIndex === index;

                  return (
                    <div
                      key={point.label}
                      onMouseEnter={() => setHoveredPointIndex(index)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                    >
                      {/* Tooltip on hover */}
                      <div
                        className={`text-[11px] font-bold px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-white transition-opacity ${
                          isHovered ? 'opacity-100' : 'opacity-0 sm:group-hover:opacity-100'
                        }`}
                      >
                        {activeChartFilter === 'appointments'
                          ? `${point.appointments} agendamentos`
                          : `R$ ${point.revenue.toLocaleString('pt-BR')}`}
                      </div>

                      {/* Bar with gradient */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[56px] rounded-t-xl transition-all duration-300 ${
                          isHovered
                            ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-lg shadow-indigo-600/30'
                            : 'bg-gradient-to-t from-indigo-950 via-indigo-900/60 to-indigo-600/70 hover:to-indigo-500'
                        }`}
                      />

                      {/* X Label */}
                      <span
                        className={`text-xs font-semibold ${
                          isHovered ? 'text-indigo-400' : 'text-zinc-300'
                        }`}
                      >
                        {point.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/70 flex flex-wrap items-center justify-between text-xs text-zinc-300 gap-2">
            <span>Período analisado: Últimos 5 meses</span>
            <span className="text-indigo-400 font-medium">Taxa média de crescimento: +18.4% a.m.</span>
          </div>
        </div>

        {/* Right 1 Col: Platform Health & Quick Overview */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex flex-col justify-between space-y-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Saúde da Plataforma
            </h3>
            <p className="text-xs text-zinc-300 mt-1">
              Indicadores vitais de operação e infraestrutura
            </p>

            <div className="mt-5 space-y-4">
              {/* Uptime */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-300">Disponibilidade dos Sistemas</span>
                  <span className="font-semibold text-emerald-400">99.98%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[99.9%]" />
                </div>
              </div>

              {/* Taxa de Ativação */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-300">Conversão Trial → Ativa</span>
                  <span className="font-semibold text-indigo-400">87.5%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full w-[87.5%]" />
                </div>
              </div>

              {/* Distribuição de Planos */}
              <div className="pt-2 border-t border-zinc-800/70 space-y-2">
                <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                  Distribuição de Planos
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center py-1 px-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                    <span className="flex items-center gap-2 text-zinc-300">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      Plano Enterprise
                    </span>
                    <span className="font-medium text-white">4 barbearias</span>
                  </div>
                  <div className="flex justify-between items-center py-1 px-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                    <span className="flex items-center gap-2 text-zinc-300">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      Plano Pro
                    </span>
                    <span className="font-medium text-white">14 barbearias</span>
                  </div>
                  <div className="flex justify-between items-center py-1 px-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                    <span className="flex items-center gap-2 text-zinc-300">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Plano Starter
                    </span>
                    <span className="font-medium text-white">6 barbearias</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('reports')}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/50 flex items-center justify-center gap-2 transition-colors"
          >
            <span>Ver Relatório Completo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. RECENT ACTIVITY SECTION */}
      <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800/80">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/70">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Atividade Recente da Rede
            </h3>
            <p className="text-xs text-zinc-300">
              Registros e eventos gerados na plataforma em tempo real
            </p>
          </div>
          <span className="text-[11px] font-medium text-zinc-300">
            Atualizado a cada 30s
          </span>
        </div>

        <div className="mt-4 divide-y divide-zinc-800/60">
          {activities.map((act) => {
            const badgeClasses =
              act.badgeColor === 'emerald'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : act.badgeColor === 'blue'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : act.badgeColor === 'rose'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : act.badgeColor === 'purple'
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700';

            return (
              <div
                key={act.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-950/40 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="mt-1 sm:mt-0">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeClasses}`}
                    >
                      {act.badgeLabel}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">{act.title}</div>
                    <div className="text-xs text-zinc-300">{act.description}</div>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-300 whitespace-nowrap pl-9 sm:pl-0">
                  {act.timestamp}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
