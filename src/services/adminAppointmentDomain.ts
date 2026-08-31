import { AdminAppointment, AppointmentStatus } from '../types/admin';

/**
 * Domain Service: Status transition validation
 * Prevents invalid workflows (e.g. completed or cancelled appointments transitioning backwards).
 */
export function canTransitionStatus(
  currentStatus: AppointmentStatus,
  nextStatus: AppointmentStatus
): boolean {
  if (currentStatus === nextStatus) return false;

  // Completed and cancelled are terminal statuses in this operational view
  if (currentStatus === 'completed' || currentStatus === 'cancelled') {
    return false;
  }

  // Allowed transitions:
  // confirmed -> completed | cancelled (and in_progress for future extensibility)
  // in_progress -> completed | cancelled
  if (currentStatus === 'confirmed') {
    return nextStatus === 'completed' || nextStatus === 'cancelled' || nextStatus === 'in_progress';
  }

  if (currentStatus === 'in_progress') {
    return nextStatus === 'completed' || nextStatus === 'cancelled';
  }

  return false;
}

/**
 * Domain Service: Update appointment status immutably
 * Prepared for future replacement by Firestore `updateDoc` call.
 */
export function updateAppointmentStatus(
  appointments: AdminAppointment[],
  appointmentId: string,
  newStatus: AppointmentStatus
): { updatedAppointments: AdminAppointment[]; success: boolean; error?: string } {
  const target = appointments.find((a) => a.id === appointmentId);
  if (!target) {
    return { updatedAppointments: appointments, success: false, error: 'Agendamento não encontrado.' };
  }

  if (!canTransitionStatus(target.status, newStatus)) {
    return {
      updatedAppointments: appointments,
      success: false,
      error: `Transição de "${target.status}" para "${newStatus}" não é permitida.`,
    };
  }

  const updatedAppointments = appointments.map((item) => {
    if (item.id === appointmentId) {
      return {
        ...item,
        status: newStatus,
      };
    }
    return item;
  });

  return {
    updatedAppointments,
    success: true,
  };
}

/**
 * Domain Service: Filter appointments by specific date string (YYYY-MM-DD)
 * Sorts chronologically by appointment time.
 */
export function getAppointmentsByDate(
  appointments: AdminAppointment[],
  dateIso: string
): AdminAppointment[] {
  return appointments
    .filter((a) => a.date === dateIso)
    .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Domain Service: Get active appointments (confirmed or in_progress)
 * Used to populate the operational agenda and next appointment spotlight.
 */
export function getActiveAppointments(
  appointments: AdminAppointment[]
): AdminAppointment[] {
  return appointments
    .filter((a) => a.status === 'confirmed' || a.status === 'in_progress')
    .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Domain Service: Identify next appointment to attend
 * Prioritizes currently active 'in_progress' appointment, then earliest 'confirmed'.
 */
export function getNextAppointment(
  appointments: AdminAppointment[]
): AdminAppointment | null {
  const active = getActiveAppointments(appointments);
  if (active.length === 0) return null;

  const inProgress = active.find((a) => a.status === 'in_progress');
  if (inProgress) return inProgress;

  const nextConfirmed = active.find((a) => a.status === 'confirmed');
  return nextConfirmed || null;
}

/**
 * Domain Service: Get completed appointments
 */
export function getCompletedAppointments(
  appointments: AdminAppointment[]
): AdminAppointment[] {
  return appointments
    .filter((a) => a.status === 'completed')
    .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Domain Service: Get cancelled appointments
 */
export function getCancelledAppointments(
  appointments: AdminAppointment[]
): AdminAppointment[] {
  return appointments
    .filter((a) => a.status === 'cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Domain Service: Get history appointments (completed and cancelled)
 */
export function getHistoryAppointments(
  appointments: AdminAppointment[]
): AdminAppointment[] {
  return appointments
    .filter((a) => a.status === 'completed' || a.status === 'cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Domain Service: Get set of dates that have active appointments (for calendar markers).
 * Visually filters out dates prior to today so the calendar does not display clutter on past dates.
 * Only registers active appointments ('confirmed' | 'in_progress').
 * Cancelled and completed appointments are excluded from the calendar indicator counts,
 * while remaining fully intact in memory and Firestore for manual date selection and history.
 */
export function getDatesWithAppointments(
  appointments: AdminAppointment[],
  referenceDateIso?: string
): Map<string, { total: number; active: number }> {
  const map = new Map<string, { total: number; active: number }>();

  let todayIso = referenceDateIso;
  if (!todayIso) {
    const today = new Date();
    todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;
  }

  appointments.forEach((item) => {
    // Only register calendar indicators for today and future dates (item.date >= todayIso)
    // and strictly for active appointments ('confirmed' or 'in_progress')
    if (
      item.date &&
      item.date >= todayIso &&
      (item.status === 'confirmed' || item.status === 'in_progress')
    ) {
      const curr = map.get(item.date) || { total: 0, active: 0 };
      curr.total += 1;
      curr.active += 1;
      map.set(item.date, curr);
    }
  });

  return map;
}

/**
 * Helper: Format currency in BRL
 */
export function formatCurrencyBRL(amount: number): string {
  return `R$ ${amount.toFixed(2).replace('.', ',')}`;
}

/**
 * Helper: Human-friendly date banner label (PT-BR)
 */
export function getFriendlyDateLabel(dateIso: string): string {
  const [yearStr, monthStr, dayStr] = dateIso.split('-');
  const dateObj = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(
    tomorrow.getDate()
  ).padStart(2, '0')}`;

  const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'long' });
  const dayNumber = dateObj.getDate();
  const weekdayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });

  if (dateIso === todayIso) {
    return `HOJE — ${dayNumber} DE ${monthName.toUpperCase()}`;
  }
  if (dateIso === tomorrowIso) {
    return `AMANHÃ — ${dayNumber} DE ${monthName.toUpperCase()}`;
  }

  return `${weekdayName.toUpperCase()} — ${dayNumber} DE ${monthName.toUpperCase()}`;
}
