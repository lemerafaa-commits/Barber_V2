import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { signInAdmin } from '../../services/firebase/auth';

interface AdminLoginProps {
  onLoginSuccess?: () => void;
  onGoToPublicPage?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onGoToPublicPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await signInAdmin(email, password);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao autenticar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased selection:bg-amber-500 selection:text-zinc-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3 shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <span className="inline-block text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-1.5">
            Acesso Restrito
          </span>
          <h2 className="text-2xl font-black tracking-tight text-white font-['Montserrat',sans-serif]">
            Painel Administrativo
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Entre com suas credenciais para gerenciar agendamentos e serviços.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          {errorMessage && (
            <div
              id="admin-login-error-banner"
              className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@barbearia.com"
                  disabled={isLoading}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <span>Entrar no Painel</span>
              )}
            </button>
          </form>

          {onGoToPublicPage && (
            <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center">
              <button
                type="button"
                onClick={onGoToPublicPage}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para o agendamento público</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
