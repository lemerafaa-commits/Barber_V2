import React, { useState } from 'react';
import { Settings, Sliders, AlertTriangle, User, Clock, RefreshCw } from 'lucide-react';

interface DevEdgeCasesModalProps {
  simulateConflict: boolean;
  onToggleSimulateConflict: (val: boolean) => void;
  singleBarberMode: boolean;
  onToggleSingleBarberMode: (val: boolean) => void;
  fullyBookedMode: boolean;
  onToggleFullyBookedMode: (val: boolean) => void;
  onResetState: () => void;
}

export const DevEdgeCasesModal: React.FC<DevEdgeCasesModalProps> = ({
  simulateConflict,
  onToggleSimulateConflict,
  singleBarberMode,
  onToggleSingleBarberMode,
  fullyBookedMode,
  onToggleFullyBookedMode,
  onResetState,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-amber-400 shadow-2xl backdrop-blur-md hover:border-amber-500/50 transition-all cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Testar Estados</span>
        </button>
      </div>

      {/* Modal Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                Painel de Testes de Estados (SaaS MVP)
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Alterne estas opções para testar visualmente todas as situações e regras de negócio exigidas no prompt:
            </p>

            <div className="space-y-3">
              {/* Option 1: Slot conflict */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Simular conflito de horário
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    Dispara o aviso "Esse horário acabou de ser reservado"
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={simulateConflict}
                  onChange={(e) => onToggleSimulateConflict(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
              </label>

              {/* Option 2: Single barber mode */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    Barbearia com 1 único barbeiro
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    Auto-seleciona e simplifica a etapa 2 de profissionais
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={singleBarberMode}
                  onChange={(e) => onToggleSingleBarberMode(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
              </label>

              {/* Option 3: Fully booked day */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Dia sem horários disponíveis
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    Simula dia totalmente lotado/indisponível
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={fullyBookedMode}
                  onChange={(e) => onToggleFullyBookedMode(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
              </label>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetState();
                  setIsOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reiniciar fluxo
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
