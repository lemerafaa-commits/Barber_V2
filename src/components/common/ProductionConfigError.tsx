import React from 'react';
import { ServerOff, ArrowLeft, RefreshCw } from 'lucide-react';

interface ProductionConfigErrorProps {
  title?: string;
  description?: string;
  onGoHome?: () => void;
}

export const ProductionConfigError: React.FC<ProductionConfigErrorProps> = ({
  title = 'Serviço de Infraestrutura Indisponível',
  description = 'Os serviços em nuvem de autenticação e banco de dados não foram inicializados para este ambiente de produção. Por segurança estrita, o acesso aos painéis de gerenciamento permanece desativado.',
  onGoHome,
}) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased selection:bg-amber-500 selection:text-zinc-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Warning Icon & Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3 shadow-inner shadow-amber-950">
            <ServerOff className="w-7 h-7" />
          </div>
          <div>
            <span className="inline-block text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 mb-1.5">
              503 • Configuração de Produção
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white font-['Montserrat',sans-serif]">
            {title}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            {description}
          </p>
        </div>

        {/* Card Content */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-5">
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-300 space-y-1.5">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold block">
              Diagnóstico de Segurança:
            </span>
            <div className="font-mono text-zinc-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-500">Ambiente:</span>
                <span className="text-amber-400 font-semibold">Produção (Build Oficial)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Serviços em Nuvem:</span>
                <span className="text-rose-400 font-semibold">Desconectados</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Política de Acesso:</span>
                <span className="text-zinc-200">Fail-Safe Ativo (Mock Bloqueado)</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 pt-1">
              O modo de demonstração simulado não é permitido em builds de produção. Configure as credenciais no provedor para liberar o acesso.
            </p>
          </div>

          <div className="space-y-2.5 pt-1 text-xs">
            {/* Tentar novamente */}
            <button
              id="prod-config-retry-btn"
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold flex items-center justify-between transition-colors cursor-pointer shadow-lg shadow-amber-500/15"
            >
              <span>Recarregar Página</span>
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Voltar para a página pública */}
            {onGoHome && (
              <button
                id="prod-config-go-home-btn"
                type="button"
                onClick={onGoHome}
                className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 font-medium flex items-center justify-between transition-colors cursor-pointer border border-zinc-800"
              >
                <span>Voltar ao Agendamento Público (/)</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
