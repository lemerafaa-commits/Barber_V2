import React, { useState } from 'react';
import {
  Settings,
  Globe,
  CreditCard,
  Bell,
  Plug,
  Shield,
  Save,
  CheckCircle2,
  Lock,
  MessageSquare,
  Server,
  Key,
} from 'lucide-react';

export const MasterSettings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    'platform' | 'plans' | 'notifications' | 'integrations' | 'security'
  >('platform');

  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSaveDemo = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            Configurações da Plataforma
          </h2>
          <p className="text-xs text-zinc-400">
            Parâmetros globais do ecossistema SaaS, precificação e regras de negócio
          </p>
        </div>

        {/* Save button (demo) */}
        <button
          type="button"
          onClick={handleSaveDemo}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all self-start sm:self-auto"
        >
          {savedFeedback ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Configurações Salvas (Mock)!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </>
          )}
        </button>
      </div>

      {/* Main Settings Card with Sidebar Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation tabs */}
        <div className="space-y-1 md:col-span-1">
          {[
            { id: 'platform', label: 'Informações da Plataforma', icon: Globe },
            { id: 'plans', label: 'Planos e Preços', icon: CreditCard },
            { id: 'notifications', label: 'Notificações Globais', icon: Bell },
            { id: 'integrations', label: 'Integrações (Stripe, Twilio)', icon: Plug },
            { id: 'security', label: 'Segurança & Acessos', icon: Shield },
          ].map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-medium transition-all text-left ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form area */}
        <div className="md:col-span-3 p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800/80">
          {/* SECTION 1: PLATFORM INFO */}
          {activeSection === 'platform' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <h3 className="text-sm font-bold text-white mb-2">
                Informações Gerais da Plataforma
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 mb-1">Nome Comercial do SaaS</label>
                  <input
                    type="text"
                    defaultValue="Barber SaaS Master Platform"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Domínio Raiz</label>
                  <input
                    type="text"
                    defaultValue="barbersaas.com.br"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">E-mail de Suporte ao Cliente</label>
                  <input
                    type="email"
                    defaultValue="suporte@barbersaas.com.br"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Moeda Padrão</label>
                  <select className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200">
                    <option value="BRL">Real Brasileiro (R$ - BRL)</option>
                    <option value="USD">Dólar Americano ($ - USD)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: PLANS & PRICING */}
          {activeSection === 'plans' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <h3 className="text-sm font-bold text-white mb-2">Tabela de Planos SaaS</h3>
              <p className="text-zinc-400">
                Configure os valores de cobrança recorrente para as barbearias cadastradas.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-white block">Plano Starter</span>
                    <span className="text-zinc-400 text-[11px]">
                      Até 2 profissionais, 300 agendamentos/mês
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">R$</span>
                    <input
                      type="number"
                      defaultValue="99.00"
                      className="w-24 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-bold"
                    />
                    <span className="text-zinc-500">/mês</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-indigo-300 block">Plano Pro (Mais Popular)</span>
                    <span className="text-zinc-400 text-[11px]">
                      Até 6 profissionais, agendamentos ilimitados, WhatsApp automatizado
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">R$</span>
                    <input
                      type="number"
                      defaultValue="189.00"
                      className="w-24 px-3 py-1.5 bg-zinc-900 border border-indigo-500/50 rounded-lg text-indigo-300 font-bold"
                    />
                    <span className="text-zinc-500">/mês</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-purple-300 block">Plano Enterprise</span>
                    <span className="text-zinc-400 text-[11px]">
                      Profissionais ilimitados, multi-unidades, suporte prioritário 24/7
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">R$</span>
                    <input
                      type="number"
                      defaultValue="349.00"
                      className="w-24 px-3 py-1.5 bg-zinc-900 border border-purple-500/50 rounded-lg text-purple-300 font-bold"
                    />
                    <span className="text-zinc-500">/mês</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <h3 className="text-sm font-bold text-white mb-2">Notificações e Webhooks</h3>
              <p className="text-zinc-400">
                Definição de regras de envio para alertas de sistema e confirmações de horário.
              </p>

              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <span className="font-semibold text-white block">
                      Alertar Master em caso de falha de webhook
                    </span>
                    <span className="text-zinc-400 text-[11px]">
                      Notificar equipe técnica quando um disparo WhatsApp apresentar erro
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-zinc-900 border-zinc-700"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <span className="font-semibold text-white block">
                      Relatório Diário de Faturamento por E-mail
                    </span>
                    <span className="text-zinc-400 text-[11px]">
                      Enviar resumo consolido de novos agendamentos e assinaturas toda manhã
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-zinc-900 border-zinc-700"
                  />
                </label>
              </div>
            </div>
          )}

          {/* SECTION 4: INTEGRATIONS */}
          {activeSection === 'integrations' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <h3 className="text-sm font-bold text-white mb-2">Gateways e Integrações</h3>
              <p className="text-zinc-400">
                Status das integrações de mensageria, processamento de pagamentos e nuvem.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      Twilio WhatsApp Business
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">
                      Conectado
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Disparos transacionais de confirmação e lembretes para clientes das barbearias.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-400" />
                      Stripe Billing (Fase Futura)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400">
                      Mock / Preparado
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Cobrança automática de mensalidades das barbearias via cartão e PIX.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Server className="w-4 h-4 text-amber-400" />
                      Firebase Cloud Multi-Tenant
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400">
                      Preparado (Fase Futura)
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Isolamento por businessId com regras seguras de segurança Firestore.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: SECURITY */}
          {activeSection === 'security' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <h3 className="text-sm font-bold text-white mb-2">Segurança da Plataforma</h3>
              <p className="text-zinc-400">
                Políticas de autenticação, restrição de acesso e controle de sessão do Master.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Autenticação em Dois Fatores (2FA)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Exigir 2FA para qualquer conta com papel &quot;Master Administrator&quot;.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Logs de Auditoria de Acesso</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400">
                      Ativo
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Registro de todas as ações de visualização ou alteração em qualquer barbearia.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
