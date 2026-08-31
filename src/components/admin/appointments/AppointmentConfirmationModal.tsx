import React from 'react';
import { AlertTriangle, CheckCircle, Clock, Scissors, User } from 'lucide-react';
import { AdminAppointment } from '../../../types/admin';

export type AppointmentActionType = 'complete' | 'cancel';

interface AppointmentConfirmationModalProps {
  isOpen: boolean;
  type: AppointmentActionType | null;
  appointment: AdminAppointment | null;
  isProcessing: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const AppointmentConfirmationModal: React.FC<AppointmentConfirmationModalProps> = ({
  isOpen,
  type,
  appointment,
  isProcessing,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !type || !appointment) return null;

  const isComplete = type === 'complete';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5">
        {/* Header Icon + Title */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isComplete
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}
          >
            {isComplete ? (
              <CheckCircle className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            )}
          </div>

          <div className="space-y-1">
            <h3
              id="modal-title"
              className="font-bold text-lg text-white font-['Montserrat',sans-serif]"
            >
              {isComplete ? 'Concluir atendimento?' : 'Cancelar agendamento?'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {isComplete
                ? 'Você tem certeza que deseja marcar este atendimento como concluído?'
                : 'Você tem certeza que deseja cancelar este agendamento?'}
            </p>
          </div>
        </div>

        {/* Appointment Mini Summary Card */}
        <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-white font-semibold">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>{appointment.customerName}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400 font-mono font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>{appointment.time}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-400 pt-1 border-t border-zinc-900 truncate">
            <Scissors className="w-3 h-3 text-zinc-500 shrink-0" />
            <span className="truncate">
              {appointment.services
                .map((s) => `${s.category}${s.option ? ` (${s.option})` : ''}`)
                .join(' + ')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {/* Cancel/Back Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 hover:text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Voltar
          </button>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed ${
              isComplete
                ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20 active:scale-98'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20 active:scale-98'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <span>
                {isComplete ? 'Concluir atendimento' : 'Cancelar agendamento'}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
