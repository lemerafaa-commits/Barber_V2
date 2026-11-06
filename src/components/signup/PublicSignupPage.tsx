import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Store,
  Globe,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { formatBrazilianPhone } from '../../utils/phoneMask';

export interface PublicSignupPageProps {
  onGoToLogin: () => void;
  onGoToPublicPage?: () => void;
  onGoToTenantPage?: (slug: string) => void;
}

interface CreatedTenantInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
}

/**
 * Converte um texto arbitrário em um slug amigável e limpo para URLs.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

export const PublicSignupPage: React.FC<PublicSignupPageProps> = ({
  onGoToLogin,
  onGoToPublicPage,
  onGoToTenantPage,
}) => {
  // Estados dos campos do formulário
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  // Controle de visibilidade de senha
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Estados de ciclo de vida e submissão
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdTenant, setCreatedTenant] = useState<CreatedTenantInfo | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Determina o origin dinâmico sem hardcode
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location?.origin) {
      setOrigin(window.location.origin);
    }
  }, []);

  // Limpeza de senhas em caso de desmontagem do componente (Higiene de Memória)
  useEffect(() => {
    return () => {
      setPassword('');
      setPasswordConfirm('');
    };
  }, []);

  // Atualização reativa de sugestão de slug enquanto o usuário digita o nome
  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBusinessName(val);
    if (!isSlugManual) {
      setSlug(slugify(val));
    }
  };

  // Edição manual do slug com normalização de caracteres válidos
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManual(true);
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setSlug(raw);
  };

  // Máscara e formatação amigável de telefone brasileiro
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBrazilianPhone(e.target.value);
    setAdminPhone(formatted);
  };

  // Validação simples de frontend antes do envio à API
  const validateForm = (): string | null => {
    if (!businessName.trim() || businessName.trim().length < 2) {
      return 'Informe o nome da sua barbearia (mínimo de 2 caracteres).';
    }
    const cleanSlug = slug.trim().toLowerCase();
    if (!cleanSlug || cleanSlug.length < 3) {
      return 'O endereço/slug da barbearia deve conter pelo menos 3 caracteres.';
    }
    if (!/^[a-z0-9][a-z0-9_-]*[a-z0-9]$/.test(cleanSlug)) {
      return 'O endereço deve conter apenas letras minúsculas, números ou hífens, sem iniciar ou terminar com caracteres especiais.';
    }
    if (!adminName.trim() || adminName.trim().length < 2) {
      return 'Informe o nome do administrador responsável (mínimo de 2 caracteres).';
    }
    if (!adminEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) {
      return 'Informe um e-mail válido para acessar o sistema.';
    }
    if (!password || password.length < 6) {
      return 'A senha deve conter pelo menos 6 caracteres.';
    }
    if (password !== passwordConfirm) {
      return 'As senhas informadas não coincidem. Verifique a confirmação.';
    }
    return null;
  };

  // Submissão do formulário conectado a POST /api/public/signup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Payload higienizado com estrita aderência à whitelist do backend.
    // passwordConfirm, plan, source, role e claims NÃO são incluídos.
    const payload = {
      businessName: businessName.trim(),
      slug: slug.trim().toLowerCase(),
      adminName: adminName.trim(),
      adminEmail: adminEmail.trim().toLowerCase(),
      initialPassword: password,
      adminPhone: adminPhone.trim() ? adminPhone.trim() : undefined,
    };

    try {
      const response = await fetch('/api/public/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        throw new Error('Falha ao processar resposta do servidor.');
      }

      if (!response.ok || !data?.success) {
        const errorCode = data?.error;
        let userMessage = 'Ocorreu um erro ao criar sua conta. Tente novamente.';

        switch (errorCode) {
          case 'INVALID_DATA':
            userMessage = data?.message || 'Verifique os dados informados e tente novamente.';
            break;
          case 'SLUG_RESERVED':
            userMessage = 'Este endereço não pode ser utilizado pois é reservado pelo sistema. Por favor, escolha outro identificador.';
            break;
          case 'SLUG_ALREADY_EXISTS':
            userMessage = 'Este endereço já está sendo utilizado por outra barbearia. Escolha outro slug.';
            break;
          case 'EMAIL_ALREADY_IN_USE':
            userMessage = 'Este e-mail já possui uma conta cadastrada. Faça login ou utilize outro e-mail.';
            break;
          case 'FIREBASE_CONFIG_ERROR':
            userMessage = 'O sistema está temporariamente indisponível. Tente novamente mais tarde.';
            break;
          case 'INTERNAL_ERROR':
            userMessage = 'Ocorreu um erro ao criar sua conta. Tente novamente.';
            break;
          default:
            if (typeof data?.message === 'string' && data.message.length > 0 && !data.message.includes('auth/')) {
              userMessage = data.message;
            }
            break;
        }

        setErrorMessage(userMessage);
      } else {
        // Sucesso comprovado:
        // 1. Limpa imediatamente as senhas da memória do componente
        setPassword('');
        setPasswordConfirm('');
        // 2. Armazena os dados do tenant retornado
        setCreatedTenant(data.business);
        setIsSuccess(true);
      }
    } catch (networkErr: any) {
      setErrorMessage(
        networkErr?.message === 'Falha ao processar resposta do servidor.'
          ? networkErr.message
          : 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdTenant) return;
    const url = `${origin || ''}/b/${createdTenant.slug}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // URL de prévia dinâmica
  const previewSlug = slug || 'sua-barbearia';
  const previewUrl = `${origin || ''}/b/${previewSlug}`;

  // ==========================================
  // ESTADO DE SUCESSO
  // ==========================================
  if (isSuccess && createdTenant) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 antialiased selection:bg-amber-500 selection:text-zinc-950">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Header de Sucesso */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-['Montserrat',sans-serif]">
              Barbearia Criada com Sucesso!
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-zinc-400">
              Sua conta administrativa e o catálogo inicial foram provisionados com sucesso.
            </p>
          </div>

          {/* Card Resumo do Tenant Criado */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-sm space-y-5">
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Estabelecimento
                </span>
                <span className="text-base font-bold text-white block mt-0.5">
                  {createdTenant.name}
                </span>
              </div>

              <div className="pt-2 border-t border-zinc-800/80">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Link de Agendamento dos seus Clientes
                </span>
                <div className="flex items-center justify-between gap-2 mt-1 p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-xs text-amber-400 font-mono truncate">
                    {previewUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Copiar link da barbearia"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">E-mail Admin</span>
                  <span className="text-zinc-200 font-medium truncate block">{adminEmail}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Plano</span>
                  <span className="text-emerald-400 font-semibold block">Starter (Ativo)</span>
                </div>
              </div>
            </div>

            {/* Ações pós-cadastro */}
            <div className="space-y-3 pt-2">
              <button
                id="btn-go-to-login"
                type="button"
                onClick={onGoToLogin}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <span>Ir para o Login Administrativo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onGoToTenantPage && (
                <button
                  type="button"
                  onClick={() => onGoToTenantPage(createdTenant.slug)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Visualizar Catálogo Público da Barbearia</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ESTADO FORMULÁRIO / NORMAL / LOADING
  // ==========================================
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center py-10 sm:py-12 px-4 sm:px-6 lg:px-8 antialiased selection:bg-amber-500 selection:text-zinc-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Header do Formulário de Cadastro */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3 shadow-inner">
            <Scissors className="w-7 h-7" />
          </div>
          <span className="inline-block text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-1.5">
            Cadastro de Barbearia
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-['Montserrat',sans-serif]">
            Crie sua Barbearia
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
            Cadastre seu estabelecimento e comece a receber agendamentos online dos seus clientes em minutos.
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          {/* Mensagem de Erro Amigável */}
          {errorMessage && (
            <div
              id="signup-error-banner"
              className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Nome da Barbearia */}
            <div>
              <label
                htmlFor="signup-business-name"
                className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                Nome da Barbearia *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Store className="w-4 h-4" />
                </div>
                <input
                  id="signup-business-name"
                  type="text"
                  required
                  value={businessName}
                  onChange={handleBusinessNameChange}
                  placeholder="Ex: Barbearia Vintage"
                  disabled={isLoading}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* 2. Endereço / Slug com Prévia Dinâmica */}
            <div>
              <label
                htmlFor="signup-slug"
                className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                Endereço Web da sua Barbearia (Slug) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  id="signup-slug"
                  type="text"
                  required
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="ex: barbearia-vintage"
                  disabled={isLoading}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors disabled:opacity-50 font-mono text-xs"
                />
              </div>

              {/* Prévia do Endereço Público */}
              <div className="mt-1.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500 font-medium">Seu endereço público será:</span>
                </div>
                <div className="font-mono text-amber-400 truncate font-semibold">
                  {previewUrl}
                </div>
                <span className="text-[10px] text-zinc-400 block pt-0.5">
                  Seus clientes utilizarão este endereço para agendar horários online.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* 3. Nome do Administrador */}
              <div>
                <label
                  htmlFor="signup-admin-name"
                  className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
                >
                  Seu Nome *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-admin-name"
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    disabled={isLoading}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              {/* 4. WhatsApp / Telefone Comercial (Opcional) */}
              <div>
                <label
                  htmlFor="signup-admin-phone"
                  className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
                >
                  WhatsApp Comercial <span className="text-zinc-500 font-normal lowercase">(opcional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-admin-phone"
                    type="tel"
                    value={adminPhone}
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    disabled={isLoading}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* 5. E-mail Administrativo */}
            <div>
              <label
                htmlFor="signup-admin-email"
                className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                E-mail Administrativo *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="signup-admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@suabarbearia.com"
                  disabled={isLoading}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* 6. Senha e Confirmação de Senha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
                >
                  Senha *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    disabled={isLoading}
                    className="w-full pl-10 pr-10 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-password-confirm"
                  className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
                >
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-password-confirm"
                    type={showPasswordConfirm ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Repita a senha"
                    disabled={isLoading}
                    className="w-full pl-10 pr-10 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Botão de Criação */}
            <div className="pt-2">
              <button
                id="signup-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Criando sua barbearia...</span>
                  </>
                ) : (
                  <>
                    <span>Criar minha barbearia</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Aviso Informativo Discreto */}
            <p className="text-[11px] text-zinc-400 text-center leading-relaxed pt-1">
              Após criar sua conta, você poderá configurar seus serviços, equipe e horários no painel administrativo.
            </p>
          </form>

          {/* Links de Retorno e Login */}
          <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={onGoToLogin}
              className="text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              Já possui uma conta? <span className="font-semibold text-amber-400 underline underline-offset-2">Entrar</span>
            </button>

            {onGoToPublicPage && (
              <button
                type="button"
                onClick={onGoToPublicPage}
                className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao início</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
