import React from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Store,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { MasterUser, MasterBusiness } from '../../types/master';

interface MasterUserDetailModalProps {
  user: MasterUser | null;
  business?: MasterBusiness | null;
  onClose: () => void;
  onViewBusiness?: (businessId: string) => void;
}

export const MasterUserDetailModal: React.FC<MasterUserDetailModalProps> = ({
  user,
  business,
  onClose,
  onViewBusiness,
}) => {
  if (!user) return null;

  const cleanPhoneForWa = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        id="master-user-modal-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div
        id="master-user-modal-content"
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{user.name}</h3>
              <p className="text-xs text-zinc-400 font-mono">ID: {user.id}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-zinc-300">
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 text-[11px]">Função no Sistema:</span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {user.role === 'master' ? 'Master Superadmin' : 'Business Admin (Proprietário)'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-300 text-[11px]">Status da Conta:</span>
              <span
                className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                  user.status === 'active'
                    ? 'text-emerald-400'
                    : user.status === 'suspended'
                    ? 'text-amber-400'
                    : 'text-zinc-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {user.status === 'active' ? 'Ativo' : user.status === 'suspended' ? 'Suspenso' : 'Inativo'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-300 text-[11px]">E-mail de Login:</span>
              <span className="font-mono text-zinc-200">{user.email}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-300 text-[11px]">WhatsApp:</span>
              {user.phone ? (
                <a
                  href={`https://wa.me/${cleanPhoneForWa(user.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{user.phone}</span>
                </a>
              ) : (
                <span className="text-zinc-300">Não informado</span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-300 text-[11px]">Data de Criação:</span>
              <span className="text-zinc-300">{user.createdAt}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-300 text-[11px]">Último Acesso:</span>
              <span className="text-zinc-300">{user.lastLoginAt}</span>
            </div>
          </div>

          {/* Barbearia vinculada */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
            <span className="text-zinc-300 text-[11px] uppercase font-bold tracking-wider block">
              Vínculo Organizacional
            </span>

            {user.businessId ? (
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-indigo-400" />
                    {user.businessName || 'Barbearia'}
                  </div>
                  <span className="text-[11px] text-zinc-300 font-mono">ID: {user.businessId}</span>
                </div>

                {onViewBusiness && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewBusiness(user.businessId!);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition-colors"
                  >
                    Ver Barbearia
                  </button>
                )}
              </div>
            ) : (
              <p className="text-zinc-300 italic pt-1">
                Usuário com acesso global na plataforma Master (sem barbearia individual vinculada).
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
