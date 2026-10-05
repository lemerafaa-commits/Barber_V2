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
  getFirestoreAppointmentsByDate,
  FirestoreAppointmentRecord
} from './firebase/appointments';
import { isFirebaseConfigured } from './firebase/config';
import {
  calculateTotalEffectiveDuration,
  resolveBarberServiceDuration
} from '../utils/duration';
import { DaySchedule } from '../types/admin';
import { generateBarberSlotsForDate } from '../utils/schedule';

export interface ExistingAppointmentSummary {
  time: string;
  duration: number;
  status?: string;
  professionalId?: string;
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
 * Retorna os horários disponíveis para agendamento em uma data específica.
 *
 * Integração com o Motor Puro de Horários (Fase 4B.3.1):
 * - Se `professionalSchedule` for informado (DaySchedule[] válido com itens):
 *   Utiliza `generateBarberSlotsForDate` para produzir os horários de início elegíveis
 *   com base na jornada real do dia (startTime, endTime, breaks, isDayOff e durationMinutes).
 *   Remove a dependência funcional da grade estática e do fechamento arbitrário às 20:00.
 *
 * - Fallback de Retrocompatibilidade:
 *   Se `professionalSchedule` estiver ausente, indefinido ou vazio, preserva o comportamento
 *   legado documentado utilizando `BASE_DAY_TIME_SLOTS` e o limite fixo de 20:00.
 *
 * - Conflitos com Agendamentos Existentes:
 *   Para cada horário candidato, verifica a sobreposição de intervalos completos contra
 *   agendamentos ativos (status !== 'cancelled'). Agendamentos legados sem professionalId
 *   continuam bloqueando normalmente.
 */
export function getAvailableTimeSlots(
  dateString: string,
  existingAppointments: ExistingAppointmentSummary[] = [],
  totalDurationMinutes = 30,
  simulatedFullyBooked = false,
  professionalSchedule?: DaySchedule[] | null,
  selectedProfessionalId?: string | null
): TimeSlot[] {
  // Active (non-cancelled) appointments for the day, filtered by professional
  const activeAppointments = existingAppointments.filter((apt) => {
    if (apt.status === 'cancelled') return false;
    // Agendamentos sem professionalId são legados universais: bloqueiam qualquer profissional
    if (!apt.professionalId) return true;
    // Se foi informado o profissional selecionado, só bloqueia se pertencer a ele
    if (selectedProfessionalId) {
      return apt.professionalId === selectedProfessionalId;
    }
    // Se nenhum profissional foi informado (chamada legada), bloqueia conservadoramente
    return true;
  });

  const duration =
    typeof totalDurationMinutes === 'number' &&
    Number.isFinite(totalDurationMinutes) &&
    totalDurationMinutes > 0
      ? Math.floor(totalDurationMinutes)
      : 30;

  // 1. Caminho Principal: Agenda semanal do profissional informada e válida
  if (Array.isArray(professionalSchedule) && professionalSchedule.length > 0) {
    const candidateSlots = generateBarberSlotsForDate(dateString, professionalSchedule, {
      durationMinutes: duration,
      slotStepMinutes: 30,
    });

    return candidateSlots.map((slotTime) => {
      if (simulatedFullyBooked) {
        return {
          time: slotTime,
          available: false,
          isOccupied: true,
          occupiedReason: 'Horário já reservado',
        };
      }

      const newStart = timeToMinutes(slotTime);
      const newEnd = newStart + duration;

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

  // 2. Caminho de Fallback Legado: Preservado exclusivamente para chamadores existentes
  // quando a agenda semanal do profissional não for fornecida.
  if (simulatedFullyBooked) {
    return BASE_DAY_TIME_SLOTS.map((t) => ({
      time: t,
      available: false,
      isOccupied: true,
      occupiedReason: 'Horário já reservado',
    }));
  }

  const closingTimeMinutes = 20 * 60;

  return BASE_DAY_TIME_SLOTS.map((slotTime) => {
    const newStart = timeToMinutes(slotTime);
    const newEnd = newStart + duration;

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
 * Saves booking confirmation through the serverless transactional endpoint (/api/bookings/create)
 * and returns the created Appointment.
 *
 * Em modo de Preview / Demo Mode (sem chaves do Firebase configuradas), gera um agendamento
 * simulado em memória para preservar a interatividade da UI sem erros 500.
 */
export async function createBooking(
  request: {
    services?: Service[];
    service?: Service | null;
    professional: Professional;
    professionalId?: string;
    professionalName?: string;
    selectedDate: DayOption;
    selectedTime: string;
    clientInfo: ClientInfo;
    simulateConflict?: boolean;
    simulateDelayMs?: number;
    clientRequestId?: string;
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

  // Resolve professional if 'any' was selected
  let assignedProfessional = request.professional;
  if (request.professional?.id === ANY_PROFESSIONAL_ID) {
    assignedProfessional = MOCK_PROFESSIONALS[0];
  }

  // Map services to reflect the assigned professional's effective durations for client display
  const effectiveServices = selectedServices.map((s) => ({
    ...s,
    durationMinutes: resolveBarberServiceDuration(s, assignedProfessional as any),
  }));

  const localTotalPrice = effectiveServices.reduce((sum, s) => sum + Number(s.price), 0);
  const localDurationMinutes = calculateTotalEffectiveDuration(effectiveServices, assignedProfessional as any);
  const primaryService = effectiveServices[0];

  // Geração de clientRequestId estável e único para garantia de idempotência no backend
  const clientRequestId =
    request.clientRequestId && request.clientRequestId.trim().length >= 8
      ? request.clientRequestId.trim()
      : typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? 'req_' + crypto.randomUUID()
      : 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);

  // Fallback seguro de Preview / Demo Mode caso o Firebase não esteja configurado no ambiente
  if (!isFirebaseConfigured) {
    if (request.simulateConflict) {
      throw new Error('SLOT_CONFLICT');
    }
    const mockId = 'preview-' + Math.random().toString(36).substring(2, 9);
    const randomCode = `#JB-${mockId.slice(-4).toUpperCase()}`;
    return {
      id: mockId,
      code: randomCode,
      barbershop: MOCK_BARBERSHOP,
      services: effectiveServices,
      service: primaryService,
      professional: assignedProfessional,
      professionalId: assignedProfessional.id,
      professionalName: assignedProfessional.name,
      dateString: request.selectedDate.dateString,
      formattedDate: request.selectedDate.fullFormattedDate,
      time: request.selectedTime,
      clientInfo: request.clientInfo,
      totalPrice: localTotalPrice,
      durationMinutes: localDurationMinutes,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
    };
  }

  // Se houver simulação de conflito ativada manualmente para testes de UI
  if (request.simulateConflict) {
    throw new Error('SLOT_CONFLICT');
  }

  // Montagem do payload seguro (apenas identificadores canônicos, sem campos de autoridade de preço/duração)
  const payload = {
    businessId: 'joao-barber',
    serviceIds: selectedServices.map((s) => s.id),
    professionalId: assignedProfessional.id,
    date: request.selectedDate.dateString,
    time: request.selectedTime,
    clientInfo: {
      name: request.clientInfo.name.trim(),
      phone: request.clientInfo.phone.trim(),
      whatsappOptIn: request.clientInfo.whatsappOptIn === true,
    },
    clientRequestId,
  };

  let response: Response;
  try {
    response = await fetch('/api/bookings/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (networkErr: any) {
    console.error('[bookingData] Falha na requisição de rede para /api/bookings/create:', networkErr);
    throw new Error('ERRO_CONEXAO_SERVIDOR');
  }

  let responseData: any = null;
  try {
    responseData = await response.json();
  } catch {
    console.error('[bookingData] Resposta não-JSON recebida de /api/bookings/create (Status:', response.status, ')');
    throw new Error('ERRO_SERVIDOR_RESPOSTA_INVALIDA');
  }

  if (!response.ok) {
    const errorCode = responseData?.error?.code;
    const errorMessage = responseData?.error?.message;

    // Conflitos de horário ou de idempotência que requerem nova escolha de horário pelo usuário
    if (response.status === 409 || errorCode === 'SLOT_CONFLICT') {
      throw new Error('SLOT_CONFLICT');
    }

    if (errorCode === 'IDEMPOTENCY_CONFLICT') {
      throw new Error('IDEMPOTENCY_CONFLICT');
    }

    if (response.status === 400 || errorCode === 'INVALID_DATA') {
      throw new Error(errorMessage || 'DADOS_INVALIDOS');
    }

    if (response.status === 404) {
      throw new Error(errorMessage || 'RECURSO_NAO_ENCONTRADO');
    }

    if (response.status === 403) {
      throw new Error(errorMessage || 'PROFISSIONAL_INDISPONIVEL');
    }

    if (response.status === 503 || errorCode === 'FIREBASE_CONFIG_ERROR') {
      throw new Error(errorMessage || 'SERVICO_INDISPONIVEL');
    }

    throw new Error(errorMessage || 'ERRO_CRIACAO_RESERVA');
  }

  const serverAppointment = responseData.appointment;
  if (!serverAppointment || !serverAppointment.id) {
    throw new Error('ERRO_SERVIDOR_DADOS_INCOMPLETOS');
  }

  const randomCode = `#JB-${serverAppointment.id.slice(-4).toUpperCase()}`;

  const appointment: Appointment = {
    id: serverAppointment.id,
    code: randomCode,
    barbershop: MOCK_BARBERSHOP,
    services: effectiveServices,
    service: primaryService,
    professional: assignedProfessional,
    professionalId: serverAppointment.professionalId || assignedProfessional.id,
    professionalName: serverAppointment.professionalName || assignedProfessional.name,
    dateString: request.selectedDate.dateString,
    formattedDate: request.selectedDate.fullFormattedDate,
    time: serverAppointment.time || request.selectedTime,
    clientInfo: request.clientInfo,
    totalPrice: typeof serverAppointment.totalPrice === 'number' ? serverAppointment.totalPrice : localTotalPrice,
    durationMinutes: typeof serverAppointment.duration === 'number' ? serverAppointment.duration : localDurationMinutes,
    createdAt: serverAppointment.createdAt || new Date().toISOString(),
    status: (serverAppointment.status as any) || 'confirmed',
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

