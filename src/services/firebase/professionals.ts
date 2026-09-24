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
import { Barber, BarberStatus, BarberServiceMode } from '../../types/admin';
import { MOCK_BARBERS, DEFAULT_WEEKLY_SCHEDULE } from '../../data/adminMockData';

export const CANONICAL_BUSINESS_ID = 'joao-barber';
const COLLECTION_PATH = 'professionals';

/**
 * Normaliza um snapshot de documento Firestore em um objeto Barber da aplicação.
 */
export function normalizeFirestoreProfessional(docId: string, data: Record<string, any>): Barber {
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

  const rawStatus = data.status || (data.active === false ? 'inactive' : 'active');
  const status: BarberStatus = rawStatus === 'inactive' ? 'inactive' : 'active';
  const active: boolean = typeof data.active === 'boolean' ? data.active : status === 'active';

  return {
    id: docId,
    businessId: data.businessId || CANONICAL_BUSINESS_ID,
    name: data.name || 'Profissional',
    photoUrl: data.photoUrl || '',
    whatsapp: data.whatsapp || '',
    email: data.email || undefined,
    status,
    active,
    serviceMode: (data.serviceMode as BarberServiceMode) || 'all',
    serviceIds: Array.isArray(data.serviceIds) ? data.serviceIds : [],
    serviceConfigs: Array.isArray(data.serviceConfigs) ? data.serviceConfigs : [],
    schedule: Array.isArray(data.schedule) && data.schedule.length > 0 ? data.schedule : DEFAULT_WEEKLY_SCHEDULE,
    createdAt: createdAtStr,
    updatedAt: updatedAtStr,
  };
}

/**
 * Inicializa os profissionais padrão da barbearia caso a coleção esteja vazia no Firestore.
 */
