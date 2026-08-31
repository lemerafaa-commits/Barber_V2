import React, { useState } from 'react';
import { Calendar as CalendarIcon, Check } from 'lucide-react';
import { DayOption } from '../types/booking';

interface DateSelectorProps {
  days: DayOption[];
  selectedDate: DayOption | null;
  onSelectDate: (day: DayOption) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  days,
  selectedDate,
  onSelectDate,
}) => {
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  return (
    <section className="w-full space-y-4 pt-2">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold tracking-wider text-amber-500 uppercase">
            Etapa 2
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Montserrat',sans-serif] mt-0.5">
            Escolha o dia
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Veja os próximos horários disponíveis.
          </p>
        </div>

        {/* Calendar Picker Button */}
        <button
          type="button"
          onClick={() => setShowCalendarModal(!showCalendarModal)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-xs font-semibold text-zinc-300 hover:text-white transition-all focus:outline-none cursor-pointer"
        >
          <CalendarIcon className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Ver calendário</span>
          <span className="sm:hidden">Outro dia</span>
        </button>
      </div>

      {/* Horizontal Date Picker Scroll Container */}
      <div className="relative w-full">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 px-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {days.map((day) => {
            const isSelected = selectedDate?.dateString === day.dateString;
            const isDisabled = !day.isAvailable;

            return (
              <button
                key={day.dateString}
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && onSelectDate(day)}
                className={`relative flex flex-col items-center justify-center min-w-[72px] sm:min-w-[84px] h-[92px] sm:h-[102px] rounded-2xl p-2.5 transition-all duration-200 shrink-0 focus:outline-none ${
                  isDisabled
                    ? 'bg-zinc-900/30 border border-zinc-800/40 text-zinc-600 cursor-not-allowed opacity-50'
                    : isSelected
                    ? 'bg-amber-500 text-zinc-950 font-bold border-2 border-amber-400 shadow-xl shadow-amber-500/20 scale-105'
                    : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 cursor-pointer'
                }`}
              >
                {/* Today Badge */}
                {day.isToday && (
                  <span className={`absolute top-1.5 px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded ${
                    isSelected ? 'bg-zinc-950/20 text-zinc-950' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    Hoje
                  </span>
                )}

                {/* Day of Week */}
                <span className={`text-xs font-bold uppercase tracking-wider mt-1 ${
                  isSelected ? 'text-zinc-950' : isDisabled ? 'text-zinc-600' : 'text-zinc-400'
                }`}>
                  {day.dayOfWeek}
                </span>

                {/* Day Number */}
                <span className={`text-2xl sm:text-3xl font-black font-['Montserrat',sans-serif] my-0.5 ${
                  isSelected ? 'text-zinc-950' : isDisabled ? 'text-zinc-600' : 'text-white'
                }`}>
                  {day.dayNumber}
                </span>

                {/* Status label */}
                <span className={`text-[10px] font-semibold ${
                  isDisabled
                    ? 'text-red-500/80 font-bold'
                    : isSelected
                    ? 'text-zinc-950'
                    : 'text-zinc-500'
                }`}>
                  {isDisabled ? 'Fechado' : 'Disponível'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Summary Display */}
      {selectedDate && (
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500">Data selecionada:</p>
              <p className="text-xs sm:text-sm font-bold text-white capitalize">
                {selectedDate.fullFormattedDate}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Horários vagos
          </span>
        </div>
      )}

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
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Próximos dias para agendamento na Barbearia:
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
                        : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200'
                    }`}
                  >
                    <span>{day.fullFormattedDate}</span>
                    {isSelected && <Check className="w-4 h-4 text-zinc-950 stroke-[3]" />}
                    {!day.isAvailable && <span className="text-xs text-red-400 font-bold">Fechado</span>}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowCalendarModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
