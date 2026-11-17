import {
  doc,
  getDoc,
  setDoc,
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
} from './config';
import { BusinessProfile } from '../../types/businessProfile';

export const CANONICAL_BUSINESS_ID = 'joao-barber';

/**
 * Standard default fallback business profile in case the document does not exist yet.
 */
export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  businessId: CANONICAL_BUSINESS_ID,
  slug: CANONICAL_BUSINESS_ID,
  name: 'Barbearia',
  description: 'Estilo, precisão e cuidado em cada corte.',
  logoUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200&auto=format&fit=crop&q=80',
  whatsapp: '(15) 99999-9999',
  instagram: '@barbearia',
  address: {
    street: 'Rua Exemplo',
    number: '123',
    neighborhood: 'Centro',
    city: 'Poços de Caldas',
    state: 'MG',
  },
  openingHours: {
    monday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
    wednesday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
    thursday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
    friday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
    saturday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
    sunday: { isOpen: false, openTime: '09:00', closeTime: '13:00' },
  },
};

/**
 * Normalizes Firestore document data into a valid, complete BusinessProfile.
 */
export function normalizeBusinessProfile(
  data: Record<string, any> | undefined,
  fallbackBusinessId = CANONICAL_BUSINESS_ID
): BusinessProfile {
  if (!data) {
    return { ...DEFAULT_BUSINESS_PROFILE, businessId: fallbackBusinessId, slug: fallbackBusinessId };
  }

  return {
    businessId: data.businessId || fallbackBusinessId,
    slug: typeof data.slug === 'string' && data.slug.trim().length > 0 ? data.slug.trim() : (data.businessId || fallbackBusinessId),
    name: typeof data.name === 'string' && data.name.trim().length > 0 ? data.name : DEFAULT_BUSINESS_PROFILE.name,
    description: typeof data.description === 'string' ? data.description : DEFAULT_BUSINESS_PROFILE.description,
    logoUrl: typeof data.logoUrl === 'string' && data.logoUrl.trim().length > 0 ? data.logoUrl : DEFAULT_BUSINESS_PROFILE.logoUrl,
    whatsapp: typeof data.whatsapp === 'string' ? data.whatsapp : DEFAULT_BUSINESS_PROFILE.whatsapp,
    instagram: typeof data.instagram === 'string' ? data.instagram : DEFAULT_BUSINESS_PROFILE.instagram,
    address: {
      street: data.address?.street ?? DEFAULT_BUSINESS_PROFILE.address.street,
      number: data.address?.number ?? DEFAULT_BUSINESS_PROFILE.address.number,
      neighborhood: data.address?.neighborhood ?? DEFAULT_BUSINESS_PROFILE.address.neighborhood,
      city: data.address?.city ?? DEFAULT_BUSINESS_PROFILE.address.city,
      state: data.address?.state ?? DEFAULT_BUSINESS_PROFILE.address.state,
    },
    openingHours: {
      monday: {
        isOpen: data.openingHours?.monday?.isOpen ?? DEFAULT_BUSINESS_PROFILE.openingHours.monday.isOpen,
        openTime: data.openingHours?.monday?.openTime ?? DEFAULT_BUSINESS_PROFILE.openingHours.monday.openTime,
        closeTime: data.openingHours?.monday?.closeTime ?? DEFAULT_BUSINESS_PROFILE.openingHours.monday.closeTime,
      },
      tuesday: {
        isOpen: data.openingHours?.tuesday?.isOpen ?? DEFAULT_BUSINESS_PROFILE.openingHours.tuesday.isOpen,
        openTime: data.openingHours?.tuesday?.openTime ?? DEFAULT_BUSINESS_PROFILE.openingHours.tuesday.openTime,
        closeTime: data.openingHours?.tuesday?.closeTime ?? DEFAULT_BUSINESS_PROFILE.openingHours.tuesday.closeTime,
      },
      wednesday: {
        isOpen: data.openingHours?.wednesday?.isOpen ?? DEFAULT_BUSINESS_PROFILE.openingHours.wednesday.isOpen,
        openTime: data.openingHours?.wednesday?.openTime ?? DEFAULT_BUSINESS_PROFILE.openingHours.wednesday.openTime,
        closeTime: data.openingHours?.wednesday?.closeTime ?? DEFAULT_BUSINESS_PROFILE.openingHours.wednesday.closeTime,
      },
      thursday: {
        isOpen: data.openingHours?.thursday?.isOpen ?? DEFAULT_BUSINESS_PROFILE.openingHours.thursday.isOpen,
        openTime: data.openingHours?.thursday?.openTime ?? DEFAULT_BUSINESS_PROFILE.openingHours.thursday.openTime,
        closeTime: data.openingHours?.thursday?.closeTime ?? DEFAULT_BUSINESS_PROFILE.openingHours.thursday.closeTime,
      },
      friday: {
        isOpen: data.openingHours?.friday?.isOpen ?? DEFAULT_BUSINESS_PROFILE.openingHours.friday.isOpen,
        openTime: data.openingHours?.friday?.openTime ?? DEFAULT_BUSINESS_PROFILE.openingHours.friday.openTime,
        closeTime: data.openingHours?.friday?.closeTime ?? DEFAULT_BUSINESS_PROFILE.openingHours.friday.closeTime,
      },
      saturday: {
        isOpen: data.openingHours?.saturday?.isOpen ?? DEFAULT_BUSINESS_PROFILE.openingHours.saturday.isOpen,
        openTime: data.openingHours?.saturday?.openTime ?? DEFAULT_BUSINESS_PROFILE.openingHours.saturday.openTime,
        closeTime: data.openingHours?.saturday?.closeTime ?? DEFAULT_BUSINESS_PROFILE.openingHours.saturday.closeTime,
      },
      sunday: {
        isOpen: data.openingHours?.sunday?.isOpen ?? DEFAULT_BUSINESS_PROFILE.openingHours.sunday.isOpen,
        openTime: data.openingHours?.sunday?.openTime ?? DEFAULT_BUSINESS_PROFILE.openingHours.sunday.openTime,
        closeTime: data.openingHours?.sunday?.closeTime ?? DEFAULT_BUSINESS_PROFILE.openingHours.sunday.closeTime,
      },
    },
    updatedAt: data.updatedAt,
  };
}

