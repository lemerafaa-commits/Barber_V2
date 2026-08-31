import React from 'react';
import { UserCheck, Sparkles, Check, Info } from 'lucide-react';
import { Professional } from '../types/booking';

interface ProfessionalSelectorProps {
  professionals: Professional[];
  selectedProfessional: Professional | null;
  onSelectProfessional: (professional: Professional) => void;
}

export const ProfessionalSelector: React.FC<ProfessionalSelectorProps> = ({
  professionals,
  selectedProfessional,
  onSelectProfessional,
}) => {
  return (
    <section className="w-full space-y-4">
      {/* Section Header */}
      <div>
        <span className="text-xs font-bold tracking-wider text-amber-500 uppercase">
          Passo 2
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-white font-['Montserrat',sans-serif] mt-0.5">
          Com quem você quer cortar?
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Escolha seu barbeiro de preferência ou selecione a opção mais rápida.
        </p>
      </div>

      {/* Professionals List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {professionals.map((prof) => {
          const isSelected = selectedProfessional?.id === prof.id;
          const isAny = prof.id === 'any-professional';

          return (
            <button
              key={prof.id}
              type="button"
              onClick={() => onSelectProfessional(prof)}
              className={`relative flex items-center gap-3.5 p-4 rounded-2xl text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer ${
                isSelected
                  ? 'bg-zinc-900 border-2 border-amber-500 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/20'
                  : 'bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Avatar / Icon */}
              <div className="relative shrink-0">
                {isAny ? (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-zinc-950 font-bold shadow-md">
                    <UserCheck className="w-7 h-7 stroke-[2.5]" />
                  </div>
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-zinc-700/80 bg-zinc-800 shadow-md">
                    <img
                      src={prof.avatarUrl}
                      alt={prof.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Selected badge overlay */}
                {isSelected && (
                  <div className="absolute -bottom-1 -right-1 p-1 bg-amber-500 text-zinc-950 rounded-full shadow-md">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-base sm:text-lg text-white truncate">
                    {prof.name}
                  </h3>
                  {isAny && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wide border border-amber-500/30 shrink-0">
                      Rápido
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-amber-400/90 mt-0.5">
                  {prof.role}
                </p>

                {prof.specialty && (
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                    {prof.specialty}
                  </p>
                )}
              </div>

              {/* Checkmark box */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                isSelected
                  ? 'bg-amber-500 border-amber-500 text-zinc-950'
                  : 'border-zinc-700 bg-zinc-800/50 text-transparent'
              }`}>
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Info note */}
      <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-2.5 text-xs text-zinc-400">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <span>
          A opção <strong className="text-zinc-200">"Qualquer profissional"</strong> busca automaticamente o primeiro horário vago com qualquer um de nossos barbeiros qualificados.
        </span>
      </div>
    </section>
  );
};
