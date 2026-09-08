export interface NotificationServiceItem {
  name: string;
  price: number;
  selectedOption?: string;
}

export interface AppointmentNotificationPayload {
  appointmentId: string;
  businessId: string;
  customerName: string;
  customerPhone: string;
  appointmentDate: string; // YYYY-MM-DD or formatted date
  appointmentTime: string; // HH:mm
  services?: NotificationServiceItem[];
  totalPrice?: number;
  whatsappOptIn?: boolean;
}

export type NotificationStatus =
  | 'SENT'
  | 'SKIPPED'
  | 'TEMPLATE_NOT_CONFIGURED'
  | 'INVALID_APPOINTMENT'
  | 'NOT_OPTED_IN'
  | 'PROVIDER_ERROR'
  | 'SERVER_ERROR';

export interface NotificationResult {
  success: boolean;
  status: NotificationStatus;
  messageId?: string;
  reason?: string;
  error?: string;
}
