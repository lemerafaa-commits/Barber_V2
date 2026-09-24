import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Clock3,
  DollarSign,
  Store,
  X,
  ShieldCheck,
  RotateCcw,
  Eye,
  History,
  AlertCircle,
  MessageSquare,
  CalendarDays,
} from 'lucide-react';
import { MasterAppointment, AppointmentStatus } from '../../types/master';
import { MasterAppointmentStatusModal } from './MasterAppointmentStatusModal';

interface MasterAppointmentsProps {
  appointments: MasterAppointment[];
  onUpdateStatus?: (
    appointmentId: string,
    newStatus: AppointmentStatus,
    reason: string
  ) => Promise<void> | void;
}

export const MasterAppointments: React.FC<MasterAppointmentsProps> = ({
  appointments: initialAppointments,
  onUpdateStatus,
}) => {
  const [appointments, setAppointments] = useState<MasterAppointment[]>(initialAppointments);
  const [searchTerm, setSearchTerm] = useState('');
  const [businessFilter, setBusinessFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');

  // Selected appointment for status correction / audit details
  const [selectedAppointment, setSelectedAppointment] = useState<MasterAppointment | null>(null);

  // Synchronize if prop changes
  React.useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  // Unique businesses list for filter
  const businessOptions = useMemo(() => {
    const map = new Map<string, string>();
    appointments.forEach((apt) => map.set(apt.businessId, apt.businessName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [appointments]);

  // Clean phone helper for wa.me
  const cleanPhoneForWa = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        apt.customerName.toLowerCase().includes(q) ||
        apt.customerPhone.includes(q) ||
        apt.service.toLowerCase().includes(q) ||
        apt.businessName.toLowerCase().includes(q);

      const matchesBusiness =
        businessFilter === 'all' || apt.businessId === businessFilter;

      const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;

      // Period filtering (simulated mock dates: current mock is 17/09/2026)
      let matchesPeriod = true;
      if (periodFilter === 'today') {
        matchesPeriod = apt.date === '17/09/2026';
      } else if (periodFilter === '7days') {
        matchesPeriod =
          apt.date.includes('09/2026') &&
          parseInt(apt.date.split('/')[0], 10) >= 10;
      } else if (periodFilter === '30days') {
        matchesPeriod = apt.date.includes('09/2026');
      }

      return matchesSearch && matchesBusiness && matchesStatus && matchesPeriod;
    });
  }, [appointments, searchTerm, businessFilter, statusFilter, periodFilter]);

  // Aggregate stats
  const totalValue = useMemo(() => {
    return filteredAppointments.reduce((acc, curr) => acc + curr.totalPrice, 0);
  }, [filteredAppointments]);

  // Status handler
  const handleSaveStatus = async (
    appointmentId: string,
    newStatus: AppointmentStatus,
    reason: string
  ) => {
    if (onUpdateStatus) {
      await onUpdateStatus(appointmentId, newStatus, reason);
    }

    // Local state update for immediate feedback
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(
      now.getMonth() + 1
    ).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(
      2,
      '0'
    )}:${String(now.getMinutes()).padStart(2, '0')}`;

    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id !== appointmentId) return apt;
        return {
          ...apt,
          status: newStatus,
          statusHistory: [
            {
              id: `hist_${Date.now()}`,
              appointmentId,
              fromStatus: apt.status,
              toStatus: newStatus,
              changedBy: 'Rafael Leme (Master)',
              changedByRole: 'master',
              reason,
              changedAt: formattedDate,
            },
            ...(apt.statusHistory || []),
          ],
        };
      })
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Gestão Operacional
            </span>
            <span className="text-xs text-zinc-300">Auditoria & Rastreabilidade</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-1">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Controle Global de Agendamentos
          </h2>
          <p className="text-xs text-zinc-300">
            Acompanhe a agenda da rede e realize correções administrativas de status com justificativa gravada.
          </p>
        </div>

        {/* Quick totals badge */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-300">Volume filtrado: </span>
            <strong className="text-white">{filteredAppointments.length} atendimentos</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <span>Total em Serviços: </span>
            <strong>R$ {totalValue.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="master-appointment-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, telefone, serviço ou barbearia..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Business Select Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-300 hidden sm:inline font-medium">Barbearia:</span>
              <select
                id="master-filter-business-select"
                value={businessFilter}
                onChange={(e) => setBusinessFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="all">Todas as Barbearias</option>
                {businessOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Período Filter as Requested */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-300 hidden sm:inline font-medium">Período:</span>
              <select
                id="master-filter-period-select"
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as any)}
                className="px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="all">Todo o histórico</option>
                <option value="today">Hoje (17/09)</option>
                <option value="7days">Últimos 7 dias</option>
                <option value="30days">Últimos 30 dias</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs (Agendado, Confirmado, Concluído, Cancelado) */}
        <div className="flex items-center gap-1 overflow-x-auto pt-1 border-t border-zinc-800/60 text-xs">
          <span className="text-[11px] text-zinc-300 font-semibold mr-1 shrink-0">Status:</span>
          {[
            { id: 'all', label: 'Todos os Status' },
            { id: 'scheduled', label: 'Agendados' },
            { id: 'confirmed', label: 'Confirmados' },
            { id: 'completed', label: 'Concluídos' },
            { id: 'cancelled', label: 'Cancelados' },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
                statusFilter === st.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments Table */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-300 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-3.5 px-4 sm:px-6">Barbearia</th>
                <th className="py-3.5 px-4">Cliente / Contato</th>
                <th className="py-3.5 px-4">Data & Horário</th>
                <th className="py-3.5 px-4">Serviço & Profissional</th>
                <th className="py-3.5 px-4">Valor</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Ação Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-300 text-xs">
                    Nenhum agendamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => {
                  const hasMasterAudit = apt.statusHistory?.some(
                    (h) => h.changedByRole === 'master'
                  );

                  return (
                    <tr
                      key={apt.id}
                      className="hover:bg-zinc-950/40 transition-colors"
                    >
                      {/* Barbearia */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-2.5">
                          <Store className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div>
                            <span className="font-semibold text-white block">
                              {apt.businessName}
                            </span>
                            <span className="text-[10px] text-zinc-300 font-mono">
                              {apt.businessId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-zinc-100 block">{apt.customerName}</span>
                        <a
                          href={`https://wa.me/${cleanPhoneForWa(apt.customerPhone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium mt-0.5"
                          title="Falar no WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{apt.customerPhone}</span>
                        </a>
                      </td>

                      {/* Data & Horário */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-200 font-medium">{apt.date}</span>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[11px] text-indigo-300 font-mono">
                            {apt.time}
                          </span>
                        </div>
                        {apt.durationMinutes && (
                          <span className="text-[10px] text-zinc-300 block mt-0.5">
                            Duração: {apt.durationMinutes} min
                          </span>
                        )}
                      </td>

                      {/* Serviço */}
                      <td className="py-3.5 px-4">
                        <span className="text-zinc-100 font-medium block">{apt.service}</span>
                        {apt.barberName && (
                          <span className="text-[10px] text-zinc-300 block">
                            Profissional: {apt.barberName}
                          </span>
                        )}
                      </td>

                      {/* Valor */}
                      <td className="py-3.5 px-4 font-bold text-white text-xs">
                        R$ {apt.totalPrice.toFixed(2)}
                      </td>

                      {/* Status + Badge Alterado pelo Master */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          {apt.status === 'scheduled' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3 h-3" />
                              Agendado
                            </span>
                          ) : apt.status === 'confirmed' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              <Clock3 className="w-3 h-3" />
                              Confirmado
                            </span>
                          ) : apt.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              Concluído
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              <XCircle className="w-3 h-3" />
                              Cancelado
                            </span>
                          )}

                          {/* Aviso / Badge de Intervenção do Master */}
                          {hasMasterAudit && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                              title="Este agendamento foi alterado administrativamente pelo suporte Master"
                            >
                              <ShieldCheck className="w-2.5 h-2.5" />
                              Alterado pelo Master
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Ação Master */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <button
                          id={`btn-manage-apt-${apt.id}`}
                          type="button"
                          onClick={() => setSelectedAppointment(apt)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.2 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Corrigir Status</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex items-center justify-between text-xs text-zinc-300">
          <span>
            Exibindo {filteredAppointments.length} de {appointments.length} agendamentos na plataforma
          </span>
          <span className="text-[11px] text-zinc-300 font-medium">
            Rastreabilidade completa com registro de autor e justificativa
          </span>
        </div>
      </div>

      {/* Modal: Correção Administrativa & Histórico de Auditoria */}
      {selectedAppointment && (
        <MasterAppointmentStatusModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onSaveStatus={handleSaveStatus}
        />
      )}
    </div>
  );
};
