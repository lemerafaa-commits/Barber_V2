import React, { useState, useEffect } from 'react';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Share2,
} from 'lucide-react';

interface MasterSignupLinkCardProps {
  className?: string;
}

export const MasterSignupLinkCard: React.FC<MasterSignupLinkCardProps> = ({
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  // Resolução dinâmica do origin sem qualquer valor fixo/hardcoded
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location?.origin) {
      setOrigin(window.location.origin);
    }
  }, []);

  const signupUrl = origin ? `${origin}/cadastro` : '/cadastro';

  // Mensagem padronizada e profissional para envio direto via WhatsApp
  const whatsappMessage = `Cadastre sua barbearia na nossa plataforma e comece a organizar seus agendamentos online:\n${signupUrl}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

  // Cópia resiliente para a área de transferência com fallback
  const handleCopy = async () => {
    if (!signupUrl) return;

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(signupUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = signupUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('[MasterSignupLinkCard] Falha ao copiar link de cadastro:', err);
    }
  };

  return (
    <div
      id="master-signup-link-card"
      className={`p-5 rounded-2xl bg-zinc-900/90 border border-indigo-500/30 hover:border-indigo-500/50 transition-all shadow-lg shadow-indigo-950/20 backdrop-blur-xs space-y-4 ${className}`}
    >
      {/* Header do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Cadastrar Nova Barbearia</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Link da Plataforma
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Compartilhe este link público para permitir que uma nova barbearia crie sua conta e entre na sua rede.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
          <Share2 className="w-3.5 h-3.5 text-zinc-400" />
          <span>Onboarding Público</span>
        </div>
      </div>

      {/* Campo com a URL Dinâmica e Ações */}
      <div className="space-y-3">
        <label
          htmlFor="input-master-signup-url"
          className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider"
        >
          Link Público de Cadastro da Plataforma
        </label>

        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          {/* Input ReadOnly */}
          <div className="relative flex-1">
            <input
              id="input-master-signup-url"
              type="text"
              readOnly
              value={signupUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="w-full bg-zinc-950/90 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500/70 rounded-xl px-3.5 py-2.5 text-xs text-indigo-300 font-mono tracking-tight outline-none transition-colors select-all"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 1. Botão Copiar */}
            <button
              id="btn-copy-signup-link"
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                copied
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
              }`}
              title="Copiar link de cadastro para a área de transferência"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-zinc-950 stroke-[3]" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>

            {/* 2. Botão Abrir Cadastro */}
            <a
              id="link-open-signup-page"
              href={signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
              title="Abrir página de cadastro em nova aba"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              <span>Abrir</span>
            </a>

            {/* 3. Botão Compartilhar no WhatsApp */}
            <a
              id="link-share-signup-whatsapp"
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              title="Enviar link de cadastro pelo WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        <p className="text-[11px] text-zinc-400 leading-relaxed">
          💡 Envie este link para barbearias parceiras. Ao acessar, o proprietário preencherá os dados e terá o estabelecimento e o painel provisionados automaticamente.
        </p>
      </div>
    </div>
  );
};
