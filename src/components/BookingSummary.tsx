import React from 'react';
import {
  Scissors,
  Calendar,
  Clock,
  Edit2,
  Lock,
  Loader2,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { BookingState, StepNumber } from '../types/booking';
import { isValidBrazilianPhone } from '../utils/phoneMask';

interface BookingSummaryProps {
  bookingState: BookingState;
  currentStep?: StepNumber;
  onEditStep: (step: StepNumber) => void;
  onNextStep?: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  bookingState,
  currentStep = 3,
  onEditStep,
  onNextStep,
  onConfirm,
  isSubmitting = false,
}) => {
  const { service, selectedDate, selectedTime, clientInfo } = bookingState;

  const isNameValid = clientInfo.name.trim().length >= 3;
  const isPhoneValid = isValidBrazilianPhone(clientInfo.phone);

  const canAdvanceStep1 = Boolean(service);
  const canAdvanceStep2 = Boolean(service) && Boolean(selectedDate) && Boolean(selectedTime);
  const canConfirm =
    canAdvanceStep2 &&
    isNameValid &&
    isPhoneValid;

  const handleAction = () => {
    if (currentStep === 1) {
      if (canAdvanceStep1 && onNextStep) onNextStep();
    } else if (currentStep === 2) {
      if (canAdvanceStep2 && onNextStep) onNextStep();
    } else {
      if (canConfirm) onConfirm();
    }
  };

  const isActionButtonDisabled =
    currentStep === 1
      ? !canAdvanceStep1
      : currentStep === 2
      ? !canAdvanceStep2
      : !canConfirm || isSubmitting;

  return (
    <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <h3 className="font-bold text-base text-white font-['Montserrat',sans-serif] flex items-center gap-2 uppercase tracking-wide">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Seu agendamento
        </h3>
        <span className="text-xs text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
          Resumo
        </span>
      </div>

      {/* Summary Rows */}
      <div className="space-y-2.5 text-xs sm:text-sm">
        {/* Service Row */}
        <div className="flex items-start justify-between p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
          <div className="flex items-start gap-2.5">
            <span className="text-base leading-none select-none mt-0.5">✂️</span>
            <div>
              <p className="font-bold text-white leading-tight">
                {service ? service.name : <span className="text-zinc-600 font-normal">A selecionar</span>}
              </p>
              {service?.selectedOption && (
                <p className="text-xs text-amber-400 font-semibold mt-0.5">
                  Estilo: {service.selectedOption}
                </p>
              )}
            </div>
          </div>
          {service && (
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Alterar</span>
            </button>
          )}
        </div>

        {/* Date Row */}
        <div className="flex items-start justify-between p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
          <div className="flex items-start gap-2.5">
            <span className="text-base leading-none select-none mt-0.5">📅</span>
            <div>
              <p className="font-bold text-white capitalize leading-tight">
                {selectedDate ? (
                  selectedDate.fullFormattedDate
                ) : (
                  <span className="text-zinc-600 font-normal">A selecionar</span>
                )}
              </p>
            </div>
          </div>
          {selectedDate && (
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Alterar</span>
            </button>
          )}
        </div>

        {/* Time Row */}
        <div className="flex items-start justify-between p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
          <div className="flex items-start gap-2.5">
            <span className="text-base leading-none select-none mt-0.5">🕐</span>
            <div>
              <p className="font-bold text-white font-mono leading-tight">
                {selectedTime ? (
                  `${selectedTime}${service?.durationMinutes ? ` · ${service.durationMinutes} min` : ''}`
                ) : (
                  <span className="text-zinc-600 font-normal font-sans">A selecionar</span>
                )}
              </p>
            </div>
          </div>
          {selectedTime && (
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Alterar</span>
            </button>
          )}
        </div>
      </div>

      {/* Total Price Box */}
      {service && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-200">Total a pagar no local</span>
          <span className="text-2xl font-black text-amber-400 font-['Montserrat',sans-serif]">
            R$ {service.price.toFixed(2).replace('.', ',')}
          </span>
        </div>
      )}

      {/* Main Action Button */}
      <button
        type="button"
        disabled={isActionButtonDisabled}
        onClick={handleAction}
        className={`w-full py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider shadow-xl transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer ${
          isActionButtonDisabled
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
            : isSubmitting
            ? 'bg-amber-500/80 text-zinc-950 cursor-wait'
            : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 hover:shadow-amber-500/25 active:scale-[0.99]'
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-zinc-950" />
            <span>CONFIRMANDO SEU HORÁRIO...</span>
          </>
        ) : currentStep < 3 ? (
          <>
            <span>CONTINUAR</span>
            <ArrowRight className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
            <span>CONFIRMAR AGENDAMENTO</span>
          </>
        )}
      </button>

      {/* Validation hints */}
      {currentStep === 1 && !canAdvanceStep1 && (
        <p className="text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3 text-zinc-600" />
          Selecione um serviço para continuar.
        </p>
      )}

      {currentStep === 2 && !canAdvanceStep2 && (
        <p className="text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3 text-zinc-600" />
          Selecione a data e o horário para continuar.
        </p>
      )}

      {currentStep === 3 && !canConfirm && (
        <p className="text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3 text-zinc-600" />
          Informe seu nome e celular para confirmar.
        </p>
      )}
    </div>
  );
};
