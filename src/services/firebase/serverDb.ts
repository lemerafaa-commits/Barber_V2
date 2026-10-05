import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';
import { resolveBarberServiceDuration, extractCandidateServiceIds } from '../../utils/duration';
import { Barber } from '../../types/admin';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

// Temporary diagnostic holders (non-sensitive)
let diagProjectId = '';
let diagClientEmail = '';
let diagCredentialSource = '';

export interface RealAppointmentRecord {
  id: string;
  businessId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  services?: any[];
  totalPrice?: number;
  duration?: number;
  status: string;
  whatsappOptIn?: boolean;
  whatsappNotificationSent?: boolean;
  whatsappNotificationSentAt?: any;
  professionalId?: string;
  professionalName?: string;
  clientRequestId?: string;
  createdAt?: string;
}

export interface ScheduleInterval {
  startMinutes: number;
  endMinutes: number;
  appointmentId: string;
  clientRequestId: string;
}

export interface DailyScheduleDocument {
  businessId: string;
  date: string;
  professionalId: string; // ID específico do profissional ou 'universal'
  intervals: ScheduleInterval[];
  updatedAt: any;
}

export interface CreateBookingTransactionInput {
  businessId: string;
  serviceIds: string[];
  professionalId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  clientInfo: {
    name: string;
    phone: string;
    whatsappOptIn?: boolean;
  };
  clientRequestId: string;
}

export interface CreateBookingTransactionResult {
  success: boolean;
  appointment: RealAppointmentRecord;
  isIdempotentReplay: boolean;
}

export type BookingTransactionErrorCode =
  | 'SLOT_CONFLICT'
  | 'IDEMPOTENCY_CONFLICT'
  | 'INVALID_DATA'
  | 'SERVICE_NOT_FOUND'
  | 'PROFESSIONAL_NOT_FOUND'
  | 'PROFESSIONAL_INACTIVE'
  | 'PROFESSIONAL_NOT_ELIGIBLE'
  | 'FIREBASE_CONFIG_ERROR'
  | 'INTERNAL_ERROR';

export class BookingTransactionError extends Error {
  code: BookingTransactionErrorCode;
  details?: Record<string, any>;

