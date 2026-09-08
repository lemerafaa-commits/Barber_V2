import { WhatsAppProvider } from './providers/whatsappProvider.js';
import { TwilioWhatsAppProvider } from './providers/twilioWhatsAppProvider.js';
import { AppointmentNotificationPayload, NotificationResult } from './types.js';

export class NotificationService {
  private provider: WhatsAppProvider;

  constructor(provider?: WhatsAppProvider) {
    this.provider = provider || new TwilioWhatsAppProvider();
  }

  /**
   * Processes an appointment notification request.
   * Enforces businessId checking, input validation, opt-in consent, and provider delegation.
   */
  async processAppointmentConfirmation(
    payload: AppointmentNotificationPayload
  ): Promise<NotificationResult> {
    // 1. Validate payload structure
    if (!payload || typeof payload !== 'object') {
      return {
        success: false,
        status: 'INVALID_APPOINTMENT',
        error: 'INVALID_PAYLOAD',
      };
    }

    const {
      appointmentId,
      businessId,
      customerName,
      customerPhone,
      appointmentDate,
      appointmentTime,
      whatsappOptIn,
    } = payload;

    if (
      !appointmentId ||
      !businessId ||
      !customerName ||
      !customerPhone ||
      !appointmentDate ||
      !appointmentTime
    ) {
      return {
        success: false,
        status: 'INVALID_APPOINTMENT',
        error: 'MISSING_REQUIRED_FIELDS',
      };
    }

    // Tenant boundary check: Ensure notification is for João Barber
    if (businessId !== 'joao-barber') {
      console.warn(`[WhatsApp] Rejected confirmation for unauthorized businessId: ${businessId}`);
      return {
        success: false,
        status: 'INVALID_APPOINTMENT',
        error: 'UNAUTHORIZED_BUSINESS_ID',
      };
    }

    // 2. Opt-in verification
    // Rule: whatsappOptIn === true -> can send.
    // whatsappOptIn === false or missing/undefined -> do not send.
    if (whatsappOptIn !== true) {
      console.log(`[WhatsApp] [Apt:${appointmentId}] Opt-in not granted. Skipping WhatsApp notification.`);
      return {
        success: true,
        status: 'NOT_OPTED_IN',
        reason: 'OPT_IN_NOT_GRANTED',
      };
    }

    // 3. Delegate to WhatsApp provider
    return this.provider.sendAppointmentConfirmation(payload);
  }
}

// Export singleton instance for convenience
export const notificationService = new NotificationService();
