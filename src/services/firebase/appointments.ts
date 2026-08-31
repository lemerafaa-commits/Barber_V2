import {
  collection,
  serverTimestamp,
  getDocs,
  query,
  where,
  doc,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
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

  return {
    id: docId,
    businessId: data.businessId || 'joao-barber',
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

  try {
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

    const docPayload = {
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
    };

    const aptDocRef = doc(collection(db, collectionPath));
    const busySlotDocRef = doc(db, 'busy_slots', aptDocRef.id);

    const batch = writeBatch(db);
    batch.set(aptDocRef, docPayload);
    // Write anonymous slot for public schedule calculation (zero PII)
    batch.set(busySlotDocRef, {
      businessId,
      date: input.date,
      time: input.time,
      duration,
      status: 'confirmed' as const,
      createdAt: serverTimestamp(),
    });
    await batch.commit();

    return {
      id: aptDocRef.id,
      ...docPayload,
    };
  } catch (error) {
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
    handleFirestoreError(error, OperationType.GET, 'busy_slots');
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
    handleFirestoreError(error, OperationType.GET, collectionPath);
    return [];
  }
}

/**
 * Updates the status of an appointment in Cloud Firestore to 'cancelled' or 'completed'.
 * Synchronously updates both 'appointments' and 'busy_slots' using an atomic batch.
 */
export async function updateFirestoreAppointmentStatus(
  appointmentId: string,
  status: 'cancelled' | 'completed'
): Promise<{ success: boolean; error?: string }> {
  const collectionPath = 'appointments';
  try {
    const batch = writeBatch(db);
    const aptRef = doc(db, 'appointments', appointmentId);
    const slotRef = doc(db, 'busy_slots', appointmentId);

    batch.update(aptRef, { status });
    batch.set(slotRef, { status }, { merge: true });
    await batch.commit();

    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionPath}/${appointmentId}`);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao atualizar status no Firestore';
    return { success: false, error: errorMessage };
  }
}

