import React, { useState } from 'react';
import { History, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { AdminAppointment } from '../../../types/admin';
import { AppointmentItemCard } from './AppointmentItemCard';

interface HistoryAppointmentsSectionProps {
  completedAppointments: AdminAppointment[];
  cancelledAppointments: AdminAppointment[];
}

export const HistoryAppointmentsSection: React.FC<HistoryAppointmentsSectionProps> = ({
  completedAppointments,
  cancelledAppointments,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const totalHistoryCount = completedAppointments.length + cancelledAppointments.length;

  if (totalHistoryCount === 0) {
    return null;
  }

  return (
    <section id="historico-atendimentos-dia" className="space-y-3 pt-2">
      {/* Section Header with toggle */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-900/90 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wide">
              HISTÓRICO DO DIA
            </h3>
            <p className="text-xs text-zinc-400">
              {completedAppointments.length} concluído{completedAppointments.length !== 1 ? 's' : ''} •{' '}
              {cancelledAppointments.length} cancelado{cancelledAppointments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500">
            {isExpanded ? 'Ocultar' : 'Ver'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </div>
      </div>

      {/* Expanded list */}
      {isExpanded && (
        <div className="space-y-2.5 pl-2 sm:pl-4 border-l-2 border-zinc-800/60">
          {/* Completed Section */}
          {completedAppointments.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Concluídos ({completedAppointments.length})
              </span>
              <div className="space-y-2">
                {completedAppointments.map((app) => (
                  <AppointmentItemCard
                    key={app.id}
                    appointment={app}
                    showActions={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Cancelled Section */}
          {cancelledAppointments.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                Cancelados ({cancelledAppointments.length})
              </span>
              <div className="space-y-2">
                {cancelledAppointments.map((app) => (
                  <AppointmentItemCard
                    key={app.id}
                    appointment={app}
                    showActions={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
