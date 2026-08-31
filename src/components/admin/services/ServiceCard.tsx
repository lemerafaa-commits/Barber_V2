import React from 'react';
import { Clock, Edit3, Scissors, Sparkles, Check, Power } from 'lucide-react';
import { AdminService } from '../../../types/admin';
import { formatDurationLabel, formatPriceBRL } from '../../../services/adminServiceDomain';

interface ServiceCardProps {
  service: AdminService;
  onEdit: (service: AdminService) => void;
  onToggleActive: (id: string) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onEdit,
  onToggleActive,
}) => {
  const isCabelo = service.categoryId === 'cabelo';
  const isBarba = service.categoryId === 'barba';
  const isCombo = service.categoryId === 'combo';

  const getCategoryIcon = () => {
    if (isCombo) {
      return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
    if (isBarba) {
      return (
        <span className="text-sm leading-none select-none" role="img" aria-label="barba">
          🧔
        </span>
      );
    }
    return <Scissors className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-4 ${
        service.active
          ? 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700/90 shadow-md shadow-black/20'
          : 'bg-zinc-950/60 border-zinc-800/40 opacity-75 hover:opacity-90'
      }`}
    >
      {/* Top Header: Category Tag, Active Badge & Edit Button */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 flex items-center justify-center">
              {getCategoryIcon()}
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
              {service.categoryName || service.categoryId}
            </span>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-1.5">
            {service.active ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Ativo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] font-semibold text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                Inativo
              </span>
            )}
          </div>
        </div>

        {/* Service Name & Description */}
        <div>
          <h4 className="text-base sm:text-lg font-black text-white font-['Montserrat',sans-serif] tracking-tight">
            {service.name}
          </h4>
          {service.description && (
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
              {service.description}
            </p>
          )}
        </div>
      </div>

      {/* Metrics & Actions Footer */}
      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Duration */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{formatDurationLabel(service.durationMinutes)}</span>
          </div>

          {/* Price */}
          <div className="text-base sm:text-lg font-black text-amber-400 font-['Montserrat',sans-serif]">
            {formatPriceBRL(service.price)}
          </div>
        </div>

        {/* Quick Actions (Toggle Active & Edit) */}
        <div className="flex items-center gap-2">
          {/* Toggle Active Button */}
          <button
            type="button"
            onClick={() => onToggleActive(service.id)}
            title={service.active ? 'Desativar serviço' : 'Ativar serviço'}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              service.active
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700/60 hover:text-white'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{service.active ? 'Desativar' : 'Ativar'}</span>
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(service)}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Editar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
