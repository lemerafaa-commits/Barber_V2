import React from 'react';
import {
  ShieldCheck,
  Mail,
  User,
  Key,
  Calendar,
  Lock,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { auth } from '../../services/firebase/config';

interface MasterProfileProps {
  onLogoutClick: () => void;
  onNavigateAdmin: () => void;
}

export const MasterProfile: React.FC<MasterProfileProps> = ({
  onLogoutClick,
}) => {
  const currentAuthUser = auth?.currentUser;
  const displayName =
    currentAuthUser?.displayName ||
    (currentAuthUser?.email ? currentAuthUser.email.split('@')[0] : 'Administrador Master');
  const email = currentAuthUser?.email || 'Sessão Autenticada';
  const uid = currentAuthUser?.uid || '—';
  const creationDate = currentAuthUser?.metadata?.creationTime
    ? new Date(currentAuthUser.metadata.creationTime).toLocaleDateString('pt-BR')
    : 'Registro na Plataforma';

  const initials = (displayName || 'M')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          Meu Perfil Master
        </h2>
        <p className="text-xs text-zinc-400">
          Credenciais e privilégios de superadministrador da plataforma SaaS
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900 border border-zinc-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-950/50">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{displayName}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Superadmin
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">{email}</p>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sessão Ativa (Claim Master Validada)
              </p>
            </div>
          </div>

          <button
            id="master-profile-logout-btn"
            type="button"
            onClick={onLogoutClick}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão Master</span>
          </button>
        </div>

        {/* Identity & Scope Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
            <span className="text-zinc-500 block text-[11px]">Nível de Privilégio:</span>
            <span className="font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Master Administrator (Plataforma Global)
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
            <span className="text-zinc-500 block text-[11px]">Escopo de Acesso:</span>
            <span className="font-semibold text-white">
              Acesso irrestrito a todos os tenants (businessId)
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
            <span className="text-zinc-500 block text-[11px]">Identificador Único (UID):</span>
            <span className="font-mono text-zinc-300 text-[11px]">{uid}</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
            <span className="text-zinc-500 block text-[11px]">Data de Registro da Conta:</span>
            <span className="font-semibold text-zinc-300">{creationDate}</span>
          </div>
        </div>

        {/* Security & Multi-tenant Notice */}
        <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-800/40 text-xs text-indigo-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-white">
            <Lock className="w-4 h-4 text-indigo-400" />
            Segurança &amp; Autenticação Firebase
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            O acesso a este painel é protegido por token criptográfico JWT e verificação rigorosa de custom claim <code className="text-indigo-300">master === true</code> via Firebase Auth. Tentativas de acesso por usuários não autorizados são bloqueadas imediatamente pela API server-side.
          </p>
        </div>
      </div>
    </div>
  );
};
