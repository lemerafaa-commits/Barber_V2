import {
  MasterBusiness,
  MasterUser,
  MasterAppointment,
  MasterSubscription,
  MasterActivityItem,
  PlatformMetrics,
  ChartDataPoint,
  RetentionMetrics,
  MonthlyCohortDataPoint,
} from '../types/master';

/**
 * masterMockData.ts
 *
 * Limpeza V4_06: Remoção de dados fictícios da plataforma Master.
 * As constantes são mantidas para compatibilidade de tipagem e integridade do build,
 * mas vazias / zeradas para impedir qualquer exibição ou fallback de dados simulados.
 */

export const MOCK_MASTER_BUSINESSES: MasterBusiness[] = [];

export const MOCK_MASTER_USERS: MasterUser[] = [];

export const MOCK_MASTER_APPOINTMENTS: MasterAppointment[] = [];

export const MOCK_MASTER_SUBSCRIPTIONS: MasterSubscription[] = [];

export const MOCK_MASTER_ACTIVITIES: MasterActivityItem[] = [];

export const MOCK_PLATFORM_METRICS: PlatformMetrics = {
  totalBusinesses: 0,
  activeBusinesses: 0,
  trialBusinesses: 0,
  suspendedBusinesses: 0,
  totalAppointments: 0,
  appointmentsThisMonth: 0,
  platformRevenueMRR: 0.0,
  totalPlatformUsers: 0,
  averageTicket: 0.0,
  growthRatePercent: 0.0,
};

export const MOCK_RETENTION_METRICS: RetentionMetrics = {
  newBusinesses: 0,
  churnedBusinesses: 0,
  netGrowth: 0,
  churnRatePercent: 0.0,
  lostMRR: 0.0,
  periodLabel: 'Histórico inicial',
};

export const MOCK_MONTHLY_COHORTS: MonthlyCohortDataPoint[] = [];

export const MOCK_GROWTH_CHART: ChartDataPoint[] = [];
