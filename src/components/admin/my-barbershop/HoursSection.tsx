import React, { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Save,
  Check,
  X,
} from 'lucide-react';
import { BusinessProfile, WeeklySchedule, DaySchedule } from '../../../types/businessProfile';

interface HoursSectionProps {
  profile: BusinessProfile;
  onSave: (updates: Partial<BusinessProfile>) => Promise<void>;
  onBack: () => void;
  isSaving?: boolean;
}

const DAYS_CONFIG: Array<{ key: keyof WeeklySchedule; label: string }> = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

export const HoursSection: React.FC<HoursSectionProps> = ({
  profile,
  onSave,
  onBack,
  isSaving = false,
}) => {
  const [openingHours, setOpeningHours] = useState<WeeklySchedule>({ ...profile.openingHours });
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const handleToggleDay = (dayKey: keyof WeeklySchedule) => {
    setOpeningHours((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        isOpen: !prev[dayKey].isOpen,
      },
    }));
  };

  const handleChangeTime = (
    dayKey: keyof WeeklySchedule,
    field: 'openTime' | 'closeTime',
    value: string
  ) => {
    setOpeningHours((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setSaveErrorMessage(null);
    try {
      await onSave({
        openingHours,
      });
      setSaveSuccessMessage('Alterações salvas com sucesso!');
      setTimeout(() => {
        setSaveSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      setSaveErrorMessage('Erro ao salvar alterações. Tente novamente.');
      setTimeout(() => {
        setSaveErrorMessage(null);
      }, 5000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer py-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Minha Barbearia</span>
      </button>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-purple-500 font-black tracking-wider text-xs uppercase px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
            HORÁRIOS
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-['Montserrat',sans-serif]">
          Funcionamento Semanal
        </h2>
        <p className="text-sm text-zinc-400">
          Configure os dias e faixas de horários de funcionamento da sua barbearia.
        </p>
      </div>

      {/* Success Notification */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {saveErrorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <span>{saveErrorMessage}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-7 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-5">
        <div className="space-y-3 divide-y divide-zinc-800/60">
          {DAYS_CONFIG.map(({ key, label }) => {
            const day = openingHours[key];

            return (
              <div
                key={key}
                className={`pt-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  !day.isOpen ? 'opacity-60' : ''
                }`}
              >
                {/* Day Name & Toggle */}
                <div className="flex items-center gap-3 min-w-[170px]">
                  <button
                    type="button"
                    onClick={() => handleToggleDay(key)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      day.isOpen
                        ? 'bg-purple-500 text-zinc-950 font-bold shadow-sm shadow-purple-500/30'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-500'
                    }`}
                  >
                    {day.isOpen ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                  </button>

                  <div>
                    <span className="text-sm font-bold text-white block">
                      {label}
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-400">
                      {day.isOpen ? (
                        <span className="text-emerald-400">Aberto</span>
                      ) : (
                        <span className="text-zinc-500">Fechado</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Time pickers when open */}
                {day.isOpen ? (
                  <div className="flex items-center gap-2 sm:self-center">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <input
                        type="time"
                        value={day.openTime}
                        onChange={(e) => handleChangeTime(key, 'openTime', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-purple-500 text-xs font-mono text-white outline-none"
                      />
                    </div>

                    <span className="text-xs text-zinc-500 font-medium">até</span>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => handleChangeTime(key, 'closeTime', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-purple-500 text-xs font-mono text-white outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-600 font-mono py-1.5">
                    Sem atendimento
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex justify-end border-t border-zinc-800/80">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-zinc-950 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md shadow-purple-500/20 active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'SALVAR ALTERAÇÕES'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
