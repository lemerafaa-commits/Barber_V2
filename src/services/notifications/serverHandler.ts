import { notificationService } from './notificationService';
import {
  getRealAppointmentById,
  markAppointmentNotificationSent,
  RealAppointmentRecord,
} from '../firebase/serverDb';
import { AppointmentNotificationPayload, NotificationStatus } from './types';

export interface ServerHandlerResponse {
  status: number;
  body: {
    success: boolean;
    status: NotificationStatus;
    messageId?: string;
    reason?: string;
    error?: string;
  };
}

const EXPECTED_BUSINESS_ID = 'joao-barber';

/**
 * Framework-agnostic server-side request handler for appointment confirmations.
 * Compatible with Vercel Serverless Functions, Express, and Vite dev middleware.
 * 
 * CRITICAL SECURITY PRINCIPLE:
 * The endpoint NEVER trusts customer data (name, phone, date, time, opt-in) from the client request.
 * It strictly fetches the REAL appointment document from Firestore on the server side
 * and uses that document as the authoritative single source of truth.
 */
export async function handleNotificationRequest(
  payload: any
): Promise<ServerHandlerResponse> {
  try {
    if (!payload || typeof payload !== 'object') {
      return {
        status: 400,
        body: {
          success: false,
          status: 'INVALID_APPOINTMENT',
          error: 'Corpo da requisição inválido ou vazio.',
        },
      };
    }

    const rawAppointmentId = payload.appointmentId;
    if (
      typeof rawAppointmentId !== 'string' ||
      !rawAppointmentId.trim() ||
      rawAppointmentId.trim().length > 128
    ) {
      return {
        status: 400,
        body: {
          success: false,
          status: 'INVALID_APPOINTMENT',
          error: 'appointmentId ausente ou em formato inválido.',
        },
      };
    }

    const appointmentId = rawAppointmentId.trim();

    // 1. Fetch the REAL appointment from Firestore using server-side admin privileges
    let realAppointment: RealAppointmentRecord | null = null;
    try {
      realAppointment = await getRealAppointmentById(appointmentId);
    } catch (dbErr: any) {
      console.error(`[WhatsApp Server] Database query failed for appointment ${appointmentId}:`, dbErr?.message);
      return {
        status: 200,
        body: {
          success: false,
          status: 'PROVIDER_ERROR',
          error: 'Falha ao validar agendamento no banco de dados.',
        },
      };
    }

    // 2. Check if appointment exists
    if (!realAppointment) {
      console.warn(`[WhatsApp Server] Appointment ${appointmentId} was not found in Firestore. Rejecting.`);
      return {
        status: 200,
        body: {
          success: false,
          status: 'INVALID_APPOINTMENT',
          error: 'Agendamento não encontrado.',
        },
      };
    }

    // 3. Confirm tenant ownership (must match João Barber)
    if (realAppointment.businessId !== EXPECTED_BUSINESS_ID) {
      console.warn(
        `[WhatsApp Server] Appointment ${appointmentId} belongs to business "${realAppointment.businessId}", not "${EXPECTED_BUSINESS_ID}". Rejecting.`
      );
      return {
        status: 200,
        body: {
          success: false,
          status: 'INVALID_APPOINTMENT',
          error: 'Agendamento não pertence a esta barbearia.',
        },
      };
    }

    // 4. Confirm explicit opt-in on the real appointment
    if (realAppointment.whatsappOptIn !== true) {
      console.log(`[WhatsApp Server] Appointment ${appointmentId} did not opt in to WhatsApp. Skipping.`);
      return {
        status: 200,
        body: {
          success: true,
          status: 'NOT_OPTED_IN',
          reason: 'OPT_IN_NOT_GRANTED',
        },
      };
    }

    // 5. Server-side idempotency check (check if already marked sent)
    if (realAppointment.whatsappNotificationSent === true) {
      console.log(`[WhatsApp Server] Appointment ${appointmentId} notification already sent previously. Skipping.`);
      return {
        status: 200,
        body: {
          success: true,
          status: 'SKIPPED',
          reason: 'ALREADY_SENT',
        },
      };
    }

    // 6. Build notification payload SOLELY from the real appointment in Firestore
    const authoritativePayload: AppointmentNotificationPayload = {
      appointmentId: realAppointment.id,
      businessId: realAppointment.businessId,
      customerName: realAppointment.customerName,
      customerPhone: realAppointment.customerPhone,
      appointmentDate: realAppointment.date,
      appointmentTime: realAppointment.time,
      services: realAppointment.services,
      totalPrice: realAppointment.totalPrice,
      whatsappOptIn: realAppointment.whatsappOptIn,
    };

    // 7. Dispatch via NotificationService
    const result = await notificationService.processAppointmentConfirmation(authoritativePayload);

    // If sent successfully, mark in Firestore to guarantee persistent server-side idempotency
    if (result.success && result.status === 'SENT') {
      await markAppointmentNotificationSent(realAppointment.id);
    }

    // Return controlled response without leaking sensitive provider details
    return {
      status: 200,
      body: {
        success: result.success,
        status: result.status,
        messageId: result.messageId,
        reason: result.reason,
        error: result.error,
      },
    };
  } catch (err: any) {
    // Sanitized server-side error log
    console.error('[WhatsApp Server] Unexpected error in handleNotificationRequest:', err?.message || err);
    return {
      status: 200,
      body: {
        success: false,
        status: 'SERVER_ERROR',
        error: 'Erro interno ao processar notificação.',
      },
    };
  }
}