function validateBusinessProfileUpdates(updates: Partial<BusinessProfile>): void {
  if (updates.name !== undefined && updates.name.trim().length > 100) {
    throw new Error('O nome da barbearia não pode ultrapassar 100 caracteres.');
  }
  if (updates.description !== undefined && updates.description.trim().length > 500) {
    throw new Error('A descrição não pode ultrapassar 500 caracteres.');
  }
  if (updates.logoUrl !== undefined && updates.logoUrl.trim().length > 1000) {
    throw new Error('A URL do logotipo não pode ultrapassar 1000 caracteres.');
  }
  if (updates.whatsapp !== undefined && updates.whatsapp.trim().length > 30) {
    throw new Error('O WhatsApp não pode ultrapassar 30 caracteres.');
  }
  if (updates.instagram !== undefined && updates.instagram.trim().length > 60) {
    throw new Error('O Instagram não pode ultrapassar 60 caracteres.');
  }
}

/**
 * Fetches the BusinessProfile from Firestore (businesses/{businessId}).
 * Returns DEFAULT_BUSINESS_PROFILE ONLY when the document legitimately does not exist yet
 * or when Firebase is disabled in preview mode. Propagates connection/permission errors.
 */
export async function getFirestoreBusinessProfile(
  businessId = CANONICAL_BUSINESS_ID
): Promise<BusinessProfile> {
  const cleanBusinessId = typeof businessId === 'string' ? businessId.trim() : '';

  if (!isFirebaseConfigured || !db) {
    const demoId = cleanBusinessId || CANONICAL_BUSINESS_ID;
    return {
      ...DEFAULT_BUSINESS_PROFILE,
      businessId: demoId,
      slug: demoId,
    };
  }

  if (!cleanBusinessId) {
    throw new Error('Identificador da barbearia (businessId) ausente para carregar o perfil.');
  }

  const docPath = `businesses/${cleanBusinessId}`;
  try {
    assertBrowserOnline('carregar o perfil da barbearia');
    const docRef = doc(db, 'businesses', cleanBusinessId);
    const docSnap = await awaitFirestoreOperation(getDoc(docRef), {
      timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
      timeoutMessage:
        'Tempo esgotado ao carregar o perfil da barbearia no Firestore. Verifique sua conexão.',
      indeterminateOnTimeout: false,
    });

    if (docSnap.exists()) {
      return normalizeBusinessProfile(docSnap.data(), cleanBusinessId);
    }

    // Documento legítimo ainda não criado: retorna estrutura padrão vinculada ao tenant real
    return {
      ...DEFAULT_BUSINESS_PROFILE,
      businessId: cleanBusinessId,
      slug: cleanBusinessId,
    };
  } catch (error) {
    console.warn('[Firestore] Falha ao carregar perfil da barbearia:', error);
    handleFirestoreError(error, OperationType.GET, docPath);
    throw error;
  }
}

