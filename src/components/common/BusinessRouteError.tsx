import React from 'react';
import { Store, AlertCircle, WifiOff, Scissors, Home, RefreshCw } from 'lucide-react';

export type BusinessRouteErrorType = 'not_found' | 'invalid_slug' | 'server_error' | 'empty_catalog';

interface BusinessRouteErrorProps {
  type: BusinessRouteErrorType;
  slug?: string | null;
  errorMessage?: string | null;
  onRetry?: () => void;
  onGoHome: () => void;
}

export const BusinessRouteError: React.FC<BusinessRouteErrorProps> = ({
  type,
  slug,
  errorMessage,
  onRetry,
  onGoHome,
}) => {
  const getDetails = () => {
    switch (type) {
      case 'not_found':
        return {
          icon: <Store className="w-10 h-10 text-amber-500" />,
          badge: '404 • Barbearia Não Encontrada',
          badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
          title: 'Estabelecimento Não Encontrado',
          description: slug
            ? `Não localizamos nenhum estabelecimento ativo associado ao endereço "/b/${slug}".`
            : 'O endereço de estabelecimento acessado não existe ou foi desativado.',
          helper: 'Verifique se o link foi digitado corretamente ou consulte o responsável pelo estabelecimento.',
          canRetry: false,
        };
      case 'invalid_slug':
        return {
          icon: <AlertCircle className="w-10 h-10 text-rose-500" />,
          badge: '400 • Endereço Inválido',
          badgeColor: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
          title: 'Identificador Inválido',
          description: slug
            ? `O identificador "/b/${slug}" contém caracteres não permitidos para rotas de agendamento.`
            : 'O link acessado possui formato inválido.',
          helper: 'Endereços de estabelecimentos contêm apenas letras, números, hifens e underlines.',
          canRetry: false,
        };
      case 'empty_catalog':
        return {
          icon: <Scissors className="w-10 h-10 text-zinc-400" />,
          badge: 'Catálogo em Preparação',
          badgeColor: 'border-zinc-700/50 bg-zinc-800/40 text-zinc-300',
          title: 'Sem Serviços Disponíveis',
          description: 'Este estabelecimento ainda não disponibilizou serviços ou profissionais para agendamento online.',
          helper: 'Entre em contato diretamente com a equipe da barbearia ou tente novamente mais tarde.',
          canRetry: true,
        };
      case 'server_error':
      default:
        return {
          icon: <WifiOff className="w-10 h-10 text-amber-500" />,
          badge: 'Falha de Comunicação',
          badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
          title: 'Instabilidade Temporária',
          description: errorMessage || 'Não foi possível carregar as informações do estabelecimento no momento.',
          helper: 'Por favor, verifique sua conexão com a internet ou tente novamente em instantes.',
          canRetry: true,
        };
    }
  };

  const details = getDetails();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 text-center antialiased">
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm flex flex-col items-center">
        {/* Ícone */}
        <div className="w-20 h-20 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-6 shadow-inner">
          {details.icon}
        </div>

        {/* Badge de status */}
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border mb-4 ${details.badgeColor}`}>
          {details.badge}
        </span>

        {/* Título e descrição */}
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 font-serif mb-3 tracking-tight">
          {details.title}
        </h1>
        <p className="text-sm text-zinc-300 mb-2 leading-relaxed">
          {details.description}
        </p>
        <p className="text-xs text-zinc-500 mb-8 leading-relaxed max-w-xs">
          {details.helper}
        </p>

        {/* Ações */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          {details.canRetry && onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm rounded-xl transition-all shadow-md active:scale-[0.99]"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </button>
          )}

          <button
            onClick={onGoHome}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-sm rounded-xl transition-all border border-zinc-700/60 active:scale-[0.99] ${
              !details.canRetry ? 'w-full' : ''
            }`}
          >
            <Home className="w-4 h-4 text-zinc-400" />
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  );
};
