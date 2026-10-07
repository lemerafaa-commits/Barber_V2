import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Loader2, ArrowLeft, Shield, Store } from 'lucide-react';
import { signInAdmin } from '../../services/firebase/auth';
import { isAuthorizedMasterUser } from '../../services/master/masterAuthService';

interface MasterLoginProps {
  onLoginSuccess?: () => void;
  onGoToPublicPage?: () => void;
  onGoToAdminPage?: () => void;
}

export const MasterLogin: React.FC<MasterLoginProps> = ({
  onLoginSuccess,
  onGoToPublicPage,
  onGoToAdminPage,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Por favor, informe suas credenciais de superadministrador.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await signInAdmin(email, password);
      const isAuthorized = await isAuthorizedMasterUser(user);

      if (!isAuthorized) {
        setErrorMessage(
          'Acesso negado. Esta conta não possui privilégios de Superadministrador (Master) da plataforma.'
        );
        return;
      }

      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao autenticar no SaaS Master.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased selection:bg-indigo-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Branding Master */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mb-3 shadow-inner shadow-indigo-950">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <span className="inline-block text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 mb-1.5">
              Área Restrita • Master Root
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white font-['Montserrat',sans-serif]">
            Barber SaaS Master
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Acesso exclusivo para governança da plataforma e supervisão de parceiros.
          </p>
        </div>

        {/* Card Login */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          {errorMessage && (
            <div
              id="master-login-error-banner"
              className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="master-email"
                className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                E-mail do Superadministrador
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="master-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rafael.leme.macedo@hotmail.com"
                  disabled={isLoading}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="master-password"
                className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="master-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <button
              id="master-login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando Superadmin...</span>
                </>
              ) : (
                <span>Entrar no SaaS Master</span>
              )}
            </button>
          </form>

          {/* Atalhos de Navegação Alternativa */}
          <div className="mt-6 pt-5 border-t border-zinc-800/80 space-y-2 text-center text-xs">
            {onGoToAdminPage && (
              <div>
                <button
                  type="button"
                  onClick={onGoToAdminPage}
                  className="inline-flex items-center gap-1.5 font-medium text-amber-400/90 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Acessar Painel da Barbearia (/admin)</span>
                </button>
              </div>
            )}
            {onGoToPublicPage && (
              <div>
                <button
                  type="button"
                  onClick={onGoToPublicPage}
                  className="inline-flex items-center gap-1.5 font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para o agendamento público</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
