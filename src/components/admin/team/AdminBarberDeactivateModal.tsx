import React from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Barber } from '../../../types/admin';

interface AdminBarberDeactivateModalProps {
  barber: Barber;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isProcessing?: boolean;
}

export const AdminBarberDeactivateModal: React.FC<AdminBarberDeactivateModalProps> = ({
  barber,
  isOpen,
  onClose,
  onConfirm,
  isProcessing = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">Desativar barbeiro?</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Você está prestes a desativar <strong className="text-zinc-200">{barber.name}</strong>.
          </p>
          <div className="mt-3 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed">
            O profissional deixará de aparecer como disponível para novos agendamentos. O histórico de agendamentos existentes será preservado.
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={async () => {
              await onConfirm();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-sm shadow-rose-500/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isProcessing ? 'Desativando...' : 'Desativar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
