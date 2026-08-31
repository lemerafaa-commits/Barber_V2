import React from 'react';
import {
  Clock,
  CheckCircle,
  X,
  Phone,
  Scissors,
} from 'lucide-react';
import { AdminAppointment } from '../../../types/admin';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { formatCurrencyBRL } from '../../../services/adminAppointmentDomain';

interface NextAppointmentCardProps {
  appointment: AdminAppointment;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}

export const NextAppointmentCard: React.FC<NextAppointmentCardProps> = ({
  appointment,
  onComplete,
  onCancel,
}) => {
  const isInProgress = appointment.status === 'in_progress';

  return (
    <section
      id="proximo-atendimento-spotlight"
      className={`p-5 sm:p-6 rounded-2xl border-2 shadow-xl relative overflow-hidden transition-all ${
        isInProgress
          ? 'bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-950 border-emerald-500/50 shadow-emerald-950/30'
          : 'bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-950 border-amber-500/50 shadow-amber-950/20'
      }`}
    >
      {/* Subtle background glow */}
      <div
        className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
          isInProgress ? 'bg-emerald-500/15' : 'bg-amber-500/15'
        }`}
      />

      {/* Card Header: Tag & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
              isInProgress
                ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
                : 'text-amber-400 bg-amber-500/20 border-amber-500/30'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {isInProgress ? 'EM ATENDIMENTO AGORA' : 'PRÓXIMO ATENDIMENTO'}
          </span>
        </div>

        <AppointmentStatusBadge status={appointment.status} />
      </div>

      {/* Appointment Main Info */}
      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span
              className={`text-2xl sm:text-3xl font-black font-['Montserrat',sans-serif] ${
                isInProgress ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {appointment.time}
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>{appointment.customerName}</span>
            </h3>
          </div>

          {/* Service items breakdown */}
          <div className="text-sm text-zinc-300 font-medium flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-zinc-200">
              <Scissors className="w-4 h-4 text-amber-400 shrink-0" />
              {appointment.services
                .map((s) => `${s.category}${s.option ? ` (${s.option})` : ''}`)
                .join(' + ')}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-zinc-400">
              {appointment.duration} min
            </span>
          </div>

          {appointment.customerPhone && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Phone className="w-3.5 h-3.5 text-zinc-500" />
              <span>{appointment.customerPhone}</span>
            </div>
          )}
        </div>

        {/* Total Price */}
        <div className="sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-zinc-800/80 flex sm:flex-col justify-between items-baseline sm:items-end">
          <span className="text-xs text-zinc-400 uppercase tracking-wider font-bold">
            Valor Total
          </span>
          <span
            className={`text-xl sm:text-2xl font-black font-['Montserrat',sans-serif] ${
              isInProgress ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {formatCurrencyBRL(appointment.totalPrice)}
          </span>
        </div>
      </div>

      {/* Action Buttons: Seamless mobile touch operation */}
      <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
        {/* Cancel button (Secondary) */}
        <button
          type="button"
          onClick={() => onCancel(appointment.id)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2.5 rounded-xl bg-zinc-900 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer active:scale-[0.98]"
        >
          <X className="w-4 h-4" />
          <span>Cancelar</span>
        </button>

        {/* Primary Action Button: CONCLUIR ATENDIMENTO */}
        <button
          type="button"
          onClick={() => onComplete(appointment.id)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
        >
          <CheckCircle className="w-4 h-4 stroke-[2.5]" />
          <span>CONCLUIR ATENDIMENTO</span>
        </button>
      </div>
    </section>
  );
};
