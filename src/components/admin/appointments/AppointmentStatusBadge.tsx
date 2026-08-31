import React from 'react';
import { CheckCircle2, Clock, Check, XCircle } from 'lucide-react';
import { AppointmentStatus } from '../../../types/admin';

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
  size?: 'sm' | 'md';
}

export const AppointmentStatusBadge: React.FC<AppointmentStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const isSm = size === 'sm';

  switch (status) {
    case 'in_progress':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/30 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block -ml-3.5 mr-0.5" />
          <span>Em andamento</span>
        </span>
      );

    case 'completed':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold text-zinc-400 bg-zinc-800/80 rounded-full border border-zinc-700/80 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
          <span>Concluído</span>
        </span>
      );

    case 'cancelled':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold text-rose-400 bg-rose-500/10 rounded-full border border-rose-500/20 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>Cancelado</span>
        </span>
      );

    case 'confirmed':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold text-sky-400 bg-sky-500/10 rounded-full border border-sky-500/20 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Confirmado</span>
        </span>
      );
  }
};