  constructor(code: BookingTransactionErrorCode, message: string, details?: Record<string, any>) {
    super(message);
    this.name = 'BookingTransactionError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Converte string de horário "HH:mm" para minutos decorridos a partir da meia-noite.
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Converte minutos decorridos a partir da meia-noite de volta para string "HH:mm".
 */
export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Verifica sobreposição de intervalos abertos à direita [start, end).
 * Dois intervalos sobrepõem-se se e somente se: startA < endB && endA > startB.
 */
export function isIntervalOverlapping(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

/**
 * Extrai o dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado) de uma data YYYY-MM-DD.
 */
export function getDayOfWeekFromDateString(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDay();
}

/**
 * Computa uma assinatura canônica determinística dos parâmetros essenciais da reserva.
 * Utilizada para impedir reutilização fraudulenta do mesmo clientRequestId com parâmetros distintos.
 */
export function computeRequestFingerprint(input: {
  businessId: string;
  professionalId: string;
  date: string;
  time: string;
  serviceIds: string[];
  customerPhone: string;
}): string {
  const sortedServices = [...input.serviceIds].sort().join(',');
  return `${input.businessId}|${input.professionalId}|${input.date}|${input.time}|${sortedServices}|${input.customerPhone.trim()}`;
}

/**
 * Initializes and returns the Firebase Admin Firestore instance on the server side.
 * Never imported into client bundles.
 * 
 * Supports:
 * 1. FIREBASE_SERVICE_ACCOUNT (raw JSON string)
 * 2. FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY + FIREBASE_PROJECT_ID
 * 3. Default GCP / ADC initialization with fallback
 */
export function getAdminFirestore(): Firestore {
  if (adminDb) {
    return adminDb;
  }

  const envProjectId = process.env.FIREBASE_PROJECT_ID;
  const defaultProjectId = 'saas-barberaria-teste-v1';
  const projectId = envProjectId || defaultProjectId;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  const hasPrivateKey = Boolean(process.env.FIREBASE_PRIVATE_KEY);
  const hasServiceAccount = Boolean(serviceAccountJson);

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    diagProjectId = adminApp.options.projectId || projectId;
    diagCredentialSource = 'Existing App Instance (' + adminApp.name + ')';
    diagClientEmail = diagClientEmail || '(already initialized app)';
  } else {
    if (serviceAccountJson) {
      try {
        const parsed = JSON.parse(serviceAccountJson);
        diagCredentialSource = 'FIREBASE_SERVICE_ACCOUNT';
        diagClientEmail = parsed.client_email || '(unknown client_email)';
        diagProjectId = parsed.project_id || projectId;

        adminApp = initializeApp({
          credential: cert(parsed),
          projectId: diagProjectId,
        });
      } catch (err: any) {
        console.error('[Firebase Admin] Error parsing FIREBASE_SERVICE_ACCOUNT JSON:', err?.message);
        throw new Error('FIREBASE_CONFIG_ERROR');
      }
    } else if (clientEmail && privateKey) {
      diagCredentialSource = 'FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY';
      diagClientEmail = clientEmail;
      diagProjectId = projectId;

      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } else {
      diagCredentialSource = 'Application Default Credentials';
      diagClientEmail = '(ADC / default environment)';
      diagProjectId = projectId;

      adminApp = initializeApp({ projectId });
    }
  }

  // Diagnostic logs at initialization (strictly non-sensitive)
  console.log('[Firebase Admin Init] Process FIREBASE_PROJECT_ID:', envProjectId || '(not set)');
  console.log('[Firebase Admin Init] FIREBASE_SERVICE_ACCOUNT present:', hasServiceAccount);
  console.log('[Firebase Admin Init] FIREBASE_PRIVATE_KEY present:', hasPrivateKey);
  console.log('[Firebase Admin Init] Credential method used:', diagCredentialSource);
  console.log('[Firebase Admin Init] Client email used:', diagClientEmail);
  console.log('[Firebase Admin Init] ProjectId resolved:', diagProjectId);

  adminDb = getFirestore(adminApp);
  return adminDb;
}

/**
 * Retrieves the REAL appointment from Firestore collection 'appointments'.
 * Uses Firebase Admin SDK to bypass client security rules securely on the server.
 * 
 * Returns null if appointmentId is invalid or document does not exist.
 */
export async function getRealAppointmentById(
  appointmentId: string
): Promise<RealAppointmentRecord | null> {
  if (!appointmentId || typeof appointmentId !== 'string' || appointmentId.trim().length === 0) {
    return null;
  }

  const cleanId = appointmentId.trim();
  // Validate ID format (Firestore IDs are alphanumeric strings, typically 10-40 characters)
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(cleanId)) {
    console.warn(`[Firebase Admin] Invalid appointmentId format: "${cleanId}"`);
    return null;
  }

  try {
    const db = getAdminFirestore();

    // Sanitized diagnostic log immediately before querying Firestore
    console.log(`[Firebase Admin Diagnostic] projectId=${diagProjectId}`);
    console.log(`[Firebase Admin Diagnostic] clientEmail=${diagClientEmail}`);
    console.log(`[Firebase Admin Diagnostic] credentialSource=${diagCredentialSource}`);

    const docRef = db.collection('appointments').doc(cleanId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return null;
    }

    const data = snap.data() || {};
    return {
      id: snap.id,
      businessId: data.businessId || '',
      customerName: data.customerName || '',
      customerPhone: data.customerPhone || '',
      date: data.date || '',
      time: data.time || '',
      services: data.services || [],
      totalPrice: data.totalPrice || 0,
      duration: data.duration || 0,
      status: data.status || 'confirmed',
      whatsappOptIn: data.whatsappOptIn === true,
      whatsappNotificationSent: data.whatsappNotificationSent === true,
      whatsappNotificationSentAt: data.whatsappNotificationSentAt,
      professionalId: data.professionalId,
      professionalName: data.professionalName,
      clientRequestId: data.clientRequestId,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || '',
    };
  } catch (error: any) {
    console.error(`[Firebase Admin] Failed to fetch appointment ${cleanId}:`, error?.message || error);
    throw error;
  }
}

/**
 * Marks the appointment as having sent WhatsApp confirmation in Firestore.
 * Provides server-side persistent idempotency.
 */
export async function markAppointmentNotificationSent(appointmentId: string): Promise<void> {
  try {
    const db = getAdminFirestore();
    const docRef = db.collection('appointments').doc(appointmentId);
    await docRef.update({
      whatsappNotificationSent: true,
      whatsappNotificationSentAt: new Date().toISOString(),
    });
  } catch (error: any) {
    // Non-critical: Log and continue
    console.warn(`[Firebase Admin] Could not update whatsappNotificationSent on ${appointmentId}:`, error?.message);
  }
}

/**
 * NÚCLEO TRANSACIONAL SERVER-SIDE DE CRIAÇÃO DE RESERVAS (FASE 4B.3.6).
 *
 * Garante serialização atômica contra condições de corrida e overbooking utilizando o Firebase Admin SDK:
 * 1. Validação estrita e defensiva de todos os parâmetros de entrada.
 * 2. Idempotência estrita baseada em documento determinístico (/idempotency_keys/{businessId}_{clientRequestId}).
 * 3. Validação autoritativa de catálogo: preço e duração são calculados a partir dos documentos do Firestore,
 *    eliminando qualquer confiança cega em dados de preço ou duração enviados pelo cliente.
 * 4. Validação de elegibilidade e jornada do profissional (DaySchedule, horários de expediente e pausas).
 * 5. Coordenação transacional por documentos de controle diário (/daily_schedules/{businessId}_{date}_{profId}
 *    e /daily_schedules/{businessId}_{date}_universal).
 * 6. Read-through automático com migração sob demanda de agendamentos legados em /busy_slots.
 * 7. Gravação atômica simultânea de /appointments, /busy_slots, /daily_schedules e /idempotency_keys.
 */
export async function createBookingTransaction(
  input: CreateBookingTransactionInput
): Promise<CreateBookingTransactionResult> {
  // 1. Validação estrita de entrada
  if (!input || typeof input !== 'object') {
    throw new BookingTransactionError('INVALID_DATA', 'Corpo da requisição de agendamento inválido.');
  }

  const businessId = (input.businessId || '').trim();
  if (!businessId) {
    throw new BookingTransactionError('INVALID_DATA', 'businessId é obrigatório.');
  }

  if (!Array.isArray(input.serviceIds) || input.serviceIds.length === 0) {
    throw new BookingTransactionError('INVALID_DATA', 'Pelo menos um serviço deve ser selecionado.');
  }

  const cleanServiceIds = input.serviceIds
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean);
  if (cleanServiceIds.length === 0) {
    throw new BookingTransactionError('INVALID_DATA', 'Lista de serviços inválida.');
  }

