import {
  MOCK_MASTER_BUSINESSES,
  MOCK_MASTER_USERS,
  MOCK_MASTER_APPOINTMENTS,
  MOCK_MASTER_SUBSCRIPTIONS,
  MOCK_MASTER_ACTIVITIES,
  MOCK_PLATFORM_METRICS,
  MOCK_RETENTION_METRICS,
  MOCK_MONTHLY_COHORTS,
  MOCK_GROWTH_CHART,
} from '../../data/masterMockData';
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
  AppointmentStatus,
  AppointmentStatusHistory,
} from '../../types/master';

// In-memory state clone for local session reactivity
let localAppointments: MasterAppointment[] = [...MOCK_MASTER_APPOINTMENTS];

/**
 * Master Data Service
 *
 * Abstraction layer for Master Dashboard data queries.
 * In this phase, it returns structured, multi-tenant prepared MOCK data asynchronously.
 * In future phases, these methods can seamlessly plug into Firestore collections:
 *  - /businesses
 *  - /users
 *  - /appointments (global query across all businessId)
 *  - /subscriptions
 */
export class MasterDataService {
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    return Promise.resolve({ ...MOCK_PLATFORM_METRICS });
  }

  async getRetentionMetrics(): Promise<RetentionMetrics> {
    return Promise.resolve({ ...MOCK_RETENTION_METRICS });
  }

  async getMonthlyCohorts(): Promise<MonthlyCohortDataPoint[]> {
    return Promise.resolve([...MOCK_MONTHLY_COHORTS]);
  }

  async getBusinesses(): Promise<MasterBusiness[]> {
    return Promise.resolve([...MOCK_MASTER_BUSINESSES]);
  }

  async getBusinessById(businessId: string): Promise<MasterBusiness | null> {
    const biz = MOCK_MASTER_BUSINESSES.find((b) => b.id === businessId);
    return Promise.resolve(biz ? { ...biz } : null);
  }

  async getUsers(): Promise<MasterUser[]> {
    return Promise.resolve([...MOCK_MASTER_USERS]);
  }

  async getAppointments(): Promise<MasterAppointment[]> {
    return Promise.resolve([...localAppointments]);
  }

  async updateAppointmentStatus(
    appointmentId: string,
    newStatus: AppointmentStatus,
    reason: string,
    changedBy: string = 'Rafael Leme (Master)'
  ): Promise<MasterAppointment> {
    const aptIndex = localAppointments.findIndex((a) => a.id === appointmentId);
    if (aptIndex === -1) {
      throw new Error(`Agendamento ${appointmentId} não encontrado.`);
    }

    const currentApt = localAppointments[aptIndex];
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(
      now.getMonth() + 1
    ).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(
      2,
      '0'
    )}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newAuditEntry: AppointmentStatusHistory = {
      id: `hist_${Date.now()}`,
      appointmentId,
      fromStatus: currentApt.status,
      toStatus: newStatus,
      changedBy,
      changedByRole: 'master',
      reason,
      changedAt: formattedDate,
    };

    const updatedApt: MasterAppointment = {
      ...currentApt,
      status: newStatus,
      statusHistory: [newAuditEntry, ...(currentApt.statusHistory || [])],
    };

    localAppointments[aptIndex] = updatedApt;
    return Promise.resolve({ ...updatedApt });
  }

  async getSubscriptions(): Promise<MasterSubscription[]> {
    return Promise.resolve([...MOCK_MASTER_SUBSCRIPTIONS]);
  }

  async getRecentActivities(): Promise<MasterActivityItem[]> {
    return Promise.resolve([...MOCK_MASTER_ACTIVITIES]);
  }

  async getGrowthChart(): Promise<ChartDataPoint[]> {
    return Promise.resolve([...MOCK_GROWTH_CHART]);
  }
}

export const masterDataService = new MasterDataService();
