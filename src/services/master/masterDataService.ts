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
  MasterJoaoBarberRealResponse,
} from '../../types/master';
import { auth, isFirebaseConfigured } from '../firebase/config';

// In-memory state clone for local session reactivity
let localAppointments: MasterAppointment[] = [...MOCK_MASTER_APPOINTMENTS];

/**
 * Master Data Service
 *
 * Camada de abstração para consultas de dados do Master Dashboard.
 * No Passo 2B, integra-se de forma segura à API real /api/master/joao-barber
 * enriquecendo o negócio canônico 'joao-barber' com dados vivos do Firestore,
 * mantendo compatibilidade resiliente com o ambiente de testes e mocks.
 */
export class MasterDataService {
  /**
   * Consulta a API segura server-side GET /api/master/joao-barber
   * enviando o Bearer ID Token do usuário Master autenticado.
   */
  async getJoaoBarberRealData(): Promise<MasterJoaoBarberRealResponse | null> {
    if (!isFirebaseConfigured || !auth || !auth.currentUser) {
      return null;
    }

    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch('/api/master/joao-barber', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        console.warn(`[MasterDataService] /api/master/joao-barber retornou status ${response.status}`);
        return null;
      }

      const data: MasterJoaoBarberRealResponse = await response.json();
      return data;
    } catch (err) {
      console.warn('[MasterDataService] Falha na requisição para /api/master/joao-barber:', err);
      return null;
    }
  }

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
    const list = [...MOCK_MASTER_BUSINESSES];
    try {
      const realData = await this.getJoaoBarberRealData();
      if (realData && realData.success) {
        const joaoIndex = list.findIndex(
          (b) => b.slug === 'joao-barber' || b.id === 'biz_joao_barber'
        );
        if (joaoIndex !== -1) {
          const current = list[joaoIndex];
          const prof = realData.profile;
          list[joaoIndex] = {
            ...current,
            name: prof?.name || current.name,
            ownerPhone: prof?.whatsapp || current.ownerPhone,
            city: prof?.address?.city || current.city,
            state: prof?.address?.state || current.state,
            appointmentCount: realData.summary.totalAppointments,
            monthlyRevenue:
              realData.summary.calculatedRevenue > 0
                ? realData.summary.calculatedRevenue
                : current.monthlyRevenue,
            cancellationsCount: realData.summary.cancelledAppointments,
            isLiveFirestore: true,
            liveStats: {
              ...realData.summary,
              lastSyncedAt: realData.timestamp,
            },
          };
        }
      }
    } catch (err) {
      console.warn(
        '[MasterDataService] Erro ao carregar dados reais de joao-barber em getBusinesses:',
        err
      );
    }
    return list;
  }

  async getBusinessById(businessId: string): Promise<MasterBusiness | null> {
    const all = await this.getBusinesses();
    const found = all.find((b) => b.id === businessId || b.slug === businessId);
    return found ? { ...found } : null;
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
