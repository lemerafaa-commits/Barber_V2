import {
  collection,
  serverTimestamp,
  getDocs,
  query,
  where,
  doc,
  writeBatch
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, isFirebaseConfigured } from './config';
import { Service } from '../../types/booking';
import { AdminAppointment, AdminServiceItem, AppointmentStatus } from '../../types/admin';

export interface FirestoreServiceItem {
  categoryId: string;
  categoryName: string;
  optionId: string;
  optionName: string;
  price: number;
  duration: number;
}

export interface FirestoreAppointmentInput {
  businessId?: string;
  customerName: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  services: Service[];
  whatsappOptIn?: boolean;
  professionalId?: string;
  professionalName?: string;
}

export interface FirestoreAppointmentRecord {
  id: string;
  businessId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  services: FirestoreServiceItem[];
  totalPrice: number;
  duration: number;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  createdAt: any;
  whatsappOptIn?: boolean;
  professionalId?: string;
  professionalName?: string;
}

/**
 * Converts a raw Firestore appointment document/record into the AdminAppointment format
 * utilized by the admin dashboard and domain functions.
 */
export function firestoreToAdminAppointment(
  docId: string,
  data: Record<string, any>
): AdminAppointment {
  const rawServices = Array.isArray(data.services) ? data.services : [];
  const normalizedServices: AdminServiceItem[] = rawServices.map((s: any) => ({
    category: s.categoryName || s.category || 'Serviço',
    option: s.optionName || s.option || undefined,
    price: typeof s.price === 'number' ? s.price : Number(s.price) || 0,
  }));

  // Resolve createdAt timestamp safely without throwing
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

  const validStatuses: AppointmentStatus[] = ['confirmed', 'in_progress', 'completed', 'cancelled'];
  const status: AppointmentStatus = validStatuses.includes(data.status) ? data.status : 'confirmed';

  const cleanProfessionalId =
    typeof data.professionalId === 'string' && data.professionalId.trim().length > 0
      ? data.professionalId.trim()
      : undefined;

  const cleanProfessionalName =
    typeof data.professionalName === 'string' && data.professionalName.trim().length > 0
      ? data.professionalName.trim()
      : undefined;

  return {
    id: docId,
    businessId: data.businessId || 'joao-barber',
    ...(cleanProfessionalId ? { professionalId: cleanProfessionalId } : {}),
    ...(cleanProfessionalName ? { professionalName: cleanProfessionalName } : {}),
    customerName: data.customerName || 'Cliente',
    customerPhone: data.customerPhone || '',
    date: data.date || '',
    time: data.time || '00:00',
    services: normalizedServices,
    totalPrice: typeof data.totalPrice === 'number' ? data.totalPrice : Number(data.totalPrice) || 0,
    duration: typeof data.duration === 'number' ? data.duration : Number(data.duration) || 30,
    status,
    createdAt: createdAtStr,
  };
}

/**
 * Creates a new appointment record in Cloud Firestore ('appointments' collection)
 * and synchronously provisions an anonymous schedule block in 'busy_slots'
 * (zero PII exposure for public availability queries).
 */