  const professionalId = (input.professionalId || '').trim();
  if (!professionalId) {
    throw new BookingTransactionError('INVALID_DATA', 'professionalId é obrigatório.');
  }

  const date = (input.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new BookingTransactionError('INVALID_DATA', 'Data em formato inválido. Esperado YYYY-MM-DD.');
  }

  const time = (input.time || '').trim();
  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new BookingTransactionError('INVALID_DATA', 'Horário em formato inválido. Esperado HH:mm.');
  }

  const clientName = (input.clientInfo?.name || '').trim();
  if (clientName.length < 2) {
    throw new BookingTransactionError('INVALID_DATA', 'Nome do cliente deve conter no mínimo 2 caracteres.');
  }

  const clientPhone = (input.clientInfo?.phone || '').trim();
  if (clientPhone.length < 8) {
    throw new BookingTransactionError('INVALID_DATA', 'Telefone do cliente deve conter no mínimo 8 caracteres.');
  }

  const clientRequestId = (input.clientRequestId || '').trim();
  if (!clientRequestId || clientRequestId.length < 8) {
    throw new BookingTransactionError(
      'INVALID_DATA',
      'clientRequestId obrigatório (mínimo 8 caracteres) para garantia de idempotência.'
    );
  }

  // 2. Conexão com Firestore Admin
  let db: Firestore;
  try {
    db = getAdminFirestore();
  } catch (err: any) {
    throw new BookingTransactionError(
      'FIREBASE_CONFIG_ERROR',
      `Falha na inicialização do Firebase Admin no servidor: ${err?.message || 'Configuração ausente'}`
    );
  }

  // 3. Fingerprint da requisição para validação de integridade de idempotência
  const currentFingerprint = computeRequestFingerprint({
    businessId,
    professionalId,
    date,
    time,
    serviceIds: cleanServiceIds,
    customerPhone: clientPhone,
  });

  const idempotencyDocRef = db.collection('idempotency_keys').doc(`${businessId}_${clientRequestId}`);
  const profDocRef = db.collection('professionals').doc(professionalId);
  const profScheduleDocRef = db.collection('daily_schedules').doc(`${businessId}_${date}_${professionalId}`);
  const universalScheduleDocRef = db.collection('daily_schedules').doc(`${businessId}_${date}_universal`);

  // 4. Execução da Transação ACID
  return await db.runTransaction(async (transaction) => {
    // -------------------------------------------------------------
    // FASE 1: TODAS AS LEITURAS (READS) PRIMEIRO
    // -------------------------------------------------------------

    // Leitura 1: Chave de Idempotência
    const idempotencySnap = await transaction.get(idempotencyDocRef);
    if (idempotencySnap.exists) {
      const idempData = idempotencySnap.data() || {};
      if (idempData.requestFingerprint !== currentFingerprint) {
        throw new BookingTransactionError(
          'IDEMPOTENCY_CONFLICT',
          'A chave de idempotência informada já foi utilizada para uma reserva com parâmetros diferentes.',
          { clientRequestId }
        );
      }

      // Buscar agendamento existente vinculado
      const existingAptSnap = await transaction.get(db.collection('appointments').doc(idempData.appointmentId));
      if (!existingAptSnap.exists) {
        throw new BookingTransactionError(
          'INTERNAL_ERROR',
          'Registro de idempotência aponta para agendamento que não existe mais no banco.'
        );
      }

      const existingData = existingAptSnap.data() || {};
      if (existingData.status === 'cancelled') {
        throw new BookingTransactionError(
          'IDEMPOTENCY_CONFLICT',
          'A reserva original vinculada a esta chave de idempotência foi cancelada anteriormente.'
        );
      }

      return {
        success: true,
        isIdempotentReplay: true,
        appointment: {
          id: existingAptSnap.id,
          businessId: existingData.businessId || businessId,
          customerName: existingData.customerName || clientName,
          customerPhone: existingData.customerPhone || clientPhone,
          date: existingData.date || date,
          time: existingData.time || time,
          services: existingData.services || [],
          totalPrice: existingData.totalPrice || 0,
          duration: existingData.duration || 30,
          status: existingData.status || 'confirmed',
          whatsappOptIn: existingData.whatsappOptIn === true,
          whatsappNotificationSent: existingData.whatsappNotificationSent === true,
          whatsappNotificationSentAt: existingData.whatsappNotificationSentAt,
          professionalId: existingData.professionalId,
          professionalName: existingData.professionalName,
          clientRequestId,
          createdAt:
            existingData.createdAt?.toDate?.()?.toISOString() ||
            existingData.createdAt ||
            new Date().toISOString(),
        },
      };
    }

    // Leitura 2: Profissional Real
    const profSnap = await transaction.get(profDocRef);
    if (!profSnap.exists) {
      throw new BookingTransactionError(
        'PROFESSIONAL_NOT_FOUND',
        `Profissional com ID "${professionalId}" não encontrado no cadastro.`
      );
    }
    const barberData = profSnap.data() as Barber;
    if (barberData.status !== 'active' || barberData.active === false) {
      throw new BookingTransactionError(
        'PROFESSIONAL_INACTIVE',
        `O profissional "${barberData.name || professionalId}" não está ativo para agendamentos.`
      );
    }

    // Leitura 3: Catálogo Real de Serviços
    const serviceSnaps = await Promise.all(
      cleanServiceIds.map(async (svcId) => {
        let snap = await transaction.get(db.collection('services').doc(svcId));
        if (!snap.exists && svcId.includes('-')) {
          // Extração alternativa de ID composto (ex: 'cabelo-serv-corte' -> 'serv-corte')
          const parts = svcId.split('-');
          const subId = parts.slice(1).join('-');
          const fallbackSnap = await transaction.get(db.collection('services').doc(subId));
          if (fallbackSnap.exists) {
            snap = fallbackSnap;
          }
        }
        return { requestedId: svcId, snap };
      })
    );

    for (const { requestedId, snap } of serviceSnaps) {
      if (!snap.exists) {
        throw new BookingTransactionError(
          'SERVICE_NOT_FOUND',
          `Serviço com ID "${requestedId}" não encontrado no catálogo.`
        );
      }
      const data = snap.data() || {};
      if (data.active === false) {
        throw new BookingTransactionError(
          'SERVICE_NOT_FOUND',
          `O serviço "${data.name || requestedId}" está inativo no catálogo.`
        );
      }
    }

    // Leitura 4: Controles de Agenda Diária
    const profScheduleSnap = await transaction.get(profScheduleDocRef);
    const universalScheduleSnap = await transaction.get(universalScheduleDocRef);

    // Leitura 5: Read-through de agendamentos legados em /busy_slots caso os controles diários ainda não existam
    let seededProfIntervals: ScheduleInterval[] = [];
    let seededUniversalIntervals: ScheduleInterval[] = [];

    if (!profScheduleSnap.exists || !universalScheduleSnap.exists) {
      const busySlotsQuery = db
        .collection('busy_slots')
        .where('businessId', '==', businessId)
        .where('date', '==', date);
      const busySlotsSnap = await transaction.get(busySlotsQuery);

      busySlotsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.status === 'cancelled') return;

        const slotTime = data.time;
        const slotDuration = Number(data.duration) || 30;
        const startMinutes = timeToMinutes(slotTime);
        const endMinutes = startMinutes + slotDuration;

        const interval: ScheduleInterval = {
          startMinutes,
          endMinutes,
          appointmentId: docSnap.id,
          clientRequestId: '',
        };

        if (!data.professionalId) {
          // Agendamento legado sem professionalId -> vai para o controle universal
          seededUniversalIntervals.push(interval);
        } else if (data.professionalId === professionalId) {
          // Agendamento deste profissional
          seededProfIntervals.push(interval);
        }
      });
    }

    // -------------------------------------------------------------
    // FASE 2: VALIDAÇÃO AUTORITATIVA E CÁLCULO DE INTERVALOS
    // -------------------------------------------------------------

    // A. Elegibilidade do Profissional para os Serviços Selecionados
    if (barberData.serviceMode === 'custom') {
      const allowedIds = new Set(barberData.serviceIds || []);
      for (const { snap } of serviceSnaps) {
        const data = snap.data() || {};
        const candidates = extractCandidateServiceIds({
          id: snap.id,
          categoryId: data.categoryId,
        });
        const isEligible = candidates.some((cId) => allowedIds.has(cId));
        if (!isEligible) {
          throw new BookingTransactionError(
            'PROFESSIONAL_NOT_ELIGIBLE',
            `O profissional "${barberData.name}" não realiza o serviço "${data.name || snap.id}".`
          );
        }
      }
    }

    // B. Cálculo de Duração Efetiva e Preço Autoritativo
    const formattedServices: any[] = [];
    let totalDuration = 0;
    let totalPrice = 0;

    for (const { snap } of serviceSnaps) {
      const data = snap.data() || {};
      const catalogService = {
        id: snap.id,
        categoryId: data.categoryId || 'cabelo',
        durationMinutes: Number(data.durationMinutes) || 30,
        price: Number(data.price) || 0,
      };

      const effectiveDuration = resolveBarberServiceDuration(catalogService, {
        serviceConfigs: barberData.serviceConfigs || [],
      });

      totalDuration += effectiveDuration;
      totalPrice += catalogService.price;

      formattedServices.push({
        categoryId: catalogService.categoryId,
        categoryName: data.categoryName || 'Cabelo',
        optionId: snap.id,
        optionName: data.name || 'Serviço',
        price: catalogService.price,
        duration: effectiveDuration,
      });
    }

    const newStart = timeToMinutes(time);
    const newEnd = newStart + totalDuration;

    // C. Validação da Jornada de Trabalho (DaySchedule)
    if (Array.isArray(barberData.schedule) && barberData.schedule.length > 0) {
      const dayOfWeek = getDayOfWeekFromDateString(date);
      const daySchedule = barberData.schedule.find((s) => s.dayOfWeek === dayOfWeek);

      if (daySchedule) {
        if (daySchedule.isDayOff) {
          throw new BookingTransactionError(
            'SLOT_CONFLICT',
            `O profissional "${barberData.name}" está de folga em ${date}.`
          );
        }

        const workStart = timeToMinutes(daySchedule.startTime);
        const workEnd = timeToMinutes(daySchedule.endTime);

        if (newStart < workStart || newEnd > workEnd) {
          throw new BookingTransactionError(
            'SLOT_CONFLICT',
            `O horário solicitado (${time} às ${formatMinutesToTime(newEnd)}) está fora do expediente de trabalho (${daySchedule.startTime} às ${daySchedule.endTime}).`
          );
        }

        // Checar pausas / intervalos do dia
        const breaks = Array.isArray(daySchedule.breaks)
          ? daySchedule.breaks
          : daySchedule.breakStartTime && daySchedule.breakEndTime
          ? [{ startTime: daySchedule.breakStartTime, endTime: daySchedule.breakEndTime }]
          : [];

        for (const b of breaks) {
          const breakStart = timeToMinutes(b.startTime);
          const breakEnd = timeToMinutes(b.endTime);
          if (isIntervalOverlapping(newStart, newEnd, breakStart, breakEnd)) {
            throw new BookingTransactionError(
              'SLOT_CONFLICT',
              `O horário solicitado coincide com o intervalo de descanso do profissional (${b.startTime} às ${b.endTime}).`
            );
          }
        }
      }
    }

    // D. Checagem de Conflitos contra Intervalos Ocupados
    const activeProfIntervals = profScheduleSnap.exists
      ? (profScheduleSnap.data()?.intervals as ScheduleInterval[]) || []
      : seededProfIntervals;

    const activeUniversalIntervals = universalScheduleSnap.exists
      ? (universalScheduleSnap.data()?.intervals as ScheduleInterval[]) || []
      : seededUniversalIntervals;

    // 1. Conflito com a agenda do próprio profissional
    for (const interval of activeProfIntervals) {
      if (isIntervalOverlapping(newStart, newEnd, interval.startMinutes, interval.endMinutes)) {
        throw new BookingTransactionError(
          'SLOT_CONFLICT',
          `O profissional "${barberData.name}" já possui agendamento no horário solicitado.`
        );
      }
    }

    // 2. Conflito com agendamentos legados universais
    for (const interval of activeUniversalIntervals) {
      if (isIntervalOverlapping(newStart, newEnd, interval.startMinutes, interval.endMinutes)) {
        throw new BookingTransactionError(
          'SLOT_CONFLICT',
          'O horário solicitado está bloqueado por um agendamento universal da barbearia.'
        );
      }
    }

    // -------------------------------------------------------------
    // FASE 3: ESCRITAS ATÔMICAS (WRITES)
    // -------------------------------------------------------------

    const aptDocRef = db.collection('appointments').doc();
    const busySlotDocRef = db.collection('busy_slots').doc(aptDocRef.id);

    const newInterval: ScheduleInterval = {
      startMinutes: newStart,
      endMinutes: newEnd,
      appointmentId: aptDocRef.id,
      clientRequestId,
    };

    // 1. Atualizar ou Inicializar Documento de Controle da Agenda do Profissional
    transaction.set(
      profScheduleDocRef,
      {
        businessId,
        date,
        professionalId,
        intervals: [...activeProfIntervals, newInterval],
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 2. Se o controle universal ainda não existia, persiste sua inicialização
    if (!universalScheduleSnap.exists) {
      transaction.set(
        universalScheduleDocRef,
        {
          businessId,
          date,
          professionalId: 'universal',
          intervals: activeUniversalIntervals,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    // 3. Criar Documento em /appointments
    transaction.set(aptDocRef, {
      businessId,
      customerName: clientName,
      customerPhone: clientPhone,
      date,
      time,
      services: formattedServices,
      totalPrice,
      duration: totalDuration,
      status: 'confirmed',
      createdAt: FieldValue.serverTimestamp(),
      whatsappOptIn: input.clientInfo.whatsappOptIn === true,
      professionalId: barberData.id || professionalId,
      professionalName: barberData.name || 'Profissional',
      clientRequestId,
    });

    // 4. Criar Documento em /busy_slots (zero PII para disponibilidade pública)
    transaction.set(busySlotDocRef, {
      businessId,
      date,
      time,
      duration: totalDuration,
      status: 'confirmed',
      createdAt: FieldValue.serverTimestamp(),
      professionalId: barberData.id || professionalId,
      appointmentId: aptDocRef.id,
    });

    // 5. Criar Registro de Idempotência
    transaction.set(idempotencyDocRef, {
      businessId,
      clientRequestId,
      appointmentId: aptDocRef.id,
      requestFingerprint: currentFingerprint,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      isIdempotentReplay: false,
      appointment: {
        id: aptDocRef.id,
        businessId,
        customerName: clientName,
        customerPhone: clientPhone,
        date,
        time,
        services: formattedServices,
        totalPrice,
        duration: totalDuration,
        status: 'confirmed',
        whatsappOptIn: input.clientInfo.whatsappOptIn === true,
        professionalId: barberData.id || professionalId,
        professionalName: barberData.name || 'Profissional',
        clientRequestId,
        createdAt: new Date().toISOString(),
      },
    };
  });
}

