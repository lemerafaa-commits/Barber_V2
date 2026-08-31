import { BusinessProfile } from '../types/businessProfile';
import { Barbershop } from '../types/booking';
import {
  CANONICAL_BUSINESS_ID,
  DEFAULT_BUSINESS_PROFILE,
  getFirestoreBusinessProfile,
  saveFirestoreBusinessProfile,
} from './firebase/businessProfile';

export { DEFAULT_BUSINESS_PROFILE, CANONICAL_BUSINESS_ID };

/**
 * Domain Service: Load Business Profile from Firestore.
 * Fallback to DEFAULT_BUSINESS_PROFILE if document does not exist yet.
 */
export async function loadBusinessProfile(
  businessId = CANONICAL_BUSINESS_ID
): Promise<BusinessProfile> {
  return await getFirestoreBusinessProfile(businessId);
}

/**
 * Domain Service: Save / Update Business Profile in Firestore.
 * Performs partial merge without overwriting untouched fields.
 */
export async function saveBusinessProfile(
  updates: Partial<BusinessProfile>,
  businessId = CANONICAL_BUSINESS_ID
): Promise<{ success: boolean; message: string; data: BusinessProfile }> {
  try {
    const updatedProfile = await saveFirestoreBusinessProfile(businessId, updates);
    return {
      success: true,
      message: 'Alterações salvas com sucesso no Firestore.',
      data: updatedProfile,
    };
  } catch (err) {
    console.error('Erro ao salvar BusinessProfile no Firestore:', err);
    throw err;
  }
}

/**
 * Formats weekly opening hours into a concise readable string for display in UI headers/footers.
 */
export function formatOpeningHoursSummary(hours?: BusinessProfile['openingHours']): string {
  if (!hours) return 'Terça a Sábado: 09:00 às 19:00';

  const daysList: Array<{ key: keyof typeof hours; short: string }> = [
    { key: 'monday', short: 'Seg' },
    { key: 'tuesday', short: 'Ter' },
    { key: 'wednesday', short: 'Qua' },
    { key: 'thursday', short: 'Qui' },
    { key: 'friday', short: 'Sex' },
    { key: 'saturday', short: 'Sáb' },
    { key: 'sunday', short: 'Dom' },
  ];

  const openDays = daysList.filter((d) => hours[d.key]?.isOpen);
  if (openDays.length === 0) return 'Temporariamente fechado';

  const firstDay = hours[openDays[0].key];
  const allSameHours = openDays.every(
    (d) =>
      hours[d.key]?.openTime === firstDay.openTime &&
      hours[d.key]?.closeTime === firstDay.closeTime
  );

  if (allSameHours) {
    if (openDays.length === 7) {
      return `Todos os dias: ${firstDay.openTime} às ${firstDay.closeTime}`;
    }
    return `${openDays[0].short} a ${openDays[openDays.length - 1].short}: ${firstDay.openTime} às ${firstDay.closeTime}`;
  }

  const weekdayOpen = openDays.filter((d) => d.key !== 'saturday' && d.key !== 'sunday');
  const sat = hours.saturday;
  if (weekdayOpen.length > 0) {
    const wFirst = hours[weekdayOpen[0].key];
    const wLast = weekdayOpen[weekdayOpen.length - 1];
    let res = `${weekdayOpen[0].short} a ${wLast.short}: ${wFirst.openTime} às ${wFirst.closeTime}`;
    if (sat?.isOpen) {
      res += ` • Sáb: ${sat.openTime} às ${sat.closeTime}`;
    }
    return res;
  }

  return `${openDays.map((d) => d.short).join(', ')}: ${firstDay.openTime} às ${firstDay.closeTime}`;
}

/**
 * Adapter function to convert a Firestore BusinessProfile to the Barbershop interface
 * used by the public booking header, footer and modals.
 */
export function businessProfileToBarbershop(
  profile: BusinessProfile,
  businessId = CANONICAL_BUSINESS_ID
): Barbershop {
  const cleanPhone = (profile.whatsapp || '').replace(/\D/g, '');
  const whatsappUrl = cleanPhone.length > 0
    ? `https://wa.me/55${cleanPhone.startsWith('55') ? cleanPhone.slice(2) : cleanPhone}`
    : 'https://wa.me/5515999999999';

  const rawInstagram = profile.instagram || '@barbearia';
  const instagramHandle = rawInstagram.startsWith('@')
    ? rawInstagram
    : rawInstagram.includes('instagram.com/')
      ? `@${rawInstagram.split('instagram.com/')[1].replace(/\//g, '')}`
      : `@${rawInstagram}`;

  const instagramUrl = rawInstagram.startsWith('http')
    ? rawInstagram
    : `https://instagram.com/${instagramHandle.replace('@', '')}`;

  const streetPart = profile.address?.street || 'Rua Exemplo';
  const numberPart = profile.address?.number ? `, ${profile.address.number}` : '';
  const neighborhoodPart = profile.address?.neighborhood ? ` - ${profile.address.neighborhood}` : '';
  const formattedAddress = `${streetPart}${numberPart}${neighborhoodPart}`;

  return {
    id: businessId,
    name: profile.name || 'Barbearia',
    tagline: profile.description ? (profile.description.length > 50 ? profile.description.slice(0, 47) + '...' : profile.description) : 'Estilo, precisão e cuidado em cada corte.',
    description: profile.description || 'Estilo, precisão e cuidado em cada corte.',
    address: formattedAddress,
    city: profile.address?.city || 'Poços de Caldas',
    state: profile.address?.state || 'MG',
    instagramHandle,
    instagramUrl,
    whatsappNumber: profile.whatsapp || '(15) 99999-9999',
    whatsappUrl,
    logoUrl: profile.logoUrl || DEFAULT_BUSINESS_PROFILE.logoUrl,
    coverUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewCount: 128,
    openingHoursText: formatOpeningHoursSummary(profile.openingHours),
  };
}

