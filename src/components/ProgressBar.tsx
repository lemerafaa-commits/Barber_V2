import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { StepNumber } from '../types/booking';

interface ProgressBarProps {
  currentStep: StepNumber;
  totalSteps?: number;
  onBack?: () => void;
  onJumpToStep?: (step: StepNumber) => void;
  canJumpToStep?: (step: StepNumber) => boolean;
}

const STEP_TITLES: Record<StepNumber, string> = {
  1: 'Serviço',
  2: 'Data e horário',
  3: 'Seus dados',
  4: 'Confirmação',
  5: 'Confirmação',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps = 3,
  onBack,
  onJumpToStep,
  canJumpToStep,
}) => {
  const progressPercentage = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));

  return (
    <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 shadow-md">
      {/* Top row: Back button & Step counter */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {currentStep > 1 && onBack ? (
            <button
              onClick={onBack}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs sm:text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
              aria-label="Voltar para a etapa anterior"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          ) : (
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
              Agendamento Rápido
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-400">
            Passo <strong className="text-amber-400 font-bold">{currentStep}</strong> de {totalSteps}
          </span>
        </div>
      </div>

      {/* Visual Bar Indicator */}
      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Step Pills for Navigation */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {([1, 2, 3] as StepNumber[]).map((step) => {
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          const isClickable = canJumpToStep ? canJumpToStep(step) : isCompleted;

          return (
            <button
              key={step}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onJumpToStep?.(step)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all ${
                isCurrent
                  ? 'bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold ring-1 ring-amber-500/30'
                  : isCompleted
                  ? 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80 cursor-pointer'
                  : 'bg-zinc-900/40 text-zinc-600 cursor-not-allowed border border-transparent'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
                ) : (
                  <span className="text-xs font-mono font-bold">
                    {step}
                  </span>
                )}
              </div>
              <span className="text-[11px] sm:text-xs truncate w-full mt-0.5 font-medium">
                {STEP_TITLES[step]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
