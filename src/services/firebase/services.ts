import {
  collection,
  setDoc,
  doc,
  getDocs,
  getDocFromServer,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  OperationType,
  isFirebaseConfigured,
  assertBrowserOnline,
  awaitFirestoreOperation,
  FIRESTORE_READ_TIMEOUT_MS,
  FIRESTORE_WRITE_TIMEOUT_MS,
  FirestoreOperationError,
} from './config';
import { AdminService, ServiceCategoryId } from '../../types/admin';
import { ServiceCategory } from '../../types/booking';
import {
  DEFAULT_SERVICE_CATEGORIES,
  INITIAL_ADMIN_SERVICES,
  validateServiceInput,
} from '../adminServiceDomain';

export const CANONICAL_BUSINESS_ID = 'joao-barber';

/**
 * Gera um identificador único e determinístico para tentativas de criação de serviço.
 */
export function generateServiceDraftId(): string {
  if (isFirebaseConfigured && db) {
    return doc(collection(db, 'services')).id;
  }
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `srv_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
  }
  return `srv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Normalizes a Firestore document snapshot into an AdminService object.
 */
export function normalizeFirestoreService(docId: string, data: Record<string, any>): AdminService {
  let createdAtStr = new Date().toISOString();
  if (data.createdAt) {
    if (typeof data.createdAt.toDate === 'function') {
      createdAtStr = data.createdAt.toDate().toISOString();
    } else if (typeof data.createdAt === 'string') {
      createdAtStr = data.createdAt;
    } else if (data.createdAt instanceof Date) {
      createdAtStr = data.createdAt.toISOString();
    }
  }

  let updatedAtStr = createdAtStr;
  if (data.updatedAt) {
    if (typeof data.updatedAt.toDate === 'function') {
      updatedAtStr = data.updatedAt.toDate().toISOString();
    } else if (typeof data.updatedAt === 'string') {
      updatedAtStr = data.updatedAt;
    } else if (data.updatedAt instanceof Date) {
      updatedAtStr = data.updatedAt.toISOString();
    }
  }

  const categoryDef = DEFAULT_SERVICE_CATEGORIES.find((c) => c.id === data.categoryId);
  const categoryName = data.categoryName || categoryDef?.name || data.categoryId || 'Geral';

  return {
    id: docId,
    businessId: data.businessId || '',
    name: data.name || 'Serviço',
    categoryId: (data.categoryId as ServiceCategoryId) || 'cabelo',
    categoryName,
    description: data.description || '',
    price: typeof data.price === 'number' ? data.price : Number(data.price) || 0,
    durationMinutes:
      typeof data.durationMinutes === 'number'
        ? data.durationMinutes
        : Number(data.durationMinutes) || 30,
    active: typeof data.active === 'boolean' ? data.active : true,
    createdAt: createdAtStr,
    updatedAt: updatedAtStr,
  };
}

/**
 * Seeds initial services into Cloud Firestore idempotently with deterministic IDs.
 */
export async function seedInitialServicesIfEmpty(
  businessId: string
): Promise<AdminService[]> {
  if (!isFirebaseConfigured || !db) {
    return [];
  }
  const cleanBusinessId = typeof businessId === 'string' ? businessId.trim() : '';
  if (!cleanBusinessId) {
    throw new Error('Identificador da barbearia (businessId) obrigatório para inicializar serviços.');
  }

  const collectionPath = 'services';
  try {
    const createdServices: AdminService[] = [];

    for (const service of INITIAL_ADMIN_SERVICES) {
      const docId = `${cleanBusinessId}_${service.id}`;
      const payload = {
        businessId: cleanBusinessId,
        name: service.name,
        categoryId: service.categoryId,
        categoryName: service.categoryName,
        description: service.description || '',
        price: Number(service.price),
        durationMinutes: Number(service.durationMinutes),
        active: service.active,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, collectionPath, docId), payload);
      createdServices.push({
        ...service,
        id: docId,
        businessId: cleanBusinessId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return createdServices;
  } catch (error) {
    console.warn('Could not auto-seed services to Firestore:', error);
    return [];
  }
}

/**
 * Fetches all services for a given business tenant directly from Firestore.
 * Does not combine with mock data.
 */
export async function getFirestoreServices(
  businessId: string
): Promise<AdminService[]> {
  if (!isFirebaseConfigured || !db) {
    return [];
  }
  const cleanBusinessId = typeof businessId === 'string' ? businessId.trim() : '';
  if (!cleanBusinessId) {
    throw new Error('Identificador da barbearia (businessId) não definido para consultar serviços.');
  }

  const collectionPath = 'services';
  try {
    assertBrowserOnline('consultar os serviços');
    const q = query(
      collection(db, collectionPath),
      where('businessId', '==', cleanBusinessId)
    );
    const querySnapshot = await awaitFirestoreOperation(getDocs(q), {
      timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
      timeoutMessage: 'Tempo esgotado ao carregar serviços do Firestore. Verifique sua conexão.',
      indeterminateOnTimeout: false,
    });

    if (querySnapshot.empty) {
      return [];
    }

    const servicesMap = new Map<string, AdminService>();
    querySnapshot.forEach((docSnap) => {
      if (!servicesMap.has(docSnap.id)) {
        servicesMap.set(docSnap.id, normalizeFirestoreService(docSnap.id, docSnap.data()));
      }
    });

    const services = Array.from(servicesMap.values());

    // Sort: active first, then by category and name
    return services.sort((a, b) => {
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }
      const catCompare = (a.categoryName || '').localeCompare(b.categoryName || '');
      if (catCompare !== 0) return catCompare;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('[Firestore] Erro ao consultar serviços:', error);
    throw error;
  }
}

/**
 * Creates a new service in Cloud Firestore idempotently using a fixed document ID
 * per modal attempt so retries never create duplicates and preserve createdAt.
 */
export async function createFirestoreService(
  serviceData: {
    name: string;
    categoryId: ServiceCategoryId;
    description?: string;
    price: number;
    durationMinutes: number;
    active?: boolean;
  },
  businessId: string,
  options?: {
    idempotencyId?: string;
    wasIndeterminate?: boolean;
  }
): Promise<AdminService> {
  const collectionPath = 'services';
  const cleanBusinessId = typeof businessId === 'string' ? businessId.trim() : '';

  if (!cleanBusinessId) {
    throw new Error('Identificador da barbearia (businessId) ausente na sessão administrativa.');
  }

  const validation = validateServiceInput({
    name: serviceData.name,
    categoryId: serviceData.categoryId,
    description: serviceData.description,
    price: serviceData.price,
    durationMinutes: serviceData.durationMinutes,
  });

  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0] || 'Dados inválidos.';
    throw new Error(firstError);
  }

  if (!isFirebaseConfigured || !db) {
    throw new Error('Operação indisponível. Firebase não configurado no ambiente.');
  }

  assertBrowserOnline('salvar o serviço');

  const categoryDef = DEFAULT_SERVICE_CATEGORIES.find((c) => c.id === serviceData.categoryId);
  const categoryName = categoryDef?.name || serviceData.categoryId;
  const trimmedName = serviceData.name.trim();
  const trimmedDescription = serviceData.description ? serviceData.description.trim() : '';
  const numericPrice = Number(serviceData.price);
  const roundedDuration = Math.round(Number(serviceData.durationMinutes));
  const isActive = serviceData.active !== undefined ? serviceData.active : true;

  const targetId =
    typeof options?.idempotencyId === 'string' && options.idempotencyId.trim().length > 0
      ? options.idempotencyId.trim()
      : generateServiceDraftId();
  const docRef = doc(db, collectionPath, targetId);

  try {
    // Se a tentativa anterior teve resultado indeterminado, verifica primeiro no servidor
    // antes de reenviar, evitando sobrescrever createdAt ou duplicar registros.
    if (options?.wasIndeterminate) {
      let existingSnap;
      try {
        existingSnap = await awaitFirestoreOperation(getDocFromServer(docRef), {
          timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
          timeoutMessage:
            'Ainda não foi possível confirmar a gravação anterior com o servidor. Verifique sua conexão e tente novamente.',
          indeterminateOnTimeout: true,
        });
      } catch (checkErr) {
        if (checkErr instanceof FirestoreOperationError) {
          throw checkErr;
        }
        throw new FirestoreOperationError(
          'Ainda sem comunicação com o servidor para verificar a tentativa anterior. Verifique sua conexão e tente novamente.',
          { isIndeterminate: true, isOffline: true, originalError: checkErr }
        );
      }

      if (existingSnap.exists()) {
        const existingNormalized = normalizeFirestoreService(existingSnap.id, existingSnap.data());
        // Atualiza somente campos editáveis, preservando createdAt original
        await awaitFirestoreOperation(
          updateDoc(docRef, {
            name: trimmedName,
            categoryId: serviceData.categoryId,
            categoryName,
            description: trimmedDescription,
            price: numericPrice,
            durationMinutes: roundedDuration,
            active: isActive,
            updatedAt: serverTimestamp(),
          }),
          {
            timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
            timeoutMessage:
              'O serviço já existe no servidor, mas a atualização dos detalhes não recebeu confirmação a tempo.',
            indeterminateOnTimeout: true,
          }
        );

        return {
          ...existingNormalized,
          name: trimmedName,
          categoryId: serviceData.categoryId,
          categoryName,
          description: trimmedDescription,
          price: numericPrice,
          durationMinutes: roundedDuration,
          active: isActive,
          updatedAt: new Date().toISOString(),
        };
      }
    }

    const payload = {
      businessId: cleanBusinessId,
      name: trimmedName,
      categoryId: serviceData.categoryId,
      categoryName,
      description: trimmedDescription,
      price: numericPrice,
      durationMinutes: roundedDuration,
      active: isActive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await awaitFirestoreOperation(setDoc(docRef, payload), {
      timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
      timeoutMessage:
        'Não foi possível confirmar o salvamento junto ao Firestore (conexão instável ou offline). O identificador desta tentativa foi preservado para retry seguro.',
      indeterminateOnTimeout: true,
    });

    return {
      id: docRef.id,
      businessId: cleanBusinessId,
      name: payload.name,
      categoryId: payload.categoryId,
      categoryName: payload.categoryName,
      description: payload.description,
      price: payload.price,
      durationMinutes: payload.durationMinutes,
      active: payload.active,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${collectionPath}/${targetId}`);
    throw error;
  }
}

/**
 * Updates an existing service document in Cloud Firestore.
 */
export async function updateFirestoreService(
  serviceId: string,
  updates: Partial<Omit<AdminService, 'id' | 'businessId' | 'createdAt'>>
): Promise<void> {
  const docPath = `services/${serviceId}`;

  if (
    updates.name !== undefined ||
    updates.categoryId !== undefined ||
    updates.description !== undefined ||
    updates.price !== undefined ||
    updates.durationMinutes !== undefined
  ) {
    const validation = validateServiceInput({
      name: updates.name ?? 'Serviço',
      categoryId: updates.categoryId ?? 'cabelo',
      description: updates.description,
      price: updates.price ?? 0,
      durationMinutes: updates.durationMinutes ?? 30,
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0] || 'Dados inválidos.';
      throw new Error(firstError);
    }
  }

  if (!isFirebaseConfigured || !db) {
    throw new Error('Operação indisponível. Firebase não configurado no ambiente.');
  }

  assertBrowserOnline('atualizar o serviço');

  try {
    const docRef = doc(db, 'services', serviceId);

    const payload: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.categoryId !== undefined) {
      payload.categoryId = updates.categoryId;
      const categoryDef = DEFAULT_SERVICE_CATEGORIES.find((c) => c.id === updates.categoryId);
      payload.categoryName = categoryDef?.name || updates.categoryId;
    }
    if (updates.categoryName !== undefined && updates.categoryId === undefined) {
      payload.categoryName = updates.categoryName;
    }
    if (updates.description !== undefined) payload.description = updates.description.trim();
    if (updates.price !== undefined) payload.price = Number(updates.price);
    if (updates.durationMinutes !== undefined) payload.durationMinutes = Math.round(Number(updates.durationMinutes));
    if (updates.active !== undefined) payload.active = Boolean(updates.active);

    await awaitFirestoreOperation(updateDoc(docRef, payload), {
      timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
      timeoutMessage:
        'Não foi possível confirmar a atualização do serviço no Firestore (conexão instável ou offline).',
      indeterminateOnTimeout: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
    throw error;
  }
}

/**
 * Toggles a service's active status (soft delete / reactivate) in Cloud Firestore.
 */
export async function toggleFirestoreServiceActive(
  serviceId: string,
  nextActiveState: boolean
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Operação indisponível. Firebase não configurado no ambiente.');
  }

  assertBrowserOnline('alterar o status do serviço');

  const docPath = `services/${serviceId}`;
  try {
    const docRef = doc(db, 'services', serviceId);
    await awaitFirestoreOperation(
      updateDoc(docRef, {
        active: nextActiveState,
        updatedAt: serverTimestamp(),
      }),
      {
        timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
        timeoutMessage: 'Tempo esgotado ao atualizar o status do serviço no Firestore.',
        indeterminateOnTimeout: true,
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
    throw error;
  }
}

/**
 * Transforms active AdminServices into ServiceCategories for the public customer booking flow.
 * Ensures strict deduplication so identical services or options never appear twice.
 */
export function adminServicesToBookingCategories(services: AdminService[]): ServiceCategory[] {
  const activeServices = services.filter((s) => s.active);
  if (activeServices.length === 0) return [];

  // Deduplicate services by document id first, then by signature (category + normalized name + price + duration)
  const uniqueServicesById = new Map<string, AdminService>();
  for (const s of activeServices) {
    if (s.id && !uniqueServicesById.has(s.id)) {
      uniqueServicesById.set(s.id, s);
    }
  }

  const seenSignatures = new Set<string>();
  const deduplicatedServices: AdminService[] = [];
  for (const s of uniqueServicesById.values()) {
    const signature = `${s.categoryId}::${s.name.trim().toLowerCase()}::${s.price}::${s.durationMinutes}`;
    if (!seenSignatures.has(signature)) {
      seenSignatures.add(signature);
      deduplicatedServices.push(s);
    }
  }

  // Group by categoryId
  const categoryGroups = new Map<string, AdminService[]>();
  for (const s of deduplicatedServices) {
    const catId = s.categoryId || 'cabelo';
    const list = categoryGroups.get(catId) || [];
    list.push(s);
    categoryGroups.set(catId, list);
  }

  const result: ServiceCategory[] = [];

  for (const [catId, group] of categoryGroups.entries()) {
    const def = DEFAULT_SERVICE_CATEGORIES.find((c) => c.id === catId);
    const catName = def?.name || group[0]?.categoryName || catId;
    const catDesc = def?.description || group[0]?.description || 'Serviços especializados';
    const iconName = def?.iconName || (catId === 'barba' ? 'Razor' : catId === 'combo' ? 'Sparkles' : 'Scissors');

    // Sort group by price ascending
    const sortedGroup = [...group].sort((a, b) => a.price - b.price);
    const baseService = sortedGroup[0];

    const seenOptionKeys = new Set<string>();
    const options: { id: string; name: string; priceOverride: number; durationOverride: number }[] = [];

    for (const s of sortedGroup) {
      const optionKey = `${s.id}::${s.name.trim().toLowerCase()}`;
      if (!seenOptionKeys.has(optionKey)) {
        seenOptionKeys.add(optionKey);
        options.push({
          id: s.id,
          name: s.name,
          priceOverride: s.price,
          durationOverride: s.durationMinutes,
        });
      }
    }

    result.push({
      id: catId,
      name: catName,
      description: catDesc,
      durationMinutes: baseService.durationMinutes,
      price: baseService.price,
      iconName,
      popular: catId === 'combo',
      options,
    });
  }

  // Sort categories according to the canonical order in DEFAULT_SERVICE_CATEGORIES
  result.sort((a, b) => {
    const indexA = DEFAULT_SERVICE_CATEGORIES.findIndex((c) => c.id === a.id);
    const indexB = DEFAULT_SERVICE_CATEGORIES.findIndex((c) => c.id === b.id);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  return result;
}

