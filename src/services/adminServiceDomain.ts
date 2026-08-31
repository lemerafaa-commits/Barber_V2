import { AdminService, ServiceCategoryDefinition, ServiceCategoryId } from '../types/admin';

export const DEFAULT_BUSINESS_ID = 'joao-barber';

export const DEFAULT_SERVICE_CATEGORIES: ServiceCategoryDefinition[] = [
  {
    id: 'cabelo',
    name: 'Cabelo',
    description: 'Cortes masculinos, degrade e estilizações',
    iconName: 'Scissors',
  },
  {
    id: 'barba',
    name: 'Barba',
    description: 'Barba alinhada, desenhada e toalha quente',
    iconName: 'Razor',
  },
  {
    id: 'combo',
    name: 'Combo',
    description: 'Pacotes combinados de cabelo e barba',
    iconName: 'Sparkles',
  },
];

export const INITIAL_ADMIN_SERVICES: AdminService[] = [
  {
    id: 'serv-corte-masculino',
    businessId: DEFAULT_BUSINESS_ID,
    name: 'Corte de Cabelo Masculino',
    categoryId: 'cabelo',
    categoryName: 'Cabelo',
    description: 'Corte tradicional, degradê, disfarçado ou militar com acabamento impecável na navalha.',
    price: 45.0,
    durationMinutes: 40,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'serv-barba-tradicional',
    businessId: DEFAULT_BUSINESS_ID,
    name: 'Barba Tradicional',
    categoryId: 'barba',
    categoryName: 'Barba',
    description: 'Alinhamento completo, desenho da barba com navalha e toalha quente relaxante.',
    price: 30.0,
    durationMinutes: 25,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'serv-combo-corte-barba',
    businessId: DEFAULT_BUSINESS_ID,
    name: 'Corte + Barba',
    categoryId: 'combo',
    categoryName: 'Combo',
    description: 'Combo completo de corte de cabelo masculino e barba com atendimento exclusivo.',
    price: 65.0,
    durationMinutes: 60,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export interface ServiceValidationResult {
  isValid: boolean;
  errors: {
    name?: string;
    categoryId?: string;
    price?: string;
    durationMinutes?: string;
  };
}

/**
 * Validates service inputs locally before save.
 */
export function validateServiceInput(input: {
  name: string;
  categoryId: string;
  price: number;
  durationMinutes: number;
}): ServiceValidationResult {
  const errors: ServiceValidationResult['errors'] = {};

  if (!input.name || input.name.trim().length === 0) {
    errors.name = 'O nome do serviço é obrigatório.';
  } else if (input.name.trim().length < 2) {
    errors.name = 'O nome deve conter pelo menos 2 caracteres.';
  }

  if (!input.categoryId || input.categoryId.trim().length === 0) {
    errors.categoryId = 'Selecione uma categoria válida.';
  }

  if (typeof input.price !== 'number' || isNaN(input.price) || input.price < 0) {
    errors.price = 'O preço deve ser um valor numérico maior ou igual a zero.';
  }

  if (
    typeof input.durationMinutes !== 'number' ||
    isNaN(input.durationMinutes) ||
    input.durationMinutes <= 0 ||
    !Number.isInteger(input.durationMinutes)
  ) {
    errors.durationMinutes = 'A duração deve ser um número inteiro maior que 0 minutos.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Groups services by their defined categories, preserving empty categories if desired.
 */
export function groupServicesByCategory(
  services: AdminService[],
  categories: ServiceCategoryDefinition[] = DEFAULT_SERVICE_CATEGORIES
): { category: ServiceCategoryDefinition; services: AdminService[] }[] {
  return categories.map((cat) => ({
    category: cat,
    services: services.filter((s) => s.categoryId === cat.id),
  }));
}

/**
 * Gets all active services.
 */
export function getActiveServices(services: AdminService[]): AdminService[] {
  return services.filter((s) => s.active);
}

/**
 * Adds a new service locally to the state array.
 */
export function addAdminService(
  currentServices: AdminService[],
  newService: Omit<AdminService, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>,
  businessId: string = DEFAULT_BUSINESS_ID
): { success: boolean; services: AdminService[]; createdService?: AdminService; error?: string } {
  const validation = validateServiceInput({
    name: newService.name,
    categoryId: newService.categoryId,
    price: newService.price,
    durationMinutes: newService.durationMinutes,
  });

  if (!validation.isValid) {
    return {
      success: false,
      services: currentServices,
      error: Object.values(validation.errors)[0] || 'Dados inválidos.',
    };
  }

  const id = `serv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const categoryDef = DEFAULT_SERVICE_CATEGORIES.find((c) => c.id === newService.categoryId);

  const createdService: AdminService = {
    ...newService,
    id,
    businessId,
    name: newService.name.trim(),
    description: newService.description ? newService.description.trim() : '',
    categoryName: categoryDef?.name || newService.categoryId,
    createdAt: now,
    updatedAt: now,
  };

  return {
    success: true,
    services: [...currentServices, createdService],
    createdService,
  };
}

/**
 * Updates an existing service in the array.
 */
export function updateAdminService(
  currentServices: AdminService[],
  id: string,
  updates: Partial<Omit<AdminService, 'id' | 'businessId' | 'createdAt'>>
): { success: boolean; services: AdminService[]; updatedService?: AdminService; error?: string } {
  const existing = currentServices.find((s) => s.id === id);
  if (!existing) {
    return {
      success: false,
      services: currentServices,
      error: 'Serviço não encontrado.',
    };
  }

  const merged = { ...existing, ...updates };

  const validation = validateServiceInput({
    name: merged.name,
    categoryId: merged.categoryId,
    price: merged.price,
    durationMinutes: merged.durationMinutes,
  });

  if (!validation.isValid) {
    return {
      success: false,
      services: currentServices,
      error: Object.values(validation.errors)[0] || 'Dados inválidos.',
    };
  }

  const categoryDef = DEFAULT_SERVICE_CATEGORIES.find((c) => c.id === merged.categoryId);

  const updatedService: AdminService = {
    ...merged,
    name: merged.name.trim(),
    description: merged.description ? merged.description.trim() : '',
    categoryName: categoryDef?.name || merged.categoryId,
    updatedAt: new Date().toISOString(),
  };

  return {
    success: true,
    services: currentServices.map((s) => (s.id === id ? updatedService : s)),
    updatedService,
  };
}

/**
 * Soft toggles active status without deleting the service.
 */
export function toggleAdminServiceActive(
  currentServices: AdminService[],
  id: string
): { success: boolean; services: AdminService[]; updatedService?: AdminService } {
  const existing = currentServices.find((s) => s.id === id);
  if (!existing) {
    return { success: false, services: currentServices };
  }

  const updatedService: AdminService = {
    ...existing,
    active: !existing.active,
    updatedAt: new Date().toISOString(),
  };

  return {
    success: true,
    services: currentServices.map((s) => (s.id === id ? updatedService : s)),
    updatedService,
  };
}

/**
 * Format duration in minutes into a friendly label (e.g. "40 minutos" or "1h 15min").
 */
export function formatDurationLabel(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remaining}min`;
}

/**
 * Format currency in Brazilian Real (R$ 45,00).
 */
export function formatPriceBRL(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}
