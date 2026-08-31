import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Sun, Sunset, Moon, AlertCircle, RefreshCw, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { DayOption, TimeSlot, Service } from '../types/booking';

interface DateAndTimeSelectorProps {
  days: DayOption[];
  selectedDate: DayOption | null;
  onSelectDate: (day: DayOption) => void;
  timeSlots: TimeSlot[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  selectedService: Service | null;
  isLoading?: boolean;
  fetchError?: string | null;
  onRetry?: () => void;
  hasConflictError?: boolean;
  onBack?: () => void;
  onContinue?: () => void;
}

export const DateAndTimeSelector: React.FC<DateAndTimeSelectorProps> = ({
  days,
  selectedDate,
  onSelectDate,
  timeSlots,
  selectedTime,
  onSelectTime,
  selectedService,
  isLoading = false,
  fetchError = null,
  onRetry,
  hasConflictError = false,
  onBack,
  onContinue,
}) => {
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const availableSlotsCount = timeSlots.filter((s) => s.available).length;

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

  return (
    <section className="w-full space-y-6 pt-1">
      {/* Voltar button at top */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Serviços</span>
        </button>
      )}

      {/* Section Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-bold tracking-wider text-amber-500 uppercase">
            Etapa 2
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Montserrat',sans-serif] mt-0.5">
            Quando você quer vir?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Escolha um dia e depois um horário disponível.
          </p>
        </div>

        {/* Calendar Picker Modal Trigger */}
        <button
          type="button"
          onClick={() => setShowCalendarModal(!showCalendarModal)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-xs font-semibold text-zinc-300 hover:text-white transition-all focus:outline-none cursor-pointer shrink-0 mt-1"
        >
          <CalendarIcon className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Ver calendário</span>
          <span className="sm:hidden">Outro dia</span>
        </button>
      </div>

      {/* Main Single Combined Card/Block for Date & Time */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-6 shadow-xl">
        {/* ================= DATA SELECTION ================= */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            1. Selecione o dia
          </p>

          <div className="relative w-full">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 px-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {days.map((day) => {
                const isSelected = selectedDate?.dateString === day.dateString;
                const isDisabled = !day.isAvailable;

                return (
                  <button
                    key={day.dateString}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => !isDisabled && onSelectDate(day)}
                    className={`relative flex flex-col items-center justify-center min-w-[64px] sm:min-w-[72px] h-[72px] sm:h-[80px] rounded-xl p-2 transition-all duration-150 shrink-0 focus:outline-none ${
                      isDisabled
                        ? 'bg-zinc-950/40 border border-zinc-800/40 text-zinc-700 cursor-not-allowed opacity-40'
                        : isSelected
                        ? 'bg-amber-500 text-zinc-950 font-black border-2 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                        : 'bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 cursor-pointer'
                    }`}
                  >
                    {/* Today Badge */}
                    {day.isToday && (
                      <span
                        className={`absolute top-1 px-1 py-0.2 text-[8px] font-extrabold uppercase rounded ${
                          isSelected ? 'bg-zinc-950/20 text-zinc-950' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        Hoje
                      </span>
                    )}

                    {/* Day of Week */}
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        isSelected ? 'text-zinc-950' : isDisabled ? 'text-zinc-700' : 'text-zinc-400'
                      }`}
                    >
                      {day.dayOfWeek}
                    </span>

                    {/* Day Number */}
                    <span
                      className={`text-xl sm:text-2xl font-black font-['Montserrat',sans-serif] leading-none my-0.5 ${
                        isSelected ? 'text-zinc-950' : isDisabled ? 'text-zinc-700' : 'text-white'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800/80 my-2" />

        {/* ================= HORÁRIO SELECTION ================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              2. Horários disponíveis
            </h3>
            {selectedDate && !isLoading && !fetchError && (
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {availableSlotsCount} {availableSlotsCount === 1 ? 'vaga' : 'vagas'}
              </span>
            )}
          </div>

          {/* Slot Conflict Banner */}
          {hasConflictError && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500 text-amber-200 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Esse horário acabou de ser reservado.</span>
              </div>
              <p className="text-zinc-300">
                Escolha outro horário disponível para continuar seu agendamento.
              </p>
            </div>
          )}

          {/* Error Banner if Firestore query fails */}
          {fetchError ? (
            <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/30 text-center space-y-3">
              <AlertCircle className="w-6 h-6 text-red-400 mx-auto" />
              <p className="text-sm font-bold text-red-200">{fetchError}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 font-bold text-xs border border-red-500/40 transition-colors cursor-pointer"
                >
                  Tentar novamente
                </button>
              )}
            </div>
          ) : isLoading ? (
            /* Loading Skeleton */
            <div className="p-6 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
              <p className="text-xs text-zinc-400 font-semibold">Verificando horários...</p>
            </div>
          ) : !selectedDate?.isAvailable || timeSlots.length === 0 ? (
            /* Empty State */
            <div className="p-6 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center space-y-2">
              <p className="text-sm font-bold text-zinc-300">
                Nenhum horário disponível neste dia.
              </p>
              <p className="text-xs text-amber-400 font-semibold">
                Por favor, escolha outra data acima.
              </p>
            </div>
          ) : (
            /* Time slots grouped by Period */
            <div className="space-y-4">
              {morningSlots.length > 0 && (
                <PeriodGroup
                  title="Manhã"
                  icon={<Sun className="w-3.5 h-3.5 text-amber-400" />}
                  slots={morningSlots}
                  selectedTime={selectedTime}
                  onSelectTime={onSelectTime}
                />
              )}

              {afternoonSlots.length > 0 && (
                <PeriodGroup
                  title="Tarde"
                  icon={<Sunset className="w-3.5 h-3.5 text-amber-400" />}
                  slots={afternoonSlots}
                  selectedTime={selectedTime}
                  onSelectTime={onSelectTime}
                />
              )}

              {eveningSlots.length > 0 && (
                <PeriodGroup
                  title="Noite"
                  icon={<Moon className="w-3.5 h-3.5 text-amber-400" />}
                  slots={eveningSlots}
                  selectedTime={selectedTime}
                  onSelectTime={onSelectTime}
                />
              )}
            </div>
          )}
        </div>

        {/* Selected Confirmation Banner inside the block */}
        {selectedDate && selectedTime && !isLoading && !fetchError && (
          <div className="pt-2">
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-500/30 flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white capitalize">
                    {selectedDate.fullFormattedDate} às <strong className="text-amber-400">{selectedTime}</strong>
                  </p>
                  {selectedService && (
                    <p className="text-[11px] text-zinc-400">
                      Duração estimada: {selectedService.durationMinutes} minutos
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CONTINUAR Action Area */}
      <div className="pt-2 space-y-3">
        <button
          type="button"
          disabled={!selectedDate || !selectedTime || isLoading || Boolean(fetchError)}
          onClick={onContinue}
          className={`w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider shadow-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            !selectedDate || !selectedTime || isLoading || Boolean(fetchError)
              ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20 active:scale-[0.99]'
          }`}
        >
          <span>CONTINUAR</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>

        {!selectedTime && !isLoading && !fetchError && (
          <p className="text-center text-xs text-zinc-500">
            {selectedDate
              ? 'Selecione um horário disponível para continuar.'
              : 'Selecione a data e o horário para continuar.'}
          </p>
        )}

        {onBack && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar e escolher outro serviço</span>
            </button>
          </div>
        )}
      </div>

      {/* Calendar Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-amber-400" />
                Selecione uma data
              </h3>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Próximos dias disponíveis para agendamento:
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {days.map((day) => {
                const isSelected = selectedDate?.dateString === day.dateString;
                return (
                  <button
                    key={day.dateString}
                    disabled={!day.isAvailable}
                    onClick={() => {
                      if (day.isAvailable) {
                        onSelectDate(day);
                        setShowCalendarModal(false);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-sm font-medium transition-all ${
                      !day.isAvailable
                        ? 'bg-zinc-900/30 text-zinc-600 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200 cursor-pointer'
                    }`}
                  >
                    <span className="capitalize">{day.fullFormattedDate}</span>
                    {isSelected && <Check className="w-4 h-4 text-zinc-950 stroke-[3]" />}
                    {!day.isAvailable && <span className="text-xs text-red-400 font-bold">Fechado</span>}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowCalendarModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

interface PeriodGroupProps {
  title: string;
  icon: React.ReactNode;
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

const PeriodGroup: React.FC<PeriodGroupProps> = ({
  title,
  icon,
  slots,
  selectedTime,
  onSelectTime,
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
        {icon}
        <span>{title}</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {slots.map((slot) => {
          const isSelected = selectedTime === slot.time;
          const isAvailable = slot.available;

          return (
            <button
              key={slot.time}
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && onSelectTime(slot.time)}
              title={!isAvailable ? slot.occupiedReason || 'Horário indisponível' : undefined}
              className={`flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all duration-150 focus:outline-none ${
                !isAvailable
                  ? 'bg-zinc-950/40 text-zinc-600 border border-zinc-900 cursor-not-allowed opacity-50 line-through'
                  : isSelected
                  ? 'bg-amber-500 text-zinc-950 border-2 border-amber-400 shadow-md shadow-amber-500/20 scale-105 cursor-pointer'
                  : 'bg-zinc-950/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-amber-500/40 cursor-pointer'
              }`}
            >
              <span>{slot.time}</span>
              {!isAvailable ? (
                <span className="text-[10px] text-zinc-600 font-sans font-normal ml-0.5">✕</span>
              ) : isSelected ? (
                <Check className="w-3.5 h-3.5 stroke-[3] text-zinc-950 shrink-0" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};