/**
 * Saves/Updates the BusinessProfile document in Firestore (businesses/{businessId}) with partial merge.
 * Avoids redundant read-after-write getDoc so slow/intermittent reads cannot mask a confirmed write.
 */
export async function saveFirestoreBusinessProfile(
  businessId: string,
  updates: Partial<BusinessProfile>,
  currentProfile?: BusinessProfile
): Promise<BusinessProfile> {
  const cleanBusinessId = typeof businessId === 'string' ? businessId.trim() : '';

  validateBusinessProfileUpdates(updates);

  const baseProfile = currentProfile || {
    ...DEFAULT_BUSINESS_PROFILE,
    businessId: cleanBusinessId || CANONICAL_BUSINESS_ID,
    slug: cleanBusinessId || CANONICAL_BUSINESS_ID,
  };

  if (!isFirebaseConfigured || !db) {
    const demoId = cleanBusinessId || CANONICAL_BUSINESS_ID;
    return {
      ...baseProfile,
      ...updates,
      businessId: demoId,
      slug: updates.slug ?? baseProfile.slug ?? demoId,
      address: updates.address ? { ...baseProfile.address, ...updates.address } : baseProfile.address,
      openingHours: updates.openingHours
        ? { ...baseProfile.openingHours, ...updates.openingHours }
        : baseProfile.openingHours,
    };
  }

  if (!cleanBusinessId) {
    throw new Error('Identificador da barbearia (businessId) ausente na sessão administrativa.');
  }

  assertBrowserOnline('salvar alterações do perfil da barbearia');

  const docPath = `businesses/${cleanBusinessId}`;
  try {
    const cleanUpdates: Record<string, any> = {
      businessId: cleanBusinessId,
      updatedAt: serverTimestamp(),
    };

    if (updates.slug !== undefined) cleanUpdates.slug = updates.slug.trim();
    if (updates.name !== undefined) cleanUpdates.name = updates.name.trim();
    if (updates.description !== undefined) cleanUpdates.description = updates.description.trim();
    if (updates.logoUrl !== undefined) cleanUpdates.logoUrl = updates.logoUrl.trim();
    if (updates.whatsapp !== undefined) cleanUpdates.whatsapp = updates.whatsapp.trim();
    if (updates.instagram !== undefined) cleanUpdates.instagram = updates.instagram.trim();
    if (updates.address !== undefined) cleanUpdates.address = updates.address;
    if (updates.openingHours !== undefined) cleanUpdates.openingHours = updates.openingHours;

    const docRef = doc(db, 'businesses', cleanBusinessId);
    await awaitFirestoreOperation(setDoc(docRef, cleanUpdates, { merge: true }), {
      timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
      timeoutMessage:
        'Não foi possível confirmar o salvamento do perfil no Firestore (conexão instável ou offline).',
      indeterminateOnTimeout: true,
    });

    return {
      ...baseProfile,
      ...updates,
      businessId: cleanBusinessId,
      slug: updates.slug ?? baseProfile.slug ?? cleanBusinessId,
      address: updates.address ? { ...baseProfile.address, ...updates.address } : baseProfile.address,
      openingHours: updates.openingHours
        ? { ...baseProfile.openingHours, ...updates.openingHours }
        : baseProfile.openingHours,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
    throw error;
  }
}
