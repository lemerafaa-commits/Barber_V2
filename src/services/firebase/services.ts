import {
  collection,
  addDoc,
  setDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isFirebaseConfigured } from './config';
import { AdminService, ServiceCategoryId } from '../../types/admin';
import { ServiceCategory } from '../../types/booking';
import {
  DEFAULT_BUSINESS_ID,
  DEFAULT_SERVICE_CATEGORIES,
  INITIAL_ADMIN_SERVICES,
  validateServiceInput,
} from '../adminServiceDomain';

export const CANONICAL_BUSINESS_ID = 'joao-barber';

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
    businessId: data.businessId || CANONICAL_BUSINESS_ID,
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
  businessId = CANONICAL_BUSINESS_ID
): Promise<AdminService[]> {
  if (!isFirebaseConfigured || !db) {
    return [];
  }

  const collectionPath = 'services';
  try {
    const createdServices: AdminService[] = [];

    for (const service of INITIAL_ADMIN_SERVICES) {
      const docId = `${businessId}_${service.id}`;
      const payload = {
        businessId,
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
        businessId,
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
  businessId = CANONICAL_BUSINESS_ID
): Promise<AdminService[]> {
  if (!isFirebaseConfigured || !db) {
    return [];
  }

  const collectionPath = 'services';
  try {
    const q = query(
      collection(db, collectionPath),
      where('businessId', '==', businessId)
    );
    const querySnapshot = await getDocs(q);

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
    console.warn('[Firestore] Consulta de serviços inacessível (regras ou conexão). Utilizando catálogo local.', error);
    return [];
  }
}

/**
 * Creates a new service in Cloud Firestore.
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
  businessId = CANONICAL_BUSINESS_ID
): Promise<AdminService> {
  const collectionPath = 'services';

  const validation = validateServiceInput({
    name: serviceData.name,
    categoryId: serviceData.categoryId,
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

  try {
    const categoryDef = DEFAULT_SERVICE_CATEGORIES.find((c) => c.id === serviceData.categoryId);
    const categoryName = categoryDef?.name || serviceData.categoryId;

    const payload = {
      businessId,
      name: serviceData.name.trim(),
      categoryId: serviceData.categoryId,
      categoryName,
      description: serviceData.description ? serviceData.description.trim() : '',
      price: Number(serviceData.price),
      durationMinutes: Math.round(Number(serviceData.durationMinutes)),
      active: serviceData.active !== undefined ? serviceData.active : true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, collectionPath), payload);

    return {
      id: docRef.id,
      businessId,
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
    handleFirestoreError(error, OperationType.CREATE, collectionPath);
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

  if (updates.name !== undefined || updates.categoryId !== undefined || updates.price !== undefined || updates.durationMinutes !== undefined) {
    const validation = validateServiceInput({
      name: updates.name ?? 'Serviço',
      categoryId: updates.categoryId ?? 'cabelo',
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

    await updateDoc(docRef, payload);
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

  const docPath = `services/${serviceId}`;
  try {
    const docRef = doc(db, 'services', serviceId);
    await updateDoc(docRef, {
      active: nextActiveState,
      updatedAt: serverTimestamp(),
    });
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

