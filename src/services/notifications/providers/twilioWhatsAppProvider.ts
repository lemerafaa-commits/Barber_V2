import twilio from 'twilio';
import { WhatsAppProvider } from './whatsappProvider.js';
import { AppointmentNotificationPayload, NotificationResult } from '../types.js';

/**
 * Normalizes user-supplied phone string into international WhatsApp E.164 format:
 * whatsapp:+<E164>
 */
export function normalizeWhatsAppRecipient(phone: string): string | null {
  if (!phone || typeof phone !== 'string') return null;

  // Extract all digit characters
  const digits = phone.replace(/\D/g, '');

  // If starts with 55 (Brazil country code) and has 12 or 13 digits:
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return `whatsapp:+${digits}`;
  }

  // Standard Brazilian phone with DDD (10 digits for landline, 11 for mobile):
  // Prepend 55 (Brazil)
  if (digits.length === 10 || digits.length === 11) {
    return `whatsapp:+55${digits}`;
  }

  // Already includes international country code (10 to 15 digits):
  if (digits.length >= 10 && digits.length <= 15) {
    return `whatsapp:+${digits}`;
  }

  return null;
}

export class TwilioWhatsAppProvider implements WhatsAppProvider {
  readonly providerName = 'TwilioWhatsApp';

  private twilioClient: twilio.Twilio | null = null;

  /**
   * Lazily initializes Twilio client to prevent crashes at module load time
   * if credentials have not yet been populated.
   */
  private getClient(): twilio.Twilio {
    if (!this.twilioClient) {
      const apiKeySid = process.env.TWILIO_API_KEY_SID;
      const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
      const accountSid = process.env.TWILIO_ACCOUNT_SID;

      if (!apiKeySid || !apiKeySecret || !accountSid) {
        throw new Error('TWILIO_CREDENTIALS_MISSING');
      }

      this.twilioClient = twilio(apiKeySid, apiKeySecret, {
        accountSid,
      });
    }

    return this.twilioClient;
  }

  async sendAppointmentConfirmation(
    payload: AppointmentNotificationPayload
  ): Promise<NotificationResult> {
    const { appointmentId, customerName, customerPhone, appointmentDate, appointmentTime } = payload;

    try {
      // 1. Validate environment configuration
      const fromEnv = process.env.TWILIO_WHATSAPP_FROM;
      if (!fromEnv) {
        console.warn(`[WhatsApp] [Apt:${appointmentId}] TWILIO_WHATSAPP_FROM is not configured`);
        return {
          success: false,
          status: 'PROVIDER_ERROR',
          error: 'TWILIO_WHATSAPP_FROM_MISSING',
        };
      }

      // Ensure 'whatsapp:' prefix is present without duplication
      const fromNumber = fromEnv.startsWith('whatsapp:') ? fromEnv : `whatsapp:${fromEnv}`;

      // 2. Validate and normalize recipient phone
      const toNumber = normalizeWhatsAppRecipient(customerPhone);
      if (!toNumber) {
        console.warn(`[WhatsApp] [Apt:${appointmentId}] Invalid phone format: ${customerPhone.slice(0, 4)}***`);
        return {
          success: false,
          status: 'PROVIDER_ERROR',
          error: 'INVALID_PHONE_FORMAT',
        };
      }

      // 3. Template validation (Strict Rule: No freeform messages allowed for business-initiated chats)
      // Twilio ContentSid: HXfe5ab5f00277942d4d4200328b4d403c (substituindo HXb5b62575e6e4ff6129ad7c8efe1f983e)
      const contentSid =
        process.env.TWILIO_CONTENT_SID &&
        process.env.TWILIO_CONTENT_SID.trim() !== 'HXb5b62575e6e4ff6129ad7c8efe1f983e'
          ? process.env.TWILIO_CONTENT_SID.trim()
          : 'HXfe5ab5f00277942d4d4200328b4d403c';
      if (!contentSid || contentSid.trim().length === 0) {
        console.warn(
          `[WhatsApp] [Apt:${appointmentId}] TWILIO_CONTENT_SID is not configured. Freeform messages are blocked. Notification skipped.`
        );
        return {
          success: false,
          status: 'TEMPLATE_NOT_CONFIGURED',
          error: 'TWILIO_CONTENT_SID is not configured',
        };
      }

      // 4. Initialize client lazily
      let client: twilio.Twilio;
      try {
        client = this.getClient();
      } catch (clientErr: any) {
        console.warn(`[WhatsApp] [Apt:${appointmentId}] Could not initialize Twilio client: ${clientErr?.message}`);
        return {
          success: false,
          status: 'PROVIDER_ERROR',
          error: 'TWILIO_CREDENTIALS_MISSING',
        };
      }

      // Safe sanitized diagnostic logs before sending
      const hasAccountSid = Boolean(process.env.TWILIO_ACCOUNT_SID?.trim());
      const hasApiKeySid = Boolean(process.env.TWILIO_API_KEY_SID?.trim());
      const hasFrom = Boolean(fromNumber);
      const trimmedContentSid = contentSid.trim();
      const hasContentSid = Boolean(trimmedContentSid);
      const contentSidPrefix = trimmedContentSid.length >= 2 ? trimmedContentSid.slice(0, 2) : '(none)';

      console.log(`[Twilio Diagnostic] Account SID presente: ${hasAccountSid ? 'sim' : 'não'}`);
      console.log(`[Twilio Diagnostic] API Key SID presente: ${hasApiKeySid ? 'sim' : 'não'}`);
      console.log(`[Twilio Diagnostic] From presente: ${hasFrom ? 'sim' : 'não'}`);
      console.log(`[Twilio Diagnostic] ContentSid presente: ${hasContentSid ? 'sim' : 'não'}`);
      console.log(`[Twilio Diagnostic] ContentSid prefixo: ${contentSidPrefix}`);
      console.log(`[Twilio Diagnostic] Quantidade de ContentVariables: 2`);

      const message = await client.messages.create({
        from: fromNumber,
        to: toNumber,
        contentSid: trimmedContentSid,
        contentVariables: JSON.stringify({
          '1': appointmentDate,
          '2': appointmentTime,
        }),
      });

      console.log(`[Twilio Diagnostic] Resultado da chamada Twilio: SUCESSO`);
      console.log(`[Twilio Diagnostic] Twilio Message SID: ${message.sid}`);

      return {
        success: true,
        status: 'SENT',
        messageId: message.sid,
      };
    } catch (err: any) {
      console.error(`[Twilio Diagnostic] Resultado da chamada Twilio: ERRO`);
      if (err?.code !== undefined) {
        console.error(`[Twilio Diagnostic] Código de erro Twilio: ${err.code}`);
      }
      if (err?.status !== undefined) {
        console.error(`[Twilio Diagnostic] Status HTTP Twilio: ${err.status}`);
      }
      console.error(`[Twilio Diagnostic] Mensagem de erro Twilio: ${err?.message || 'Erro desconhecido'}`);

      // Safe sanitized logging - never log credentials, API keys, or raw tokens
      console.error(
        `[WhatsApp] [Apt:${appointmentId}] Failed to send confirmation:`,
        err?.message || 'Unknown Twilio error'
      );

      return {
        success: false,
        status: 'PROVIDER_ERROR',
        error: err?.message || 'TWILIO_SEND_ERROR',
      };
    }
  }
}
