import React from 'react';
import {
  Clock,
  Phone,
  CheckCircle,
  X,
} from 'lucide-react';
import { AdminAppointment } from '../../../types/admin';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { formatCurrencyBRL } from '../../../services/adminAppointmentDomain';

interface AppointmentItemCardProps {
  appointment: AdminAppointment;
  isNext?: boolean;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  showActions?: boolean;
}

export const AppointmentItemCard: React.FC<AppointmentItemCardProps> = ({
  appointment,
  isNext = false,
  onComplete,
  onCancel,
  showActions = true,
}) => {
  const isInProgress = appointment.status === 'in_progress';
  const isConfirmed = appointment.status === 'confirmed';
  const isActive = isConfirmed || isInProgress;

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border transition-all ${
        isInProgress
          ? 'border-emerald-500/60 bg-emerald-950/20 shadow-md shadow-emerald-950/20'
          : isNext
          ? 'border-amber-500/50 bg-amber-950/20 shadow-md shadow-amber-950/10'
          : 'border-zinc-800/80 hover:border-zinc-700'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        {/* Time & Customer Info */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Time Badge */}
          <div
            className={`px-3 py-2 rounded-xl border font-black text-base sm:text-lg font-['Montserrat',sans-serif] shrink-0 text-center min-w-[72px] ${
              isInProgress
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                : isNext
                ? 'bg-amber-950/80 border-amber-500/40 text-amber-400'
                : 'bg-zinc-950 border-zinc-800 text-amber-400'
            }`}
          >
            {appointment.time}
          </div>

          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-white text-base truncate">
                {appointment.customerName}
              </h3>
              {isInProgress && (
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  Em atendimento
                </span>
              )}
              {isNext && !isInProgress && (
                <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  Próximo
                </span>
              )}
            </div>

            {/* Service details */}
            <div className="space-y-0.5">
              {appointment.services.map((srv, idx) => (
                <div key={idx} className="text-xs sm:text-sm text-zinc-300">
                  <span className="font-semibold">{srv.category}</span>
                  {srv.option && (
                    <span className="text-amber-400 font-medium ml-1.5">
                      • {srv.option}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Duration & Phone */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {appointment.duration} min
              </span>
              {appointment.customerPhone && (
                <span className="flex items-center gap-1 text-zinc-500">
                  <Phone className="w-3.5 h-3.5" />
                  {appointment.customerPhone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Price, Status & Quick Action Buttons */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-0 border-zinc-800/80 pt-3 sm:pt-0 shrink-0 gap-2">
          <div className="text-left sm:text-right">
            <span className="text-base sm:text-lg font-black text-amber-400 font-['Montserrat',sans-serif] block">
              {formatCurrencyBRL(appointment.totalPrice)}
            </span>
            <div className="mt-0.5">
              <AppointmentStatusBadge status={appointment.status} size="sm" />
            </div>
          </div>

          {/* Inline Action Controls if Active (Concluir + Cancelar) */}
          {showActions && isActive && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {onComplete && (
                <button
                  type="button"
                  onClick={() => onComplete(appointment.id)}
                  title="Concluir atendimento"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Concluir</span>
                </button>
              )}

              {onCancel && (
                <button
                  type="button"
                  onClick={() => onCancel(appointment.id)}
                  title="Cancelar agendamento"
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-zinc-700 hover:border-rose-500/30 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
