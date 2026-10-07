import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut, Store } from 'lucide-react';

interface MasterAccessDeniedProps {
  userEmail?: string | null;
  onLogout: () => void;
  onGoToAdminPage: () => void;
  onGoToPublicPage: () => void;
}

export const MasterAccessDenied: React.FC<MasterAccessDeniedProps> = ({
  userEmail,
  onLogout,
  onGoToAdminPage,
  onGoToPublicPage,
}) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased selection:bg-rose-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Warning Icon & Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-3 shadow-inner shadow-rose-950">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <span className="inline-block text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 mb-1.5">
              403 • Acesso Não Autorizado
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white font-['Montserrat',sans-serif]">
            Privilégios Insuficientes
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            A área <code className="text-zinc-200">/master</code> é estritamente restrita a
            Superadministradores da plataforma Barber SaaS.
          </p>
        </div>

        {/* Card Content */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-5">
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-300 space-y-1">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold block">
              Conta Atualmente Autenticada:
            </span>
            <span className="font-mono text-zinc-200 block truncate">
              {userEmail || 'Usuário autenticado sem e-mail'}
            </span>
            <p className="text-[11px] text-zinc-400 pt-1">
              Seu perfil possui permissões operacionais de barbearia, mas não está cadastrado como
              Master Root Administrator.
            </p>
          </div>

          <div className="space-y-2.5 pt-1 text-xs">
            {/* Ir para o painel da barbearia */}
            <button
              id="master-denied-go-admin-btn"
              type="button"
              onClick={onGoToAdminPage}
              className="w-full py-2.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold flex items-center justify-between transition-colors cursor-pointer shadow-lg shadow-amber-500/15"
            >
              <span>Ir para o Painel da Barbearia (/admin)</span>
              <Store className="w-4 h-4" />
            </button>

            {/* Fazer logout para entrar com outra conta */}
            <button
              id="master-denied-logout-btn"
              type="button"
              onClick={onLogout}
              className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium flex items-center justify-between transition-colors cursor-pointer border border-zinc-700/60"
            >
              <span>Sair desta conta (Entrar como Superadmin)</span>
              <LogOut className="w-4 h-4 text-zinc-400" />
            </button>

            {/* Voltar para o agendamento público */}
            <button
              id="master-denied-go-public-btn"
              type="button"
              onClick={onGoToPublicPage}
              className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 font-medium flex items-center justify-between transition-colors cursor-pointer border border-zinc-800"
            >
              <span>Voltar ao Agendamento Público (/)</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