export async function createFirestoreAppointment(
  input: FirestoreAppointmentInput
): Promise<FirestoreAppointmentRecord> {
  const collectionPath = 'appointments';
  const businessId = input.businessId || 'joao-barber';

  // Format services array with category and option details
  const formattedServices: FirestoreServiceItem[] = input.services.map((s) => {
    const optionName = s.selectedOption || 'Padrão';
    const optionId = optionName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-');

    return {
      categoryId: s.categoryId || s.id,
      categoryName: s.name,
      optionId,
      optionName,
      price: Number(s.price),
      duration: Number(s.durationMinutes),
    };
  });

  // Calculate total price and total duration from selected services
  const totalPrice = formattedServices.reduce((acc, s) => acc + s.price, 0);
  const duration = formattedServices.reduce((acc, s) => acc + s.duration, 0);

  const cleanProfessionalId =
    typeof input.professionalId === 'string' && input.professionalId.trim().length > 0
      ? input.professionalId.trim()
      : undefined;

  const cleanProfessionalName =
    typeof input.professionalName === 'string' && input.professionalName.trim().length > 0
      ? input.professionalName.trim()
      : undefined;

  const baseDocPayload = {
    businessId,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    date: input.date,
    time: input.time,
    services: formattedServices,
    totalPrice,
    duration,
    status: 'confirmed' as const,
    createdAt: serverTimestamp(),
    whatsappOptIn: input.whatsappOptIn === true,
  };

  const docPayload: Record<string, any> = {
    ...baseDocPayload,
  };

  if (cleanProfessionalId) {
    docPayload.professionalId = cleanProfessionalId;
  }
  if (cleanProfessionalName) {
    docPayload.professionalName = cleanProfessionalName;
  }

  if (!isFirebaseConfigured || !db) {
    const mockId = 'preview-' + Math.random().toString(36).substring(2, 9);
    return {
      id: mockId,
      ...baseDocPayload,
      ...(cleanProfessionalId ? { professionalId: cleanProfessionalId } : {}),
      ...(cleanProfessionalName ? { professionalName: cleanProfessionalName } : {}),
    };
  }

  try {
    const aptDocRef = doc(collection(db, collectionPath));
    const busySlotDocRef = doc(db, 'busy_slots', aptDocRef.id);

    const busySlotPayload: Record<string, any> = {
      businessId,
      date: input.date,
      time: input.time,
      duration,
      status: 'confirmed' as const,
      createdAt: serverTimestamp(),
    };

    if (cleanProfessionalId) {
      busySlotPayload.professionalId = cleanProfessionalId;
    }

    const batch = writeBatch(db);
    batch.set(aptDocRef, docPayload);
    // Write anonymous slot for public schedule calculation (zero PII)
    batch.set(busySlotDocRef, busySlotPayload);
    await batch.commit();

    return {
      id: aptDocRef.id,
      ...baseDocPayload,
      ...(cleanProfessionalId ? { professionalId: cleanProfessionalId } : {}),
      ...(cleanProfessionalName ? { professionalName: cleanProfessionalName } : {}),
    };
  } catch (error) {
    console.error('[Firestore] Falha na gravação do agendamento:', error);
    handleFirestoreError(error, OperationType.CREATE, collectionPath);
    throw error;
  }
}

/**
 * Fetches schedule slots for a given business and date for public slot calculation and conflict checking.
 * Prioritizes the anonymous 'busy_slots' collection (Zero PII).
 */
export async function getFirestoreAppointmentsByDate(
  date: string,
  businessId = 'joao-barber'
): Promise<FirestoreAppointmentRecord[]> {
  if (!isFirebaseConfigured || !db) {
    return [];
  }

  try {
    // 1. Query the anonymous, zero-PII busy_slots collection
    const qSlots = query(
      collection(db, 'busy_slots'),
      where('businessId', '==', businessId),
      where('date', '==', date)
    );
    const slotsSnapshot = await getDocs(qSlots);

    if (!slotsSnapshot.empty) {
      const records: FirestoreAppointmentRecord[] = [];
      slotsSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        records.push({
          id: docSnap.id,
          businessId: data.businessId,
          ...(data.professionalId ? { professionalId: data.professionalId } : {}),
          customerName: '', // Redacted/Zero PII for public availability
          customerPhone: '', // Redacted/Zero PII for public availability
          date: data.date,
          time: data.time,
          services: [],
          totalPrice: 0,
          duration: data.duration || 30,
          status: data.status || 'confirmed',
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      });
      return records.sort((a, b) => a.time.localeCompare(b.time));
    }

    // 2. Fallback to appointments collection if busy_slots has no records
    const qApt = query(
      collection(db, 'appointments'),
      where('businessId', '==', businessId),
      where('date', '==', date)
    );
    const aptSnapshot = await getDocs(qApt);
    const records: FirestoreAppointmentRecord[] = [];
    aptSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      records.push({
        id: docSnap.id,
        businessId: data.businessId,
        ...(data.professionalId ? { professionalId: data.professionalId } : {}),
        ...(data.professionalName ? { professionalName: data.professionalName } : {}),
        customerName: '', // Redacted for public availability
        customerPhone: '', // Redacted for public availability
        date: data.date,
        time: data.time,
        services: data.services || [],
        totalPrice: data.totalPrice,
        duration: data.duration || 30,
        status: data.status || 'confirmed',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    });
    return records.sort((a, b) => a.time.localeCompare(b.time));
  } catch (error) {
    console.warn('[Firestore] Consulta de horários ocupados inacessível (regras ou conexão). Permitindo seleção de horários padrão.', error);
    return [];
  }
}

