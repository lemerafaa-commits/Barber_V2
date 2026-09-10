import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { BusinessProfile } from '../../types/businessProfile';

export const CANONICAL_BUSINESS_ID = 'joao-barber';

/**
 * Standard default fallback business profile in case the document does not exist yet.
 */
export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  businessId: CANONICAL_BUSINESS_ID,
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
    return { ...DEFAULT_BUSINESS_PROFILE, businessId: fallbackBusinessId };
  }

  return {
    businessId: data.businessId || fallbackBusinessId,
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

/**
 * Fetches the BusinessProfile from Firestore (businesses/{businessId}).
 * Returns DEFAULT_BUSINESS_PROFILE as fallback if the document does not exist or in case of error.
 */
export async function getFirestoreBusinessProfile(
  businessId = CANONICAL_BUSINESS_ID
): Promise<BusinessProfile> {
  const docPath = `businesses/${businessId}`;
  try {
    const docRef = doc(db, 'businesses', businessId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return normalizeBusinessProfile(docSnap.data(), businessId);
    }

    // Document does not exist yet: return fallback profile
    return {
      ...DEFAULT_BUSINESS_PROFILE,
      businessId,
    };
  } catch (error) {
    console.warn('[Firestore] Perfil da barbearia inacessível (regras ou conexão). Retornando perfil padrão.', error);
    // Return resilient fallback if offline or unexpected network error
    return {
      ...DEFAULT_BUSINESS_PROFILE,
      businessId,
    };
  }
}

/**
 * Saves/Updates the BusinessProfile document in Firestore (businesses/{businessId}) with partial merge.
 */
export async function saveFirestoreBusinessProfile(
  businessId = CANONICAL_BUSINESS_ID,
  updates: Partial<BusinessProfile>
): Promise<BusinessProfile> {
  const docPath = `businesses/${businessId}`;
  try {
    const cleanUpdates: Record<string, any> = {
      businessId,
      updatedAt: serverTimestamp(),
    };

    if (updates.name !== undefined) cleanUpdates.name = updates.name;
    if (updates.description !== undefined) cleanUpdates.description = updates.description;
    if (updates.logoUrl !== undefined) cleanUpdates.logoUrl = updates.logoUrl;
    if (updates.whatsapp !== undefined) cleanUpdates.whatsapp = updates.whatsapp;
    if (updates.instagram !== undefined) cleanUpdates.instagram = updates.instagram;
    if (updates.address !== undefined) cleanUpdates.address = updates.address;
    if (updates.openingHours !== undefined) cleanUpdates.openingHours = updates.openingHours;

    const docRef = doc(db, 'businesses', businessId);
    await setDoc(docRef, cleanUpdates, { merge: true });

    // Fetch the updated complete state to ensure synchronization
    const updatedSnap = await getDoc(docRef);
    if (updatedSnap.exists()) {
      return normalizeBusinessProfile(updatedSnap.data(), businessId);
    }

    return {
      ...DEFAULT_BUSINESS_PROFILE,
      ...updates,
      businessId,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
    throw error;
  }
}
