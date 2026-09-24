export type MasterTab =
  | 'overview'
  | 'network'
  | 'businesses'
  | 'users'
  | 'appointments'
  | 'subscriptions'
  | 'reports'
  | 'settings'
  | 'profile';

export type BusinessStatus = 'active' | 'trial' | 'suspended' | 'cancelled';
export type SubscriptionPlan = 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trial' | 'past_due' | 'cancelled';
export type UserRole = 'master' | 'business_admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

export interface MasterBusiness {
  id: string; // e.g. 'biz_01' (future multi-tenant businessId)
  name: string;
  slug: string;
  ownerUserId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  status: BusinessStatus;
  plan: SubscriptionPlan;
  appointmentCount: number;
  monthlyRevenue: number;
  city: string;
  state: string;
  createdAt: string;
  lastActiveAt: string;
  // Future cancellation audit fields
  cancelledAt?: string;
  previousPlan?: SubscriptionPlan;
  cancelReason?: string;
  cancelFeedback?: string;
  cancellationsCount?: number;
}

export interface MasterUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  businessId?: string;
  businessName?: string;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string;
  phone?: string;
}

export interface AppointmentStatusHistory {
  id: string;
  appointmentId: string;
  fromStatus: AppointmentStatus;
  toStatus: AppointmentStatus;
  changedBy: string;
  changedByRole: 'master' | 'business_admin' | 'barber' | 'system';
  reason: string;
  changedAt: string;
}

export interface MasterAppointment {
  id: string;
  businessId: string;
  businessName: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  service: string;
  totalPrice: number;
  status: AppointmentStatus;
  barberName?: string;
  durationMinutes?: number;
  createdAt: string;
  statusHistory?: AppointmentStatusHistory[];
}

export interface MasterSubscription {
  id: string;
  businessId: string;
  businessName: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  createdAt: string;
  nextBillingAt: string;
  paymentMethod: string;
}

export interface MasterActivityItem {
  id: string;
  type:
    | 'business_registered'
    | 'user_created'
    | 'appointment_booked'
    | 'subscription_activated'
    | 'subscription_cancelled'
    | 'system_alert';
  title: string;
  description: string;
  businessName?: string;
  timestamp: string;
  badgeLabel: string;
  badgeColor: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple';
}

export interface PlatformMetrics {
  totalBusinesses: number;
  activeBusinesses: number;
  trialBusinesses: number;
  suspendedBusinesses: number;
  totalAppointments: number;
  appointmentsThisMonth: number;
  platformRevenueMRR: number;
  totalPlatformUsers: number;
  averageTicket: number;
  growthRatePercent: number;
}

export interface RetentionMetrics {
  newBusinesses: number;
  churnedBusinesses: number;
  netGrowth: number;
  churnRatePercent: number;
  lostMRR: number;
  periodLabel: string;
}

export interface MonthlyCohortDataPoint {
  month: string;
  joined: number;
  left: number;
  net: number;
  activeTotal: number;
  mrrGained: number;
  mrrLost: number;
}

export interface ChartDataPoint {
  label: string;
  appointments: number;
  revenue: number;
  businesses: number;
}
