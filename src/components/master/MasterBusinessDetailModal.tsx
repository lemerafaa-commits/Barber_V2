import React, { useState } from 'react';
import {
  X,
  Store,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MapPin,
  TrendingUp,
  MessageSquare,
  Users,
  Activity,
  CalendarDays,
  FileText,
  Building,
} from 'lucide-react';
import { MasterBusiness, MasterUser } from '../../types/master';

interface MasterBusinessDetailModalProps {
  business: MasterBusiness | null;
  users?: MasterUser[];
  onClose: () => void;
}

export const MasterBusinessDetailModal: React.FC<MasterBusinessDetailModalProps> = ({
  business,
  users = [],
  onClose,
}) => {
  const [activeSection, setActiveSection] = useState<'all' | 'company' | 'owner' | 'subscription' | 'operations' | 'users'>('all');

  if (!business) return null;

  // Filter linked users for this specific business
  const businessUsers = users.filter((u) => u.businessId === business.id);

  const cleanPhoneForWa = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  };

  const statusBadge =
    business.status === 'active' ? (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Ativa
      </span>
    ) : business.status === 'trial' ? (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        Período de Teste (Trial)
      </span>
    ) : business.status === 'cancelled' ? (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        Cancelada (Churn)
      </span>
    ) : (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Suspensa
      </span>
    );

  const planBadge =
    business.plan === 'enterprise' ? (
      <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase">
        Enterprise
      </span>
    ) : business.plan === 'pro' ? (
      <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 uppercase">
        Plano Pro
      </span>
    ) : (
      <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase">
        Plano Starter
      </span>
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        id="master-business-modal-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div
        id="master-business-modal-content"
        className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-start justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {business.name}
                </h3>
                {planBadge}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 flex-wrap">
                <span className="font-mono text-zinc-300">/{business.slug}</span>
                <span>•</span>
                <span>{business.city}, {business.state}</span>
                <span>•</span>
                <span className="text-zinc-500 font-mono text-[11px]">ID: {business.id}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {statusBadge}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 360° Concept Navigator / Filter Pills */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-zinc-800/80 bg-zinc-950/30 overflow-x-auto text-xs">
          <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mr-1 shrink-0">
            Visão 360°:
          </span>
          {[
            { id: 'all', label: 'Todos os Blocos' },
            { id: 'company', label: '1. Empresa' },
            { id: 'owner', label: '2. Proprietário' },
            { id: 'subscription', label: '3. Assinatura' },
            { id: 'operations', label: '4. Operação' },
            { id: 'users', label: `5. Usuários (${businessUsers.length})` },
          ].map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id as any)}
              className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap font-medium ${
                activeSection === sec.id
                  ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-zinc-300 text-xs">
          {/* BLOCO 1: INFORMAÇÕES DA EMPRESA */}
          {(activeSection === 'all' || activeSection === 'company') && (
            <section className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-400" />
                  Informações da Empresa
                </h4>
                <span className="text-[11px] text-zinc-300 font-medium">Entidade Principal</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-zinc-300 block text-[11px]">Nome da Barbearia:</span>
                  <span className="font-semibold text-white text-sm mt-0.5 block">{business.name}</span>
                </div>
                <div>
                  <span className="text-zinc-300 block text-[11px]">Slug / Link Público:</span>
                  <a
                    href={`#/${business.slug}`}
                    className="text-indigo-400 hover:text-indigo-300 font-mono text-xs flex items-center gap-1 mt-0.5"
                    title="Acessar página de agendamento do cliente"
                  >
                    <span>/{business.slug}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  <span className="text-zinc-300 block text-[11px]">Cidade / Localização:</span>
                  <span className="text-zinc-200 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-300" />
                    {business.city} - {business.state}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-300 block text-[11px]">WhatsApp da Empresa:</span>
                  <a
                    href={`https://wa.me/${cleanPhoneForWa(business.ownerPhone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 font-medium transition-colors mt-0.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{business.ownerPhone}</span>
                  </a>
                </div>
                <div>
                  <span className="text-zinc-300 block text-[11px]">E-mail de Contato:</span>
                  <span className="text-zinc-200 font-mono mt-0.5 block">{business.ownerEmail}</span>
                </div>
                <div>
                  <span className="text-zinc-300 block text-[11px]">Data de Cadastro:</span>
                  <span className="text-zinc-200 mt-0.5 block">{business.createdAt}</span>
                </div>
              </div>
            </section>
          )}

          {/* BLOCO 2: PROPRIETÁRIO */}
          {(activeSection === 'all' || activeSection === 'owner') && (
            <section className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  Proprietário Responsável
                </h4>
                <span className="text-[11px] text-zinc-300 font-medium">Conta Master da Barbearia</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-zinc-300 block text-[11px]">Nome do Proprietário:</span>
                  <span className="font-semibold text-white mt-0.5 block">{business.ownerName}</span>
                </div>
                <div>
                  <span className="text-zinc-300 block text-[11px]">WhatsApp Pessoal / Direto:</span>
                  <a
                    href={`https://wa.me/${cleanPhoneForWa(business.ownerPhone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 font-medium transition-colors mt-0.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{business.ownerPhone}</span>
                  </a>
                </div>
                <div>
                  <span className="text-zinc-300 block text-[11px]">E-mail de Acesso:</span>
                  <span className="text-zinc-200 font-mono mt-0.5 block">{business.ownerEmail}</span>
                </div>
                <div>
                  <span className="text-zinc-300 block text-[11px]">Função no Estabelecimento:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 mt-0.5">
                    Proprietário / Business Admin
                  </span>
                </div>
                <div>
                  <span className="text-zinc-300 block text-[11px]">Último Acesso ao Painel:</span>
                  <span className="text-zinc-200 font-medium mt-0.5 block">{business.lastActiveAt}</span>
                </div>
                <div>
                  <span className="text-zinc-300 block text-[11px]">User ID (Identificador Único):</span>
                  <span className="font-mono text-zinc-400 text-[11px] mt-0.5 block">{business.ownerUserId}</span>
                </div>
              </div>
            </section>
          )}

          {/* BLOCO 3: ASSINATURA */}
          {(activeSection === 'all' || activeSection === 'subscription') && (
            <section className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Assinatura e Faturamento SaaS
                </h4>
                <span className="text-[11px] text-zinc-300 font-medium">Contrato da Plataforma</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-300 block text-[11px]">Plano Contratado</span>
                  <span className="text-sm font-bold text-white uppercase mt-1 block">
                    {business.plan}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-300 block text-[11px]">Status da Assinatura</span>
                  <span className="text-sm font-semibold text-emerald-400 mt-1 block">
                    {business.status === 'active'
                      ? 'Adimplente / Ativa'
                      : business.status === 'trial'
                      ? 'Período Gratuito'
                      : business.status === 'cancelled'
                      ? 'Encerrada'
                      : 'Suspensa'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-300 block text-[11px]">Valor da Mensalidade</span>
                  <span className="text-sm font-extrabold text-white mt-1 block">
                    {business.monthlyRevenue > 0
                      ? `R$ ${business.monthlyRevenue.toFixed(2)}`
                      : 'R$ 0,00'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-300 block text-[11px]">Próxima Cobrança / Renovação</span>
                  <span className="text-xs font-medium text-zinc-200 mt-1 block">
                    {business.status === 'trial'
                      ? '15 dias após adesão'
                      : business.status === 'cancelled'
                      ? 'Sem cobrança futura'
                      : 'Dia 10 do próximo mês'}
                  </span>
                </div>
              </div>

              {/* Informações detalhadas de Churn se cancelada */}
              {business.status === 'cancelled' && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-xs">
                  <div className="font-bold text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Detalhes de Cancelamento (Saída da Base)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-300">
                    <div>
                      <span className="text-zinc-300 text-[11px] block">Data de Cancelamento:</span>
                      <strong className="text-white">{business.cancelledAt || '28/08/2026'}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-300 text-[11px] block">Plano Anterior:</span>
                      <strong className="text-white uppercase">{business.previousPlan || business.plan}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-zinc-300 text-[11px] block">Motivo Informado:</span>
                      <p className="text-zinc-200 mt-0.5">{business.cancelReason || 'Encerramento de ponto comercial'}</p>
                    </div>
                    {business.cancelFeedback && (
                      <div className="sm:col-span-2">
                        <span className="text-zinc-300 text-[11px] block">Feedback do Cliente:</span>
                        <p className="text-zinc-300 italic mt-0.5">"{business.cancelFeedback}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* BLOCO 4: OPERAÇÃO */}
          {(activeSection === 'all' || activeSection === 'operations') && (
            <section className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  Operação da Barbearia
                </h4>
                <span className="text-[11px] text-zinc-300 font-medium">Métricas de Atendimento</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-300 block text-[11px]">Total de Agendamentos Criados</span>
                  <div className="text-2xl font-black text-white mt-1">
                    {business.appointmentCount}
                  </div>
                  <span className="text-[10px] text-zinc-300">Histórico acumulado</span>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-300 block text-[11px]">Agendamentos Cancelados</span>
                  <div className="text-2xl font-black text-rose-400 mt-1">
                    {business.cancellationsCount ?? Math.floor(business.appointmentCount * 0.05)}
                  </div>
                  <span className="text-[10px] text-zinc-300">
                    Taxa média:{' '}
                    {(
                      ((business.cancellationsCount ?? Math.floor(business.appointmentCount * 0.05)) /
                        Math.max(1, business.appointmentCount)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-300 block text-[11px]">Última Atividade Registrada</span>
                  <div className="text-sm font-bold text-zinc-100 mt-2">
                    {business.lastActiveAt}
                  </div>
                  <span className="text-[10px] text-emerald-400">Atividade regular na rede</span>
                </div>
              </div>
            </section>
          )}

          {/* BLOCO 5: USUÁRIOS DA BARBEARIA */}
          {(activeSection === 'all' || activeSection === 'users') && (
            <section className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Usuários da Barbearia
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {businessUsers.length} vinculados
                  </span>
                </div>
                <span className="text-[11px] text-zinc-300">Equipe & Operadores</span>
              </div>

              {businessUsers.length === 0 ? (
                <div className="py-6 text-center text-zinc-300 text-xs">
                  Apenas o proprietário ({business.ownerName}) está registrado até o momento.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-300 uppercase text-[10px] font-semibold">
                        <th className="py-2.5 px-3.5">Nome</th>
                        <th className="py-2.5 px-3">WhatsApp</th>
                        <th className="py-2.5 px-3">E-mail</th>
                        <th className="py-2.5 px-3">Função</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Último Acesso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70">
                      {businessUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-zinc-900/50">
                          <td className="py-2.5 px-3.5 font-semibold text-white">
                            {u.name}
                          </td>
                          <td className="py-2.5 px-3">
                            {u.phone ? (
                              <a
                                href={`https://wa.me/${cleanPhoneForWa(u.phone)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>{u.phone}</span>
                              </a>
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-zinc-400">
                            {u.email}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {u.role === 'business_admin' ? 'Business Admin' : 'Operador'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Ativo
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-zinc-300 text-[11px]">
                            {u.lastLoginAt}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="text-[11px] text-zinc-300">
            Relação: <strong className="text-zinc-200">Barbearia</strong> →{' '}
            <strong className="text-zinc-200">Proprietário</strong> →{' '}
            <strong className="text-zinc-200">Usuários</strong> →{' '}
            <strong className="text-zinc-200">Assinatura</strong> →{' '}
            <strong className="text-zinc-200">Operação</strong>
          </div>

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
