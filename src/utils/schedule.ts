import { DaySchedule, ScheduleBreak } from '../types/admin';

/**
 * Converte string no formato "HH:mm" em minutos a partir da meia-noite (0 - 1439).
 * Retorna -1 se o formato for inválido.
 */
export function timeStringToMinutes(timeStr: string | null | undefined): number {
  if (!timeStr || typeof timeStr !== 'string') return -1;
  const parts = timeStr.trim().split(':');
  if (parts.length !== 2) return -1;

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return -1;
  }

  return hours * 60 + minutes;
}

/**
 * Converte minutos a partir da meia-noite no formato "HH:mm".
 */
export function minutesToTimeString(totalMinutes: number): string {
  const normalized = Math.max(0, Math.min(1439, Math.floor(totalMinutes)));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Valida estritamente se uma string de data está no formato exato "YYYY-MM-DD"
 * e representa uma data real e existente no calendário gregoriano (sem overflow automático).
 */
export function isValidDateString(dateString: string | null | undefined): boolean {
  if (!dateString || typeof dateString !== 'string') return false;
  const trimmed = dateString.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;

  const parts = trimmed.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const date = new Date(year, month - 1, day);
  return (
    !isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Extrai o índice do dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
 * a partir de uma data no formato "YYYY-MM-DD" usando hora local (sem drift de fuso horário UTC).
 * Retorna -1 se a data for inválida, inexistente no calendário ou em formato incorreto.
 */
export function getDayOfWeekFromDateString(dateString: string | null | undefined): number {
  if (!dateString || typeof dateString !== 'string') return -1;
  const trimmed = dateString.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return -1;

  const parts = trimmed.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return -1;

  const date = new Date(year, month - 1, day);
  if (
    isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return -1;
  }

  return date.getDay();
}

/**
 * Localiza a configuração da agenda correspondente a uma data "YYYY-MM-DD"
 * na lista de DaySchedule[] do profissional.
 */
export function findDayScheduleForDate(
  dateString: string,
  schedule: DaySchedule[] | null | undefined
): DaySchedule | null {
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) return null;
  const targetDayOfWeek = getDayOfWeekFromDateString(dateString);
  if (targetDayOfWeek === -1) return null;

  return schedule.find((d) => d.dayOfWeek === targetDayOfWeek) || null;
}

export interface NormalizedInterval {
  startMinutes: number;
  endMinutes: number;
}

/**
 * Normaliza os intervalos de pausa/almoço a partir do DaySchedule,
 * unificando a retrocompatibilidade (breakStartTime/breakEndTime) com a lista moderna de `breaks`.
 */
export function extractDayScheduleBreaks(daySchedule: DaySchedule): NormalizedInterval[] {
  const intervals: NormalizedInterval[] = [];

  // 1. Pausas da lista moderna (breaks: ScheduleBreak[])
  if (Array.isArray(daySchedule.breaks) && daySchedule.breaks.length > 0) {
    for (const b of daySchedule.breaks) {
      if (b && typeof b === 'object') {
        const start = timeStringToMinutes(b.startTime);
        const end = timeStringToMinutes(b.endTime);
        if (start >= 0 && end > start) {
          intervals.push({ startMinutes: start, endMinutes: end });
        }
      }
    }
  }

  // 2. Retrocompatibilidade: breakStartTime e breakEndTime caso a lista moderna esteja vazia
  if (intervals.length === 0 && daySchedule.breakStartTime && daySchedule.breakEndTime) {
    const start = timeStringToMinutes(daySchedule.breakStartTime);
    const end = timeStringToMinutes(daySchedule.breakEndTime);
    if (start >= 0 && end > start) {
      intervals.push({ startMinutes: start, endMinutes: end });
    }
  }

  return intervals;
}

export interface BarberDaySlotOptions {
  /**
   * Duração mínima requerida para o atendimento em minutos.
   * O horário só será gerado se o slot comportar integralmente o atendimento antes do fim da jornada ou de pausas.
   * Padrão: 30 minutos.
   */
  durationMinutes?: number;

  /**
   * Intervalo/passo de geração entre os horários de início consecutivos em minutos.
   * Padrão: 30 minutos (alinhado a BASE_DAY_TIME_SLOTS).
   */
  slotStepMinutes?: number;
}

/**
 * Motor Central Puro de Geração de Horários Individuais do Profissional (Fase 4B.1).
 *
 * Gera a grade de horários de início elegíveis para um profissional com base nas regras do dia:
 * - Se `isDayOff: true` ou configuração ausente/inválida: retorna array vazio [].
 * - Respeita os limites da jornada: o início deve ser >= startTime e o término (início + duração) <= endTime.
 * - Respeita os intervalos de descanso: nenhum atendimento pode sobrepor intervalos de pausa.
 * - Trata fronteiras com exatidão: um atendimento PODE terminar exatamente no início de uma pausa,
 *   e PODE começar exatamente no término de uma pausa, mas NÃO PODE invadi-la.
 *
 * Função 100% Pura:
 * - Não faz chamadas de rede ou Firestore.
 * - Não acessa nem modifica estado externo.
 * - Não muta os parâmetros de entrada.
 */
export function generateBarberDaySlots(
  daySchedule: DaySchedule | null | undefined,
  options: BarberDaySlotOptions = {}
): string[] {
  if (!daySchedule || typeof daySchedule !== 'object') {
    return [];
  }

  // 1. Dia de folga -> sem horários disponíveis
  if (daySchedule.isDayOff === true) {
    return [];
  }

  const shiftStart = timeStringToMinutes(daySchedule.startTime);
  const shiftEnd = timeStringToMinutes(daySchedule.endTime);

  // 2. Horários de expediente inválidos ou incoerentes
  if (shiftStart < 0 || shiftEnd <= shiftStart) {
    return [];
  }

  const duration =
    typeof options.durationMinutes === 'number' &&
    Number.isFinite(options.durationMinutes) &&
    options.durationMinutes > 0
      ? Math.floor(options.durationMinutes)
      : 30;

  const step =
    typeof options.slotStepMinutes === 'number' &&
    Number.isFinite(options.slotStepMinutes) &&
    options.slotStepMinutes > 0
      ? Math.floor(options.slotStepMinutes)
      : 30;

  // Se a duração solicitada for maior que o expediente total do dia
  if (duration > shiftEnd - shiftStart) {
    return [];
  }

  const breaks = extractDayScheduleBreaks(daySchedule);
  const slots: string[] = [];

  // Itera pelos horários candidatos de início
  for (let currentStart = shiftStart; currentStart + duration <= shiftEnd; currentStart += step) {
    const currentEnd = currentStart + duration;

    // Verifica sobreposição com intervalos de pausa:
    // Dois intervalos [A, B) e [C, D) se sobrepõem se e somente se A < D && B > C.
    // Atendimento: [currentStart, currentEnd)
    // Pausa: [break.startMinutes, break.endMinutes)
    const collidesWithBreak = breaks.some(
      (brk) => currentStart < brk.endMinutes && currentEnd > brk.startMinutes
    );

    if (!collidesWithBreak) {
      slots.push(minutesToTimeString(currentStart));
    }
  }

  return slots;
}

/**
 * Helper complementar que resolve a agenda da data específica a partir da lista semanal
 * e gera os horários elegíveis do profissional.
 */
export function generateBarberSlotsForDate(
  dateString: string,
  schedule: DaySchedule[] | null | undefined,
  options: BarberDaySlotOptions = {}
): string[] {
  const daySchedule = findDayScheduleForDate(dateString, schedule);
  return generateBarberDaySlots(daySchedule, options);
}
