import { Appointment } from '../../types/booking';

// In-memory set to prevent duplicate notification triggers within the session
const sentAppointmentIds = new Set<string>();

/**
 * Triggers WhatsApp confirmation for an appointment in an isolated, non-blocking manner.
 * 
 * CRITICAL RULE:
 * This function MUST NEVER throw an error to the caller. Any network failure,
 * timeout, invalid phone, or Twilio failure is caught, logged, and silenced,
 * so the confirmed appointment in Firestore is NEVER disrupted or invalidated.
 */
export async function triggerWhatsAppConfirmation(
  appointment: Appointment
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  if (!appointment || !appointment.id) {
    return { success: false, error: 'NO_APPOINTMENT' };
  }

  // Idempotency: Prevent duplicate dispatch for the same appointment in this session
  if (sentAppointmentIds.has(appointment.id)) {
    console.log(`[WhatsApp Client] Notification already triggered for appointment ${appointment.id}. Skipping.`);
    return { success: true, skipped: true };
  }

  // Opt-in check
  const isOptedIn = appointment.clientInfo?.whatsappOptIn === true;
  if (!isOptedIn) {
    console.log(`[WhatsApp Client] Opt-in was not granted for appointment ${appointment.id}. Skipping.`);
    return { success: true, skipped: true };
  }

  sentAppointmentIds.add(appointment.id);

  try {
    const payload = {
      appointmentId: appointment.id,
      businessId: 'joao-barber',
    };

    const response = await fetch('/api/whatsapp/confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      console.warn(
        `[WhatsApp Client] Notification returned non-success status (non-critical):`,
        data?.error || response.statusText
      );
      return { success: false, error: data?.error || 'NOTIFICATION_FAILED' };
    }

    console.log(`[WhatsApp Client] Notification dispatched successfully for appointment ${appointment.id}`);
    return { success: true };
  } catch (networkErr: any) {
    // Non-blocking: Catch network / fetch errors so appointment success is NEVER affected
    console.warn(
      `[WhatsApp Client] Network error when requesting WhatsApp notification (non-critical):`,
      networkErr?.message || networkErr
    );
    return { success: false, error: networkErr?.message || 'NETWORK_ERROR' };
  }
}
