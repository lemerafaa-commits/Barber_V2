import { AppointmentNotificationPayload, NotificationResult } from '../types.js';

/**
 * Common interface for WhatsApp communication providers.
 * Decouples domain logic from specific third-party APIs (Twilio, Z-API, Meta Cloud API, etc.)
 */
export interface WhatsAppProvider {
  readonly providerName: string;

  /**
   * Sends an appointment confirmation to the customer's WhatsApp.
   * Must never throw an uncaught exception to caller.
   */
  sendAppointmentConfirmation(
    payload: AppointmentNotificationPayload
  ): Promise<NotificationResult>;
}
