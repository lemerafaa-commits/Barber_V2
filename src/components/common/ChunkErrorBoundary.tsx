import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onGoHome?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Boundary de resiliência para carregamento dinâmico de chunks (React.lazy).
 * Captura falhas de rede, ChunkLoadError ou novas versões deployadas na Vercel
 * e oferece recuperação graciosa ao usuário sem travamento da aplicação.
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  props: Props;
  state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ChunkErrorBoundary] Falha ao carregar chunk sob demanda:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isChunkOrNetworkError =
        this.state.error?.name === 'ChunkLoadError' ||
        this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
        this.state.error?.message?.includes('Importing a module script failed');

      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white font-['Montserrat',sans-serif] tracking-tight mb-2">
              {this.props.fallbackTitle || 'Instabilidade no Carregamento'}
            </h2>

            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              {isChunkOrNetworkError
                ? 'Uma atualização do sistema foi realizada ou houve uma oscilação temporária de rede ao buscar este módulo. Recarregue a página para obter a versão mais recente.'
                : 'Não foi possível carregar o módulo solicitado no momento. Por favor, tente recarregar a página.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar página
              </button>

              {this.props.onGoHome && (
                <button
                  type="button"
                  onClick={this.props.onGoHome}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm transition-all active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Ir para o início
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