export async function seedInitialProfessionalsIfEmpty(
  businessId = CANONICAL_BUSINESS_ID
): Promise<Barber[]> {
  if (!isFirebaseConfigured || !db) {
    console.info('[Equipe Firestore] seedInitialProfessionalsIfEmpty: Firebase não configurado (Demo Mode). Retornando MOCK_BARBERS.');
    return MOCK_BARBERS;
  }

  try {
    console.info(`[Equipe Firestore] Auto-seed de profissionais para businessId="${businessId}"...`);
    const createdBarbers: Barber[] = [];

    for (const barber of MOCK_BARBERS) {
      const docId = `${businessId}_${barber.id}`;
      const payload = {
        businessId,
        name: barber.name,
        photoUrl: barber.photoUrl,
        whatsapp: barber.whatsapp,
        email: barber.email || '',
        status: barber.status,
        active: barber.status === 'active',
        serviceMode: barber.serviceMode,
        serviceIds: barber.serviceIds || [],
        serviceConfigs: barber.serviceConfigs || [],
        schedule: barber.schedule || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = doc(db, COLLECTION_PATH, docId);
      await setDoc(docRef, payload, { merge: true });

      createdBarbers.push({
        ...barber,
        id: docId,
        businessId,
        active: barber.status === 'active',
      });
    }

    console.info(`[Equipe Firestore] Auto-seed concluído com ${createdBarbers.length} profissionais gravados no Firestore.`);
    return createdBarbers;
  } catch (error) {
    console.warn('[Equipe Firestore] Erro no auto-seed de profissionais:', error);
    return MOCK_BARBERS;
  }
}

/**
 * Busca todos os profissionais cadastrados para a barbearia no Firestore.
 * Em caso de ambiente de demonstração ou ausência de Firebase, retorna o fallback de demonstração.
 */
export async function getFirestoreProfessionals(
  businessId = CANONICAL_BUSINESS_ID
): Promise<Barber[]> {
  console.info(`[Equipe Firestore] getFirestoreProfessionals: consultando coleção "${COLLECTION_PATH}" para businessId="${businessId}" | isFirebaseConfigured=${isFirebaseConfigured}`);

  if (!isFirebaseConfigured || !db) {
    console.warn('[Equipe Firestore] getFirestoreProfessionals: Firebase NÃO configurado (VITE_FIREBASE_API_KEY ausente). Retornando MOCK_BARBERS (Demo Mode).');
    return MOCK_BARBERS;
  }

  try {
    const q = query(
      collection(db, COLLECTION_PATH),
      where('businessId', '==', businessId)
    );

    const snapshot = await getDocs(q);
    console.info(`[Equipe Firestore] getFirestoreProfessionals: consulta retornou ${snapshot.size} documento(s) do Firestore.`);

    if (snapshot.empty) {
      // Se a coleção estiver vazia no Firestore real, popula com os profissionais padrão
      console.info(`[Equipe Firestore] Coleção "${COLLECTION_PATH}" vazia para businessId="${businessId}". Populando auto-seed inicial...`);
      return await seedInitialProfessionalsIfEmpty(businessId);
    }

    const barbers: Barber[] = [];
    snapshot.forEach((docSnap) => {
      barbers.push(normalizeFirestoreProfessional(docSnap.id, docSnap.data()));
    });

    console.info(`[Equipe Firestore] getFirestoreProfessionals: ${barbers.length} profissional(is) normalizado(s) com sucesso.`, barbers.map((b) => ({ id: b.id, name: b.name, status: b.status })));

    // Ordenar ativos primeiro, depois por nome
    return barbers.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error: any) {
    console.error('[Equipe Firestore] Erro ao consultar profissionais no Firestore:', error?.message || error);
    return MOCK_BARBERS;
  }
}

/**
 * Cria um novo profissional no Firestore.
 */
export async function createFirestoreProfessional(
  barberData: Omit<Barber, 'id' | 'createdAt'>
): Promise<Barber> {
  const businessId = barberData.businessId || CANONICAL_BUSINESS_ID;
  const status: BarberStatus = barberData.status || 'active';

  console.info(`[Equipe Firestore] createFirestoreProfessional: iniciando criação para businessId="${businessId}" | isFirebaseConfigured=${isFirebaseConfigured}`);

  if (!isFirebaseConfigured || !db) {
    console.warn('[Equipe Firestore] AVISO CRÍTICO: Firebase NÃO configurado no ambiente (VITE_FIREBASE_API_KEY ausente). Profissional NÃO será salvo no Firestore e não persistirá após reload.');
    return {
      ...barberData,
      id: `barber-${Date.now()}`,
      businessId,
      status,
      active: status === 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const payload = {
      businessId,
      name: barberData.name.trim(),
      photoUrl: barberData.photoUrl || '',
      whatsapp: barberData.whatsapp.trim(),
      email: (barberData.email || '').trim(),
      status,
      active: status === 'active',
      serviceMode: barberData.serviceMode,
      serviceIds: barberData.serviceIds || [],
      serviceConfigs: barberData.serviceConfigs || [],
      schedule: barberData.schedule || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.info(`[Equipe Firestore] Executando addDoc na coleção "${COLLECTION_PATH}"...`, { businessId, name: payload.name });
    const docRef = await addDoc(collection(db, COLLECTION_PATH), payload);
    console.info(`[Equipe Firestore] SUCESSO! Documento gravado no Firestore com ID: "${docRef.id}"`);

    return {
      ...barberData,
      id: docRef.id,
      businessId,
      status,
      active: status === 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('[Equipe Firestore] ERRO no addDoc ao criar profissional no Firestore:', error?.message || error);
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_PATH);
    throw error;
  }
}

/**
 * Atualiza os dados de um profissional existente no Firestore.
 */
export async function updateFirestoreProfessional(
  id: string,
  updates: Partial<Barber>
): Promise<void> {
  console.info(`[Equipe Firestore] updateFirestoreProfessional: ID="${id}" | isFirebaseConfigured=${isFirebaseConfigured}`);

  if (!isFirebaseConfigured || !db) {
    console.warn('[Equipe Firestore] Firebase NÃO configurado. Atualização executada apenas em memória.');
    return;
  }

  try {
    const docRef = doc(db, COLLECTION_PATH, id);
    const payload: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.photoUrl !== undefined) payload.photoUrl = updates.photoUrl;
    if (updates.whatsapp !== undefined) payload.whatsapp = updates.whatsapp.trim();
    if (updates.email !== undefined) payload.email = updates.email.trim();
    if (updates.status !== undefined) {
      payload.status = updates.status;
      payload.active = updates.status === 'active';
    }
    if (updates.serviceMode !== undefined) payload.serviceMode = updates.serviceMode;
    if (updates.serviceIds !== undefined) payload.serviceIds = updates.serviceIds;
    if (updates.serviceConfigs !== undefined) payload.serviceConfigs = updates.serviceConfigs;
    if (updates.schedule !== undefined) payload.schedule = updates.schedule;

    await updateDoc(docRef, payload);
    console.info(`[Equipe Firestore] SUCESSO! Profissional "${id}" atualizado no Firestore.`);
  } catch (error: any) {
    console.error(`[Equipe Firestore] ERRO ao atualizar profissional "${id}" no Firestore:`, error?.message || error);
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_PATH}/${id}`);
    throw error;
  }
}

/**
 * Ativa ou desativa um profissional (Soft Delete).
 */
export async function setProfessionalStatus(
  id: string,
  status: BarberStatus
): Promise<void> {
  console.info(`[Equipe Firestore] setProfessionalStatus: alterando ID="${id}" para status="${status}"`);
  await updateFirestoreProfessional(id, { status });
}
