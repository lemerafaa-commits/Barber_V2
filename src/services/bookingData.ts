import {
  DayOption,
  TimeSlot,
  Appointment,
  Barbershop,
  Service,
  Professional,
  ClientInfo
} from '../types/booking';
import {
  MOCK_BARBERSHOP,
  MOCK_PROFESSIONALS,
  SPECIAL_ANY_PROFESSIONAL,
  ANY_PROFESSIONAL_ID,
  BASE_DAY_TIME_SLOTS
} from '../data/mockData';
import {
  createFirestoreAppointment,
  getFirestoreAppointmentsByDate,
  FirestoreAppointmentRecord
} from './firebase/appointments';

export interface ExistingAppointmentSummary {
  time: string;
  duration: number;
  status?: string;
}

/**
 * Converts a time string (e.g. "13:30") to minutes from midnight.
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Generates the upcoming N days for selection (excluding Sundays or marking them unavailable).
 */
export function getUpcomingDays(count = 14): DayOption[] {
  const days: DayOption[] = [];
  const today = new Date();

  const weekDayMap = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  const monthNames = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  const weekDayFull = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
  ];

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dateNum = String(d.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dateNum}`;

    const dayOfWeekIndex = d.getDay();
    const isSunday = dayOfWeekIndex === 0;

    const fullFormattedDate = `${weekDayFull[dayOfWeekIndex]}, ${d.getDate()} de ${monthNames[d.getMonth()]}`;

    days.push({
      dateString,
      dayOfWeek: weekDayMap[dayOfWeekIndex],
      dayNumber: dateNum,
      fullFormattedDate,
      isAvailable: !isSunday, // Sunday barbershop is closed
      isToday: i === 0,
    });
  }

  return days;
}

/**
 * Returns available time slots by calculating interval overlaps against real appointments.
 */
export function getAvailableTimeSlots(
  dateString: string,
  existingAppointments: ExistingAppointmentSummary[] = [],
  totalDurationMinutes = 30,
  simulatedFullyBooked = false
): TimeSlot[] {
  if (simulatedFullyBooked) {
    return BASE_DAY_TIME_SLOTS.map((t) => ({
      time: t,
      available: false,
      isOccupied: true,
      occupiedReason: 'Horário já reservado',
    }));
  }

  // Active (non-cancelled) appointments for the day
  const activeAppointments = existingAppointments.filter(
    (apt) => apt.status !== 'cancelled'
  );

  // Barbershop closing time is 20:00 (8:00 PM) = 1200 minutes
  const closingTimeMinutes = 20 * 60;

  return BASE_DAY_TIME_SLOTS.map((slotTime) => {
    const newStart = timeToMinutes(slotTime);
    const newEnd = newStart + totalDurationMinutes;

    // Check if slot exceeds business hours
    if (newEnd > closingTimeMinutes) {
      return {
        time: slotTime,
        available: false,
        isOccupied: true,
        occupiedReason: 'Excede o horário de funcionamento',
      };
    }

    // Overlap condition: newStart < existingEnd AND newEnd > existingStart
    const hasConflict = activeAppointments.some((apt) => {
      const existingStart = timeToMinutes(apt.time);
      const existingEnd = existingStart + (apt.duration || 30);
      return newStart < existingEnd && newEnd > existingStart;
    });

    return {
      time: slotTime,
      available: !hasConflict,
      isOccupied: hasConflict,
      occupiedReason: hasConflict ? 'Horário já reservado' : undefined,
    };
  });
}

/**
 * Saves booking confirmation into Cloud Firestore and returns the created Appointment.
 * Re-validates slot availability against Firestore immediately before creating document.
 */
export async function createBooking(
  request: {
    services?: Service[];
    service?: Service | null;
    professional: Professional;
    selectedDate: DayOption;
    selectedTime: string;
    clientInfo: ClientInfo;
    simulateConflict?: boolean;
    simulateDelayMs?: number;
  }
): Promise<Appointment> {
  const selectedServices = request.services && request.services.length > 0
    ? request.services
    : request.service
    ? [request.service]
    : [];

  if (selectedServices.length === 0) {
    throw new Error('NENHUM_SERVICO');
  }

  const totalPrice = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
  const durationMinutes = selectedServices.reduce((sum, s) => sum + Number(s.durationMinutes), 0);

  // Re-fetch latest appointments from Firestore to perform pre-commit conflict check
  const latestAppointments = await getFirestoreAppointmentsByDate(
    request.selectedDate.dateString,
    'joao-barber'
  );

  const newStart = timeToMinutes(request.selectedTime);
  const newEnd = newStart + durationMinutes;

  const activeAppointments = latestAppointments.filter((apt) => apt.status !== 'cancelled');
  const hasConflict = activeAppointments.some((apt) => {
    const existingStart = timeToMinutes(apt.time);
    const existingEnd = existingStart + (apt.duration || 30);
    return newStart < existingEnd && newEnd > existingStart;
  });

  if (hasConflict || request.simulateConflict) {
    throw new Error('SLOT_CONFLICT');
  }

  // Resolve professional if 'any' was selected
  let assignedProfessional = request.professional;
  if (request.professional.id === ANY_PROFESSIONAL_ID) {
    assignedProfessional = MOCK_PROFESSIONALS[0];
  }

  const primaryService = selectedServices[0];

  // Save to Cloud Firestore 'appointments' collection
  const firestoreRecord = await createFirestoreAppointment({
    businessId: 'joao-barber',
    customerName: request.clientInfo.name,
    customerPhone: request.clientInfo.phone,
    date: request.selectedDate.dateString,
    time: request.selectedTime,
    services: selectedServices,
    whatsappOptIn: request.clientInfo.whatsappOptIn === true,
  });

  const randomCode = `#JB-${firestoreRecord.id.slice(-4).toUpperCase()}`;

  const appointment: Appointment = {
    id: firestoreRecord.id,
    code: randomCode,
    barbershop: MOCK_BARBERSHOP,
    services: selectedServices,
    service: primaryService,
    professional: assignedProfessional,
    dateString: request.selectedDate.dateString,
    formattedDate: request.selectedDate.fullFormattedDate,
    time: request.selectedTime,
    clientInfo: request.clientInfo,
    totalPrice: totalPrice,
    durationMinutes: durationMinutes,
    createdAt: new Date().toISOString(),
    status: 'confirmed',
  };

  return appointment;
}

/**
 * Helper to retrieve professionals list with option for "Qualquer Profissional".
 */
export function getProfessionalsList(includeAny = true, singleBarberMode = false): Professional[] {
  if (singleBarberMode) {
    return [MOCK_PROFESSIONALS[0]]; // Only João
  }

  if (includeAny) {
    return [SPECIAL_ANY_PROFESSIONAL, ...MOCK_PROFESSIONALS];
  }

  return MOCK_PROFESSIONALS;
}

