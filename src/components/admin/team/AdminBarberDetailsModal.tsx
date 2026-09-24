import React from 'react';
import {
  X,
  Phone,
  Mail,
  Calendar,
  Clock,
  Scissors,
  CheckCircle2,
  XCircle,
  Edit3,
  Power,
  ShieldCheck,
  Coffee,
} from 'lucide-react';
import { Barber, AdminService } from '../../../types/admin';

interface AdminBarberDetailsModalProps {
  barber: Barber;
  services: AdminService[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}

export const AdminBarberDetailsModal: React.FC<AdminBarberDetailsModalProps> = ({
  barber,
  services,
  isOpen,
  onClose,
  onEdit,
  onToggleStatus,
}) => {
  if (!isOpen) return null;

  const isActive = barber.status === 'active';

  // Format creation date
  const formattedCreatedAt = new Date(barber.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Resolve custom services with catalog and duration configs
  const resolvedServices = barber.serviceMode === 'custom'
    ? barber.serviceIds.map((id) => {
        const catalogService = services.find((s) => s.id === id);
        const config = barber.serviceConfigs?.find((c) => c.serviceId === id);
        const name = catalogService?.name || config?.serviceName || 'Serviço';
        const price = catalogService ? catalogService.price : null;
        const isCustomDuration = config?.durationMode === 'custom' && typeof config.customDurationMinutes === 'number';
        const duration = isCustomDuration
          ? config!.customDurationMinutes!
          : catalogService?.durationMinutes || 30;
        const isInactive = catalogService && catalogService.active === false;

        return {
          id,
          name,
          price,
          duration,
          isCustomDuration,
          isInactive,
        };
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Photo, Name and Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <img
              src={barber.photoUrl}
              alt={barber.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-zinc-700/80 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">{barber.name}</h3>
                {isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                    <XCircle className="w-3 h-3" />
                    Inativo
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                Cadastrado em {formattedCreatedAt}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">WhatsApp</div>
              <a
                href={`https://wa.me/55${barber.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-zinc-200 hover:text-amber-400 transition-colors"
              >
                {barber.whatsapp}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">E-mail</div>
              <div className="text-xs font-semibold text-zinc-200 truncate max-w-[180px]">
                {barber.email || <span className="text-zinc-500 font-normal">Não informado</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Services Assigned */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-amber-500" />
              Serviços Habilitados
            </span>
            <span className="text-[11px] text-zinc-500">
              {barber.serviceMode === 'all'
                ? 'Todos os serviços da barbearia'
                : `${resolvedServices.length} serviço(s) específico(s)`}
            </span>
          </div>

          {barber.serviceMode === 'all' ? (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Este profissional está configurado para atender <strong>todos os serviços</strong> disponíveis e futuros da barbearia.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {resolvedServices.map((service) => (
                <div
                  key={service.id}
                  className="p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-zinc-200">{service.name}</span>
                      {service.isInactive && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Inativo
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{service.duration} min</span>
                      {service.isCustomDuration && (
                        <span className="text-[10px] text-amber-400 font-medium">(personalizado)</span>
                      )}
                    </div>
                  </div>
                  {service.price !== null && (
                    <span className="text-amber-400 font-bold">R$ {service.price.toFixed(2)}</span>
                  )}
                </div>
              ))}
              {resolvedServices.length === 0 && (
                <div className="p-3 rounded-xl bg-zinc-950 text-zinc-500 text-xs col-span-2 text-center">
                  Nenhum serviço personalizado associado.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Work Hours Schedule */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Disponibilidade e Horários de Trabalho
            </span>
          </div>

          <div className="grid grid-cols-1 divide-y divide-zinc-800/60 rounded-xl bg-zinc-950/50 border border-zinc-800/80 overflow-hidden text-xs">
            {barber.schedule.map((day) => (
              <div key={day.dayOfWeek} className="px-3.5 py-2.5 flex items-center justify-between">
                <div className="w-24 font-bold text-zinc-300">{day.dayName}</div>
                <div>
                  {day.isDayOff ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-800 text-zinc-400">
                      Folga
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 text-zinc-200 font-medium">
                      <span>
                        {day.startTime} — {day.endTime}
                      </span>
                      {day.breakStartTime && day.breakEndTime && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                          <Coffee className="w-3 h-3 text-amber-500/80" />
                          Almoço: {day.breakStartTime} — {day.breakEndTime}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => {
              onClose();
              onToggleStatus();
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              isActive
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isActive ? 'Desativar Barbeiro' : 'Ativar Barbeiro'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors shadow-sm shadow-amber-500/20 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Barbeiro</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
