import React, { useState } from 'react';
import { ShieldAlert, ArrowLeft, LogOut, RefreshCw, AlertCircle, Crown } from 'lucide-react';

interface AdminAccessDeniedProps {
  userEmail?: string | null;
  isMaster?: boolean;
  onLogout: () => void;
  onGoToMasterPage?: () => void;
  onGoToPublicPage: () => void;
  onRefreshPermissions?: () => Promise<boolean | void> | void;
}

export const AdminAccessDenied: React.FC<AdminAccessDeniedProps> = ({
  userEmail,
  isMaster = false,
  onLogout,
  onGoToMasterPage,
  onGoToPublicPage,
  onRefreshPermissions,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshFeedback, setRefreshFeedback] = useState<string | null>(null);

  const handleRefresh = async () => {
    if (!onRefreshPermissions || isRefreshing) return;
    setIsRefreshing(true);
    setRefreshFeedback(null);
    try {
      const result = await onRefreshPermissions();
      if (result === false) {
        setRefreshFeedback(
          'Token atualizado com sucesso no Firebase Auth, porém o papel administrativo ("role: admin" com "businessId") ainda não foi detectado.'
        );
      }
    } catch (err: any) {
      setRefreshFeedback(err?.message || 'Falha ao sincronizar permissões com o Firebase Auth.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased selection:bg-amber-500 selection:text-zinc-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Warning Icon & Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3 shadow-inner shadow-amber-950">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <span className="inline-block text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 mb-1.5">
              403 • Acesso Restrito
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white font-['Montserrat',sans-serif]">
            Privilégios Insuficientes
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            A rota <code className="text-zinc-200">/admin</code> exige credenciais com papel administrativo{' '}
            <code className="text-amber-400 font-mono">role: "admin"</code> e identificação de empresa{' '}
            <code className="text-amber-400 font-mono">businessId</code> no Firebase Auth.
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
              Esta conta não possui a permissão de administrador local vinculada a um estabelecimento.
            </p>
          </div>

          {isMaster && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-start gap-2.5">
              <Crown className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
              <span>
                Identificamos privilégio de <strong>Superadministrador (Master)</strong> nesta conta.
                O painel <code>/admin</code> destina-se à operação local de barbearia. Acesse o painel global no <code>/master</code>.
              </span>
            </div>
          )}

          {refreshFeedback && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>{refreshFeedback}</span>
            </div>
          )}

          <div className="space-y-2.5 pt-1 text-xs">
            {/* Atualizar permissões do token */}
            {onRefreshPermissions && (
              <button
                id="admin-denied-refresh-btn"
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full py-2.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-zinc-950 font-bold flex items-center justify-between transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <span>
                  {isRefreshing ? 'Consultando Firebase Auth...' : 'Atualizar Permissões da Sessão'}
                </span>
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Se for Master, oferece atalho direto ao /master */}
            {isMaster && onGoToMasterPage && (
              <button
                id="admin-denied-go-master-btn"
                type="button"
                onClick={onGoToMasterPage}
                className="w-full py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold flex items-center justify-between transition-colors cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <span>Ir para o Painel Master (/master)</span>
                <Crown className="w-4 h-4" />
              </button>
            )}

            {/* Fazer logout para entrar com outra conta */}
            <button
              id="admin-denied-logout-btn"
              type="button"
              onClick={onLogout}
              className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium flex items-center justify-between transition-colors cursor-pointer border border-zinc-700/60"
            >
              <span>Sair desta conta (Trocar de Usuário)</span>
              <LogOut className="w-4 h-4 text-zinc-400" />
            </button>

            {/* Voltar para o agendamento público */}
            <button
              id="admin-denied-go-public-btn"
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
