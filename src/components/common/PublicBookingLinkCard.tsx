import React, { useState, useId } from 'react';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export interface PublicBookingLinkCardProps {
  businessId: string;
  slug?: string | null;
  businessName?: string;
  theme?: 'amber' | 'indigo';
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

export const PublicBookingLinkCard: React.FC<PublicBookingLinkCardProps> = ({
  businessId,
  slug,
  businessName = 'Barbearia',
  theme = 'amber',
  isLoading = false,
  error = null,
  onRetry,
  className = '',
  compact = false,
}) => {
  const inputId = useId();
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [copyErrorMsg, setCopyErrorMsg] = useState<string | null>(null);

  // Sanitização do slug e construção segura da URL
  const cleanSlug = typeof slug === 'string' ? slug.trim() : '';
  const isSlugValid = /^[a-zA-Z0-9_-]{1,64}$/.test(cleanSlug);

  // Obtém origin de forma segura para ambiente de navegador
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const publicPath = isSlugValid ? `/b/${cleanSlug}` : '';
  const fullPublicUrl = isSlugValid && origin ? `${origin}${publicPath}` : '';

  // Mensagem padronizada e profissional para o WhatsApp
  const whatsappMessage = `Olá! Agende seu horário na *${businessName.trim()}* de forma rápida e prática pelo link:\n${fullPublicUrl}`;
  const whatsappShareUrl = isSlugValid
    ? `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`
    : '#';

  // Copiar URL com fallback seguro
  const handleCopy = async () => {
    if (!fullPublicUrl || !isSlugValid) return;

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(fullPublicUrl);
      } else {
        // Fallback usando elemento textarea temporário
        const textArea = document.createElement('textarea');
        textArea.value = fullPublicUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!successful) {
          throw new Error('Falha no fallback de cópia');
        }
      }

      setCopyStatus('copied');
      setCopyErrorMsg(null);
      setTimeout(() => {
        setCopyStatus('idle');
      }, 2500);
    } catch (err: any) {
      console.warn('[PublicBookingLinkCard] Falha ao copiar para a área de transferência:', err);
      setCopyStatus('error');
      setCopyErrorMsg('Não foi possível copiar automaticamente. Selecione e copie o link no campo acima.');
      setTimeout(() => {
        setCopyStatus('idle');
      }, 4000);
    }
  };

  // Cores dinâmicas por tema (amber para Admin, indigo para Master)
  const isAmber = theme === 'amber';
  const accentText = isAmber ? 'text-amber-400' : 'text-indigo-400';
  const accentBorder = isAmber ? 'border-amber-500/30' : 'border-indigo-500/30';
  const accentBg = isAmber ? 'bg-amber-500/10' : 'bg-indigo-500/10';
  const primaryButtonClass = isAmber
    ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold'
    : 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold';
  const borderCardClass = isAmber ? 'border-zinc-800/80 hover:border-amber-500/30' : 'border-zinc-800/80 hover:border-indigo-500/30';

  // ESTADO 1: Carregamento
  if (isLoading) {
    return (
      <div className={`p-5 rounded-2xl bg-zinc-900/80 border ${borderCardClass} transition-all ${className}`}>
        <div className="flex items-center gap-3">
          <Loader2 className={`w-5 h-5 ${accentText} animate-spin`} />
          <span className="text-xs text-zinc-400 font-medium">Carregando informações do link de agendamento...</span>
        </div>
      </div>
    );
  }

  // ESTADO 2: Erro ao carregar dados da empresa
  if (error) {
    return (
      <div className={`p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 ${className}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-200">
                Link de Agendamento Indisponível
              </h4>
              <p className="text-xs text-rose-300/90 mt-1">
                {error || 'Não foi possível carregar os dados desta empresa para gerar o link.'}
              </p>
            </div>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-rose-200 hover:text-white text-xs font-semibold border border-rose-500/30 transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tentar novamente</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ESTADO 3: Empresa sem slug configurado
  if (!cleanSlug || !isSlugValid) {
    return (
      <div className={`p-5 sm:p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-4 ${className}`}>
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Link de Agendamento</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Pendente
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Endereço exclusivo para os clientes agendarem horários online.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-amber-200 block">Empresa sem slug público configurado</span>
            <p className="text-amber-300/80 leading-relaxed text-[11px]">
              Esta empresa ({businessName || businessId}) ainda não possui um identificador amigável (slug) cadastrado. Para habilitar o agendamento público, configure um identificador exclusivo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ESTADO 4: Link disponível e pronto para compartilhamento
  return (
    <div className={`p-5 sm:p-6 rounded-2xl bg-zinc-900/90 border ${borderCardClass} transition-all space-y-4 shadow-sm ${className}`}>
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl ${accentBg} border ${accentBorder} flex items-center justify-center ${accentText} shrink-0`}>
            <Link2 className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Link de Agendamento
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Ativo
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Compartilhe este endereço com seus clientes para receber agendamentos online.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-zinc-300 self-start sm:self-center">
          tenant: <strong className="text-zinc-200">{cleanSlug}</strong>
        </span>
      </div>

      {/* Campo da URL Completa */}
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
          URL Pública da Empresa
        </label>
        <div className="flex items-center rounded-xl bg-zinc-950 border border-zinc-800 p-1.5 focus-within:border-zinc-700 transition-colors">
          <input
            id={inputId}
            type="text"
            readOnly
            value={fullPublicUrl}
            onFocus={(e) => e.target.select()}
            className="w-full bg-transparent border-0 px-3 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none select-all"
            aria-label="URL pública de agendamento"
          />
        </div>
      </div>

      {/* Feedback de Cópia ou Erro */}
      {copyStatus === 'copied' && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300 animate-fade-in font-medium">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Link copiado para a área de transferência com sucesso!</span>
        </div>
      )}

      {copyStatus === 'error' && copyErrorMsg && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300 animate-fade-in font-medium">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{copyErrorMsg}</span>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {/* 1. Botão Copiar Link */}
        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm active:scale-[0.98] cursor-pointer ${
            copyStatus === 'copied'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold'
              : primaryButtonClass
          }`}
          title="Copiar URL completa para a área de transferência"
        >
          {copyStatus === 'copied' ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copiar Link</span>
            </>
          )}
        </button>

        {/* 2. Botão Abrir Página (Proteção estrita: somente rotas públicas /b/:slug no mesmo origin) */}
        <a
          href={publicPath}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 hover:text-white border border-zinc-700/80 text-xs font-semibold transition-all cursor-pointer active:scale-[0.98]"
          title="Abrir página pública de agendamento em nova aba"
        >
          <span>Abrir Página</span>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
        </a>

        {/* 3. Botão Compartilhar no WhatsApp */}
        <a
          href={whatsappShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer active:scale-[0.98]"
          title="Compartilhar link de agendamento no WhatsApp"
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
          <span>Compartilhar no WhatsApp</span>
        </a>
      </div>
    </div>
  );
};