/**
 * Fetches all appointments for a given business tenant for the Admin Dashboard.
 * Normalizes Firestore documents to AdminAppointment and sorts chronologically.
 */
export async function getFirestoreAppointmentsForAdmin(
  businessId = 'joao-barber'
): Promise<AdminAppointment[]> {
  if (!isFirebaseConfigured || !db) {
    return [];
  }

  const collectionPath = 'appointments';
  try {
    const q = query(
      collection(db, collectionPath),
      where('businessId', '==', businessId)
    );
    const querySnapshot = await getDocs(q);

    const records: AdminAppointment[] = [];
    querySnapshot.forEach((docSnap) => {
      records.push(firestoreToAdminAppointment(docSnap.id, docSnap.data()));
    });

    // Sort chronologically: first by date ascending, then by time ascending
    return records.sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      return a.time.localeCompare(b.time);
    });
  } catch (error) {
    console.warn('[Firestore] Consulta de agendamentos do admin inacessível no momento.', error);
    return [];
  }
}

/**
 * Updates the status of an appointment in Cloud Firestore to 'cancelled' or 'completed'.
 *
 * Arquitetura Híbrida / Segregação de Responsabilidade (Fase 4B.4.x):
 * - 'cancelled': Invoca a Serverless Function autoritativa POST /api/admin/bookings/cancel
 *   executando transação ACID no Firebase Admin para atualizar /appointments, /busy_slots
 *   e remover cirurgicamente o intervalo do controle de concorrência em /daily_schedules.
 * - 'completed': Preserva a transição atômica via writeBatch() no Client SDK, mantendo
 *   o bloqueio histórico do horário e o snapshot financeiro do atendimento.
 */
export async function updateFirestoreAppointmentStatus(
  appointmentId: string,
  status: 'cancelled' | 'completed'
): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseConfigured || !db) {
    return { success: true };
  }

  // 1. FLUXO SERVERLESS TRANSACIONAL PARA CANCELAMENTO
  if (status === 'cancelled') {
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      return {
        success: false,
        error: 'Autenticação necessária. Faça login como administrador para cancelar reservas.',
      };
    }

    let idToken: string;
    try {
      idToken = await currentUser.getIdToken();
    } catch (tokenErr) {
      console.error('[Admin Cancel] Falha ao obter token de autenticação:', tokenErr);
      return {
        success: false,
        error: 'Falha ao autenticar sessão administrativa. Atualize a página e tente novamente.',
      };
    }

    try {
      const response = await fetch('/api/admin/bookings/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          businessId: 'joao-barber',
          appointmentId,
        }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        // Resposta sem corpo JSON
      }

      if (response.ok && data?.success) {
        // Sucesso normal ou idempotente (alreadyCancelled: true)
        return { success: true };
      }

      // Mapeamento explícito de erros HTTP
      let errorMessage = 'Não foi possível cancelar o agendamento no momento.';
      if (response.status === 401) {
        errorMessage = 'Sessão expirada ou não autorizada. Faça login novamente.';
      } else if (response.status === 404) {
        errorMessage = 'Agendamento não encontrado no banco de dados.';
      } else if (response.status === 409) {
        errorMessage = 'Não é permitido cancelar um agendamento que já foi concluído.';
      } else if (response.status === 503) {
        errorMessage = 'Serviço de cancelamento temporariamente indisponível no servidor.';
      } else if (data?.message) {
        errorMessage = data.message;
      }

      console.warn(`[Admin Cancel] Endpoint retornou HTTP ${response.status}:`, data);
      return {
        success: false,
        error: errorMessage,
      };
    } catch (networkErr: any) {
      console.error('[Admin Cancel] Erro de conexão com o servidor:', networkErr);
      return {
        success: false,
        error: 'Erro de conexão com o servidor ao cancelar agendamento. Verifique sua conexão e tente novamente.',
      };
    }
  }

  // 2. FLUXO CLIENT SDK PRESERVADO PARA CONCLUSÃO DE ATENDIMENTO ('completed')
  const collectionPath = 'appointments';
  try {
    const batch = writeBatch(db);
    const aptRef = doc(db, 'appointments', appointmentId);
    const slotRef = doc(db, 'busy_slots', appointmentId);

    batch.update(aptRef, { status });
    batch.update(slotRef, { status });
    await batch.commit();

    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionPath}/${appointmentId}`);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao atualizar status no Firestore';
    return { success: false, error: errorMessage };
  }
}

