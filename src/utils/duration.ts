import { BarberServiceConfig } from '../types/admin';

/**
 * Interface mínima representando um serviço do catálogo com campo de duração.
 */
export interface CatalogServiceLike {
  durationMinutes: number;
}

/**
 * Valida se um valor de minutos de duração personalizada é um número inteiro positivo válido.
 * Aceita números inteiros maiores que zero (e finitos).
 */
export function isValidCustomDuration(minutes: unknown): minutes is number {
  return (
    typeof minutes === 'number' &&
    Number.isFinite(minutes) &&
    Number.isInteger(minutes) &&
    minutes > 0
  );
}

/**
 * Motor Central de Resolução de Duração Efetiva por Barbeiro (Fase 3A).
 *
 * Regras de resolução (em ordem estrita de prioridade):
 * 1. Se o profissional estiver com duração personalizada (durationMode === 'custom')
 *    e possuir um customDurationMinutes inteiro positivo válido:
 *    -> Retorna customDurationMinutes.
 * 2. Caso contrário (durationMode === 'default', sem config, ou customDurationMinutes inválido):
 *    -> Retorna service.durationMinutes do catálogo oficial.
 * 
 * Se o serviço do catálogo não possuir uma duração válida (> 0), adota fallback seguro de 30 minutos.
 *
 * Esta função é 100% pura:
 * - Não acessa Firestore
 * - Não acessa estado do React ou DOM
 * - Não faz chamadas de rede ou API
 * - Não muta nenhum objeto de entrada
 * - A duração personalizada do profissional NUNCA altera o objeto do serviço no catálogo.
 */
export function getEffectiveServiceDuration(
  service: CatalogServiceLike | null | undefined,
  config?: BarberServiceConfig | null
): number {
  // 1. Prioridade: Configuração personalizada válida do profissional
  if (
    config?.durationMode === 'custom' &&
    isValidCustomDuration(config.customDurationMinutes)
  ) {
    return config.customDurationMinutes;
  }

  // 2. Fallback: Duração do catálogo oficial de serviços
  if (
    service &&
    typeof service.durationMinutes === 'number' &&
    Number.isFinite(service.durationMinutes) &&
    service.durationMinutes > 0
  ) {
    return Math.round(service.durationMinutes);
  }

  // 3. Fallback de segurança caso catálogo não tenha duração positiva
  return 30;
}

/**
 * Extrai os possíveis IDs do serviço para localização em serviceConfigs:
 * 1. O próprio service.id direto.
 * 2. Se service.id iniciar estritamente com `${service.categoryId}-`, o ID original extraído do sufixo.
 */
export function extractCandidateServiceIds(
  service: { id?: string; categoryId?: string } | null | undefined
): string[] {
  if (!service?.id || typeof service.id !== 'string') return [];
  const rawId = service.id.trim();
  if (!rawId) return [];

  const candidates: string[] = [rawId];

  if (
    service.categoryId &&
    typeof service.categoryId === 'string' &&
    service.categoryId.trim().length > 0
  ) {
    const prefix = `${service.categoryId.trim()}-`;
    if (rawId.startsWith(prefix) && rawId.length > prefix.length) {
      const extractedId = rawId.slice(prefix.length).trim();
      if (extractedId.length > 0 && extractedId !== rawId) {
        candidates.push(extractedId);
      }
    }
  }

  return candidates;
}

/**
 * Helper utilitário complementar:
 * Localiza a configuração do profissional pelo ID do serviço e calcula a duração efetiva.
 *
 * Regras estritas de resolução de ID:
 * 1. Prioridade estrita: correspondência exata entre service.id e config.serviceId.
 * 2. Segunda prioridade: extração segura quando service.id começa exatamente com `${service.categoryId}-`.
 *    NUNCA compara service.categoryId diretamente com config.serviceId (entidades distintas).
 *    NUNCA usa correspondência genérica de substrings parciais.
 * 3. Se nenhuma configuração for encontrada: adota a duração do catálogo ou fallback seguro de 30m.
 */
export function resolveBarberServiceDuration(
  service: (CatalogServiceLike & { id?: string; categoryId?: string }) | null | undefined,
  barber?: { serviceConfigs?: BarberServiceConfig[] } | null
): number {
  if (!service) return 30;

  const configs = barber?.serviceConfigs;
  let matchingConfig: BarberServiceConfig | undefined;

  if (Array.isArray(configs) && configs.length > 0 && service.id && typeof service.id === 'string') {
    const trimmedId = service.id.trim();

    // 1. Prioridade estrita: correspondência exata entre service.id e config.serviceId
    matchingConfig = configs.find((c) => c && c.serviceId === trimmedId);

    // 2. Segunda prioridade: extração segura quando service.id começa estritamente com `${service.categoryId}-`
    if (!matchingConfig && service.categoryId && typeof service.categoryId === 'string') {
      const prefix = `${service.categoryId.trim()}-`;
      if (trimmedId.startsWith(prefix) && trimmedId.length > prefix.length) {
        const extractedId = trimmedId.slice(prefix.length).trim();
        if (extractedId.length > 0) {
          matchingConfig = configs.find((c) => c && c.serviceId === extractedId);
        }
      }
    }
  }

  return getEffectiveServiceDuration(service, matchingConfig);
}

/**
 * Calcula a duração total efetiva para uma lista de serviços,
 * somando a duração efetiva individual de cada serviço para o barbeiro informado.
 *
 * - Lista vazia, nula ou indefinida: retorna 0.
 * - Barbeiro nulo ou sem configuração customizada: adota a duração padrão de cada serviço do catálogo.
 * - Serviço sem duração válida no catálogo: adota o fallback de 30 minutos por serviço.
 * - Função 100% pura: não muta objetos e não possui efeitos colaterais.
 */
export function calculateTotalEffectiveDuration(
  services: Array<CatalogServiceLike & { id?: string; categoryId?: string }> | null | undefined,
  barber?: { serviceConfigs?: BarberServiceConfig[] } | null
): number {
  if (!services || !Array.isArray(services) || services.length === 0) {
    return 0;
  }

  return services.reduce((total, service) => {
    return total + resolveBarberServiceDuration(service, barber);
  }, 0);
}

