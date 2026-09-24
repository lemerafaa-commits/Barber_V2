import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock3,
  AlertCircle,
  FileText,
  User,
  Store,
  Phone,
  MessageSquare,
  ArrowRight,
  History,
  RotateCcw,
} from 'lucide-react';
import {
  MasterAppointment,
  AppointmentStatus,
  AppointmentStatusHistory,
} from '../../types/master';

interface MasterAppointmentStatusModalProps {
  appointment: MasterAppointment | null;
  onClose: () => void;
  onSaveStatus: (
    appointmentId: string,
    newStatus: AppointmentStatus,
    reason: string
  ) => Promise<void> | void;
}

const QUICK_REASONS = [
  'Ajuste manual pelo suporte Master',
  'Cancelado por solicitação do cliente',
  'Erro operacional da barbearia',
  'Presença confirmada diretamente pelo cliente',
  'Atendimento concluído manualmente',
];

export const MasterAppointmentStatusModal: React.FC<MasterAppointmentStatusModalProps> = ({
  appointment,
  onClose,
  onSaveStatus,
}) => {
  if (!appointment) return null;

  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus>(appointment.status);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const cleanPhoneForWa = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  };

  const hasMasterIntervention = appointment.statusHistory?.some(
    (h) => h.changedByRole === 'master'
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatus === appointment.status) {
      setErrorMsg('Selecione um status diferente do atual para registrar a alteração.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Informe o motivo ou justificativa para a correção administrativa.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSaveStatus(appointment.id, selectedStatus, reason.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Agendado
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <Clock3 className="w-3.5 h-3.5" />
            Confirmado
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Concluído
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            Cancelado
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        id="master-apt-modal-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div
        id="master-apt-modal-content"
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Controle Administrativo de Agendamento
                </h3>
                {hasMasterIntervention && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    <ShieldCheck className="w-3 h-3 text-indigo-400" />
                    Alterado pelo Master
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">ID: {appointment.id}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs text-zinc-300">
          {/* Card: Dados do Agendamento */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            <div>
              <span className="text-zinc-400 text-[11px] block">Barbearia:</span>
              <strong className="text-white text-xs mt-0.5 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-indigo-400" />
                {appointment.businessName}
              </strong>
            </div>

            <div>
              <span className="text-zinc-400 text-[11px] block">Cliente:</span>
              <span className="text-zinc-100 font-semibold mt-0.5 block">
                {appointment.customerName}
              </span>
            </div>

            <div>
              <span className="text-zinc-400 text-[11px] block">WhatsApp Cliente:</span>
              <a
                href={`https://wa.me/${cleanPhoneForWa(appointment.customerPhone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium mt-0.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{appointment.customerPhone}</span>
              </a>
            </div>

            <div>
              <span className="text-zinc-400 text-[11px] block">Data & Horário:</span>
              <span className="text-zinc-200 mt-0.5 block">
                {appointment.date} às {appointment.time}
                {appointment.durationMinutes ? ` (${appointment.durationMinutes} min)` : ''}
              </span>
            </div>

            <div>
              <span className="text-zinc-400 text-[11px] block">Serviço:</span>
              <span className="text-zinc-200 mt-0.5 block">{appointment.service}</span>
            </div>

            <div>
              <span className="text-zinc-400 text-[11px] block">Valor Total:</span>
              <strong className="text-emerald-400 text-sm mt-0.5 block">
                R$ {appointment.totalPrice.toFixed(2)}
              </strong>
            </div>

            {appointment.barberName && (
              <div>
                <span className="text-zinc-400 text-[11px] block">Profissional / Cadeira:</span>
                <span className="text-zinc-200 mt-0.5 block">{appointment.barberName}</span>
              </div>
            )}

            <div className="sm:col-span-2">
              <span className="text-zinc-400 text-[11px] block">Status Atual:</span>
              <div className="mt-1">{renderStatusBadge(appointment.status)}</div>
            </div>
          </div>

          {/* Form: Correção Administrativa */}
          <form onSubmit={handleSave} className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                Correção de Status pelo Master
              </h4>
              <span className="text-[11px] text-zinc-400">Auditoria Obrigatória</span>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Novo Status */}
            <div>
              <label className="text-zinc-300 font-medium block mb-1.5 text-xs">
                Selecione o Novo Status:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'scheduled', label: 'Agendado' },
                  { id: 'confirmed', label: 'Confirmado' },
                  { id: 'completed', label: 'Concluído' },
                  { id: 'cancelled', label: 'Cancelado' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStatus(st.id as AppointmentStatus)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedStatus === st.id
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Motivo Obrigatório */}
            <div>
              <label className="text-zinc-300 font-medium block mb-1 text-xs">
                Motivo da Alteração Administrativa:
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Cancelado por solicitação do cliente via WhatsApp de suporte"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500"
              />

              {/* Quick Reason Suggestions */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] text-zinc-400 self-center mr-1">Sugestões rápidas:</span>
                {QUICK_REASONS.map((qr) => (
                  <button
                    key={qr}
                    type="button"
                    onClick={() => setReason(qr)}
                    className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Gravando Alteração...' : 'Salvar Correção Administrativa'}</span>
              </button>
            </div>
          </form>

          {/* Histórico de Alterações de Status (Audit Log) */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-purple-400" />
                Histórico de Mudanças de Status (Trilha de Auditoria)
              </h4>
              <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                {appointment.statusHistory?.length || 0} registro(s)
              </span>
            </div>

            {!appointment.statusHistory || appointment.statusHistory.length === 0 ? (
              <p className="text-zinc-400 text-xs py-3 text-center italic">
                Nenhuma alteração de status registrada no histórico deste agendamento.
              </p>
            ) : (
              <div className="space-y-2.5">
                {appointment.statusHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/80 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-200">{item.changedBy}</span>
                        {item.changedByRole === 'master' ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                            Master
                          </span>
                        ) : item.changedByRole === 'business_admin' ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300">
                            Barbearia
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[10px] text-zinc-400 bg-zinc-800">
                            {item.changedByRole}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 font-mono">{item.changedAt}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-zinc-400">Transição:</span>
                      <span className="font-medium text-zinc-300">{item.fromStatus}</span>
                      <ArrowRight className="w-3 h-3 text-zinc-400" />
                      <strong className="text-indigo-400 font-bold">{item.toStatus}</strong>
                    </div>

                    {item.reason && (
                      <div className="text-zinc-300 bg-zinc-950 p-2 rounded-lg border border-zinc-800 text-[11px] mt-1">
                        <span className="text-zinc-400 block text-[10px] font-semibold">Motivo:</span>
                        <span>{item.reason}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
