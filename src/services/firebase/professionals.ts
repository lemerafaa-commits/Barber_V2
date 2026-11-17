import {
  collection,
  setDoc,
  doc,
  getDocs,
  getDocsFromServer,
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
import { Barber, BarberStatus, BarberServiceMode } from '../../types/admin';
import { DEFAULT_WEEKLY_SCHEDULE } from '../../data/adminMockData';

export const CANONICAL_BUSINESS_ID = 'joao-barber';
const COLLECTION_PATH = 'professionals';

/**
 * Gera um identificador único e determinístico para criação idempotente de profissionais.
 */
export function generateProfessionalDraftId(): string {
  if (isFirebaseConfigured && db) {
    return doc(collection(db, COLLECTION_PATH)).id;
  }
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `pro_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
  }
  return `pro_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Valida campos de profissional conforme as Firestore Security Rules.
 */
export function validateProfessionalInput(input: {
  name?: string;
  whatsapp?: string;
  email?: string;
  photoUrl?: string;
  status?: BarberStatus;
  serviceMode?: BarberServiceMode;
}): { isValid: boolean; error?: string } {
  if (input.name !== undefined) {
    const trimmedName = input.name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      return {
        isValid: false,
        error: 'O nome do profissional deve ter entre 1 e 100 caracteres.',
      };
    }
  }

  if (input.whatsapp !== undefined) {
    const trimmedWhatsapp = input.whatsapp.trim();
    if (trimmedWhatsapp.length < 4 || trimmedWhatsapp.length > 30) {
      return {
        isValid: false,
        error: 'O WhatsApp deve ter entre 4 e 30 caracteres.',
      };
    }
  }

  if (input.email !== undefined && input.email.trim().length > 100) {
    return {
      isValid: false,
      error: 'O e-mail não pode ultrapassar 100 caracteres.',
    };
  }

  if (input.photoUrl !== undefined && input.photoUrl.trim().length > 2000) {
    return {
      isValid: false,
      error: 'A URL da foto não pode ultrapassar 2000 caracteres.',
    };
  }

  if (input.status !== undefined && input.status !== 'active' && input.status !== 'inactive') {
    return {
      isValid: false,
      error: 'Status de profissional inválido.',
    };
  }

  if (
    input.serviceMode !== undefined &&
    input.serviceMode !== 'all' &&
    input.serviceMode !== 'custom'
  ) {
    return {
      isValid: false,
      error: 'Modo de serviço inválido.',
    };
  }

  return { isValid: true };
}

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
    businessId: data.businessId || '',
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
 * Desativado (V4_07): Esta rotina não grava mais profissionais mockados no Firestore.
 * Preservada por compatibilidade de assinatura, retornando array vazio sem efeitos colaterais.
 */
export async function seedInitialProfessionalsIfEmpty(
  businessId: string
): Promise<Barber[]> {
  console.info(`[Equipe Firestore] seedInitialProfessionalsIfEmpty desativado (V4_07) para businessId="${businessId}". Nenhum mock gravado.`);
  return [];
}

/**
 * Busca todos os profissionais cadastrados para a barbearia no Firestore.
 * Se a coleção estiver vazia, retorna uma lista vazia sem inserir documentos.
 */
export async function getFirestoreProfessionals(
  businessId: string
): Promise<Barber[]> {
  if (!isFirebaseConfigured || !db) {
    console.warn('[Equipe Firestore] getFirestoreProfessionals: Firebase NÃO configurado. Retornando lista vazia.');
    return [];
  }

  const cleanBusinessId = typeof businessId === 'string' ? businessId.trim() : '';
  if (!cleanBusinessId) {
    throw new Error('Identificador da barbearia (businessId) ausente na sessão administrativa.');
  }

  try {
    assertBrowserOnline('consultar a equipe de profissionais');

    const q = query(
      collection(db, COLLECTION_PATH),
      where('businessId', '==', cleanBusinessId)
    );

    const snapshot = await awaitFirestoreOperation(getDocs(q), {
      timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
      timeoutMessage: 'Tempo esgotado ao carregar a equipe do Firestore. Verifique sua conexão.',
      indeterminateOnTimeout: false,
    });

    if (snapshot.empty) {
      return [];
    }

    const barbersMap = new Map<string, Barber>();
    snapshot.forEach((docSnap) => {
      if (!barbersMap.has(docSnap.id)) {
        barbersMap.set(docSnap.id, normalizeFirestoreProfessional(docSnap.id, docSnap.data()));
      }
    });

    const barbers = Array.from(barbersMap.values());

    // Ordenar ativos primeiro, depois por nome
    return barbers.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error: any) {
    console.error('[Equipe Firestore] Erro ao consultar profissionais no Firestore:', error?.message || error);
    throw error;
  }
}

/**
 * Remove campos 'undefined' recursivamente para garantir compatibilidade com o Firestore SDK.
 */
function sanitizePayloadForFirestore(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        item && typeof item === 'object' && !(item instanceof Date)
          ? sanitizePayloadForFirestore(item)
          : item
      );
    } else if (
      value &&
      typeof value === 'object' &&
      !(value instanceof Date) &&
      !('_methodName' in value)
    ) {
      sanitized[key] = sanitizePayloadForFirestore(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Cria um novo profissional no Firestore de forma idempotente (ID fixo por tentativa),
 * protegendo contra timeout/offline e evitando duplicidade em retries.
 */
export async function createFirestoreProfessional(
  barberData: Omit<Barber, 'id' | 'createdAt'>,
  options?: {
    idempotencyId?: string;
    wasIndeterminate?: boolean;
  }
): Promise<Barber> {
  const cleanBusinessId = typeof barberData.businessId === 'string' ? barberData.businessId.trim() : '';
  if (!cleanBusinessId) {
    throw new Error('Identificador da barbearia (businessId) ausente na sessão administrativa.');
  }

  const status: BarberStatus = barberData.status || 'active';

  const validation = validateProfessionalInput({
    name: barberData.name,
    whatsapp: barberData.whatsapp,
    email: barberData.email,
    photoUrl: barberData.photoUrl,
    status,
    serviceMode: barberData.serviceMode,
  });

  if (!validation.isValid) {
    throw new Error(validation.error || 'Dados do profissional inválidos.');
  }

  if (!isFirebaseConfigured || !db) {
    throw new Error('Operação indisponível. Firebase não configurado no ambiente.');
  }

  assertBrowserOnline('salvar o profissional');

  const targetId =
    typeof options?.idempotencyId === 'string' && options.idempotencyId.trim().length > 0
      ? options.idempotencyId.trim()
      : generateProfessionalDraftId();
  const docRef = doc(db, COLLECTION_PATH, targetId);

  try {
    const trimmedName = barberData.name.trim();
    const trimmedWhatsapp = barberData.whatsapp.trim();
    const trimmedEmail = (barberData.email || '').trim();
    const trimmedPhotoUrl = (barberData.photoUrl || '').trim();

    // Em retry após erro indeterminado, verifica no servidor via query multi-tenant (evita permission-denied
    // de getDoc em documento inexistente sob regra resource.data.businessId) para preservar createdAt.
    if (options?.wasIndeterminate) {
      let existingSnapshot;
      try {
        const checkQuery = query(
          collection(db, COLLECTION_PATH),
          where('businessId', '==', cleanBusinessId)
        );
        existingSnapshot = await awaitFirestoreOperation(getDocsFromServer(checkQuery), {
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

      const existingDoc = existingSnapshot.docs.find((d) => d.id === targetId);
      if (existingDoc) {
        const existingNormalized = normalizeFirestoreProfessional(existingDoc.id, existingDoc.data());
        const updatePayload = sanitizePayloadForFirestore({
          name: trimmedName,
          photoUrl: trimmedPhotoUrl,
          whatsapp: trimmedWhatsapp,
          email: trimmedEmail,
          status,
          active: status === 'active',
          serviceMode: barberData.serviceMode,
          serviceIds: barberData.serviceIds || [],
          serviceConfigs: barberData.serviceConfigs || [],
          schedule: barberData.schedule || [],
          updatedAt: serverTimestamp(),
        });

        await awaitFirestoreOperation(updateDoc(docRef, updatePayload), {
          timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
          timeoutMessage:
            'O profissional já existe no servidor, mas a atualização dos detalhes não recebeu confirmação a tempo.',
          indeterminateOnTimeout: true,
        });

        return {
          ...existingNormalized,
          name: trimmedName,
          photoUrl: trimmedPhotoUrl,
          whatsapp: trimmedWhatsapp,
          email: trimmedEmail || undefined,
          status,
          active: status === 'active',
          serviceMode: barberData.serviceMode,
          serviceIds: barberData.serviceIds || [],
          serviceConfigs: barberData.serviceConfigs || [],
          schedule: barberData.schedule || [],
          updatedAt: new Date().toISOString(),
        };
      }
    }

    const rawPayload = {
      businessId: cleanBusinessId,
      name: trimmedName,
      photoUrl: trimmedPhotoUrl,
      whatsapp: trimmedWhatsapp,
      email: trimmedEmail,
      status,
      active: status === 'active',
      serviceMode: barberData.serviceMode,
      serviceIds: barberData.serviceIds || [],
      serviceConfigs: barberData.serviceConfigs || [],
      schedule: barberData.schedule || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const payload = sanitizePayloadForFirestore(rawPayload);

    await awaitFirestoreOperation(setDoc(docRef, payload), {
      timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
      timeoutMessage:
        'Não foi possível confirmar o salvamento junto ao Firestore (conexão instável ou offline). O identificador desta tentativa foi preservado para retry seguro.',
      indeterminateOnTimeout: true,
    });

    return {
      ...barberData,
      id: docRef.id,
      businessId: cleanBusinessId,
      name: trimmedName,
      photoUrl: trimmedPhotoUrl,
      whatsapp: trimmedWhatsapp,
      email: trimmedEmail || undefined,
      status,
      active: status === 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('[Equipe Firestore] CREATE ERROR', {
      code: error?.code || 'unknown',
      message: error?.message || String(error),
      operation: 'create',
      path: `${COLLECTION_PATH}/${targetId}`,
    });
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_PATH}/${targetId}`);
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
  const cleanId = typeof id === 'string' ? id.trim() : '';
  if (!cleanId) {
    throw new Error('Identificador do profissional inválido.');
  }

  const validation = validateProfessionalInput({
    name: updates.name,
    whatsapp: updates.whatsapp,
    email: updates.email,
    photoUrl: updates.photoUrl,
    status: updates.status,
    serviceMode: updates.serviceMode,
  });

  if (!validation.isValid) {
    throw new Error(validation.error || 'Dados inválidos para atualização do profissional.');
  }

  if (!isFirebaseConfigured || !db) {
    throw new Error('Operação indisponível. Firebase não configurado no ambiente.');
  }

  assertBrowserOnline('atualizar o profissional');

  try {
    const docRef = doc(db, COLLECTION_PATH, cleanId);
    const payload: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.photoUrl !== undefined) payload.photoUrl = updates.photoUrl.trim();
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

    const cleanPayload = sanitizePayloadForFirestore(payload);
    await awaitFirestoreOperation(updateDoc(docRef, cleanPayload), {
      timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
      timeoutMessage:
        'Não foi possível confirmar a atualização do profissional no Firestore (conexão instável ou offline).',
      indeterminateOnTimeout: true,
    });
  } catch (error: any) {
    console.error(`[Equipe Firestore] ERRO ao atualizar profissional "${cleanId}" no Firestore:`, error?.message || error);
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_PATH}/${cleanId}`);
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
  await updateFirestoreProfessional(id, { status });
}
