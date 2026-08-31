import React from 'react';
import { Clock, Sun, Sunset, Moon, AlertCircle, RefreshCw, Check, Lock } from 'lucide-react';
import { TimeSlot } from '../types/booking';

interface TimeSelectorProps {
  timeSlots: TimeSlot[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  isLoading?: boolean;
  hasConflictError?: boolean;
  onRetryOrChangeDate?: () => void;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({
  timeSlots,
  selectedTime,
  onSelectTime,
  isLoading = false,
  hasConflictError = false,
  onRetryOrChangeDate,
}) => {
  const morningSlots = timeSlots.filter((s) => {
    const hour = parseInt(s.time.split(':')[0], 10);
    return hour < 12;
  });

  const afternoonSlots = timeSlots.filter((s) => {
    const hour = parseInt(s.time.split(':')[0], 10);
    return hour >= 12 && hour < 18;
  });

  const eveningSlots = timeSlots.filter((s) => {
    const hour = parseInt(s.time.split(':')[0], 10);
    return hour >= 18;
  });

  const availableCount = timeSlots.filter((s) => s.available).length;

  return (
    <section className="w-full space-y-4 pt-2">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold tracking-wider text-amber-500 uppercase">
            Etapa 3
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Montserrat',sans-serif] mt-0.5">
            Escolha o horário
          </h2>
        </div>

        {availableCount > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
            {availableCount} livres
          </span>
        )}
      </div>

      {/* Slot Conflict Banner */}
      {hasConflictError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500 text-amber-200 animate-bounce-short space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-400 text-sm sm:text-base">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Esse horário acabou de ser reservado.</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-200/90">
            Outro cliente confirmou esse agendamento instantes atrás. Escolha outro horário para continuar.
          </p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
          <p className="text-sm font-medium text-zinc-300">
            Verificando horários em tempo real...
          </p>
        </div>
      ) : availableCount === 0 ? (
        /* Empty State: No slots available on this day */
        <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base sm:text-lg text-white">
            Nenhum horário disponível nesta data
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
            Todos os horários para este dia foram reservados. Escolha outra data no seletor acima.
          </p>
          {onRetryOrChangeDate && (
            <button
              type="button"
              onClick={onRetryOrChangeDate}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              Escolher outra data
            </button>
          )}
        </div>
      ) : (
        /* Time slots grouped by Period */
        <div className="space-y-4">
          {morningSlots.length > 0 && (
            <PeriodTimeGroup
              title="Manhã"
              icon={<Sun className="w-4 h-4 text-amber-400" />}
              slots={morningSlots}
              selectedTime={selectedTime}
              onSelectTime={onSelectTime}
            />
          )}

          {afternoonSlots.length > 0 && (
            <PeriodTimeGroup
              title="Tarde"
              icon={<Sunset className="w-4 h-4 text-amber-400" />}
              slots={afternoonSlots}
              selectedTime={selectedTime}
              onSelectTime={onSelectTime}
            />
          )}

          {eveningSlots.length > 0 && (
            <PeriodTimeGroup
              title="Noite"
              icon={<Moon className="w-4 h-4 text-amber-400" />}
              slots={eveningSlots}
              selectedTime={selectedTime}
              onSelectTime={onSelectTime}
            />
          )}
        </div>
      )}
    </section>
  );
};

interface PeriodTimeGroupProps {
  title: string;
  icon: React.ReactNode;
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

const PeriodTimeGroup: React.FC<PeriodTimeGroupProps> = ({
  title,
  icon,
  slots,
  selectedTime,
  onSelectTime,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
        {icon}
        <span>{title}</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
        {slots.map((slot) => {
          const isSelected = selectedTime === slot.time;
          const isOccupied = !slot.available;

          return (
            <button
              key={slot.time}
              type="button"
              disabled={isOccupied}
              onClick={() => !isOccupied && onSelectTime(slot.time)}
              className={`relative flex items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-sm font-bold transition-all duration-150 focus:outline-none cursor-pointer ${
                isOccupied
                  ? 'bg-zinc-900/40 text-zinc-600 border border-zinc-800/40 line-through cursor-not-allowed opacity-40'
                  : isSelected
                  ? 'bg-amber-500 text-zinc-950 border-2 border-amber-400 shadow-lg shadow-amber-500/20 scale-105 font-mono'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-amber-500/40 font-mono'
              }`}
            >
              <span>{slot.time}</span>
              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-zinc-950 shrink-0" />}
              {isOccupied && <Lock className="w-3 h-3 text-zinc-600 shrink-0 hidden sm:inline" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
