import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RotateCcw,
} from 'lucide-react';

interface AppointmentCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateIso: string) => void;
  datesWithAppointments: Map<string, { total: number; active: number }>;
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  selectedDate,
  onSelectDate,
  datesWithAppointments,
}) => {
  // Parse currently selected date for initial view
  const [selectedYear, selectedMonth, selectedDay] = selectedDate
    .split('-')
    .map((num) => parseInt(num, 10));

  const [currentViewDate, setCurrentViewDate] = useState(
    new Date(selectedYear, selectedMonth - 1, 1)
  );

  const viewYear = currentViewDate.getFullYear();
  const viewMonth = currentViewDate.getMonth();

  const monthName = currentViewDate.toLocaleDateString('pt-BR', {
    month: 'long',
  });
  const capitalizedMonth =
    monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Today reference
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(now.getDate()).padStart(2, '0')}`;

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleJumpToToday = () => {
    setCurrentViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    onSelectDate(todayIso);
  };

  // Calendar grid calculations
  // Sunday = 0, Monday = 1 ... Saturday = 6
  // We want Monday (1) as the first day of the week: (day + 6) % 7
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const startingDayIndex = (firstDayOfMonth + 6) % 7; // 0 for Seg, 6 for Dom
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Days in previous month for padding
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Weekday abbreviations in PT-BR
  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  // Days array to render
  const calendarCells = [];

  // Previous month trailing days
  for (let i = startingDayIndex - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonthDate = new Date(viewYear, viewMonth - 1, dayNum);
    const dateIso = `${prevMonthDate.getFullYear()}-${String(
      prevMonthDate.getMonth() + 1
    ).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

    calendarCells.push({
      dayNum,
      dateIso,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateIso = `${viewYear}-${String(viewMonth + 1).padStart(
      2,
      '0'
    )}-${String(d).padStart(2, '0')}`;

    calendarCells.push({
      dayNum: d,
      dateIso,
      isCurrentMonth: true,
    });
  }

  // Next month leading days to complete grid rows
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let n = 1; n <= remainingCells; n++) {
    const nextMonthDate = new Date(viewYear, viewMonth + 1, n);
    const dateIso = `${nextMonthDate.getFullYear()}-${String(
      nextMonthDate.getMonth() + 1
    ).padStart(2, '0')}-${String(n).padStart(2, '0')}`;

    calendarCells.push({
      dayNum: n,
      dateIso,
      isCurrentMonth: false,
    });
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 shadow-lg space-y-4">
      {/* Calendar Header: Month Navigator & Quick Jump */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white font-['Montserrat',sans-serif]">
              {capitalizedMonth} {viewYear}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Jump to today button */}
          {selectedDate !== todayIso && (
            <button
              type="button"
              onClick={handleJumpToToday}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              title="Voltar para hoje"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Hoje</span>
            </button>
          )}

          {/* Month Steppers */}
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors cursor-pointer"
            title="Mês anterior"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors cursor-pointer"
            title="Próximo mês"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((day, idx) => (
          <div
            key={idx}
            className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {calendarCells.map((cell, index) => {
          const isSelected = cell.dateIso === selectedDate;
          const isToday = cell.dateIso === todayIso;
          const appointmentInfo = datesWithAppointments.get(cell.dateIso);
          const hasAppointments = !!appointmentInfo && appointmentInfo.total > 0;
          const hasActiveAppointments =
            !!appointmentInfo && appointmentInfo.active > 0;

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectDate(cell.dateIso)}
              className={`relative flex flex-col items-center justify-center h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none active:scale-95 ${
                isSelected
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30 font-black z-10'
                  : isToday
                  ? 'bg-zinc-800/90 text-amber-400 border border-amber-500/50'
                  : cell.isCurrentMonth
                  ? 'bg-zinc-950/60 hover:bg-zinc-800 text-zinc-200 border border-zinc-800/50'
                  : 'bg-zinc-950/20 text-zinc-600 hover:bg-zinc-900/40 border border-transparent'
              }`}
            >
              {/* Day Number */}
              <span>{cell.dayNum}</span>

              {/* Indicator for Appointments */}
              {hasAppointments && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected
                        ? 'bg-zinc-950'
                        : hasActiveAppointments
                        ? 'bg-amber-400'
                        : 'bg-zinc-400'
                    }`}
                  />
                  {appointmentInfo.total > 1 && (
                    <span
                      className={`text-[9px] leading-none font-bold ${
                        isSelected ? 'text-zinc-950' : 'text-zinc-400'
                      }`}
                    >
                      {appointmentInfo.total}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Calendar Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/60 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            <span>Com agendamentos</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full border border-amber-500/50 inline-block" />
            <span>Hoje</span>
          </span>
        </div>

        <span className="text-zinc-400">
          Toque em uma data para ver os horários
        </span>
      </div>
    </div>
  );
};
