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
 * Helper utilitário complementar:
 * Localiza a configuração do profissional pelo ID do serviço e calcula a duração efetiva.
 */
export function resolveBarberServiceDuration(
  service: (CatalogServiceLike & { id: string }) | null | undefined,
  barber?: { serviceConfigs?: BarberServiceConfig[] } | null
): number {
  if (!service) return 30;
  const config = barber?.serviceConfigs?.find((c) => c.serviceId === service.id);
  return getEffectiveServiceDuration(service, config);
}
