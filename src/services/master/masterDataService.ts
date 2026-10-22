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
  MasterProfessional,
} from '../../types/master';
import { auth, isFirebaseConfigured } from '../firebase/config';

// In-memory state for local session reactivity on real appointments
let localAppointments: MasterAppointment[] = [];

export interface MasterApiSyncState {
  status: 'idle' | 'loading' | 'success' | 'error';
  statusCode?: number;
  errorMessage?: string;
  lastAttemptAt?: string;
  responseSummary?: any;
}

/**
 * Master Data Service
 *
 * Camada de serviço de dados do Master Dashboard.
 * Na V4_06 / Limpeza do Master:
 * - Conecta exclusivamente às fontes reais existentes (API server-side do Firestore).
 * - Elimina fallbacks automáticos para listas ou dados demonstrativos.
 * - Trata de forma transparente estados sem gateway de pagamento e ausência de múltiplos tenants.
 */
export class MasterDataService {
  private syncState: MasterApiSyncState = { status: 'idle' };
  private cachedRealData: MasterJoaoBarberRealResponse | null = null;
  private lastFetchTime = 0;

  clearCache(): void {
    this.cachedRealData = null;
    this.lastFetchTime = 0;
  }

  getSyncState(): MasterApiSyncState {
    return { ...this.syncState };
  }

  /**
   * Consulta a API segura server-side GET /api/master/joao-barber
   * enviando o Bearer ID Token do usuário Master autenticado.
   * Utiliza cache curto em memória (10s) para evitar múltiplas requisições paralelas desnecessárias.
   */
  async getJoaoBarberRealData(forceRefresh = false): Promise<MasterJoaoBarberRealResponse | null> {
    const now = Date.now();
    if (!forceRefresh && this.cachedRealData && now - this.lastFetchTime < 10000) {
      return this.cachedRealData;
    }

    if (!isFirebaseConfigured || !auth || !auth.currentUser) {
      this.syncState = {
        status: 'error',
        errorMessage: 'Firebase não configurado ou usuário Master não autenticado no cliente.',
        lastAttemptAt: new Date().toISOString(),
      };
      return null;
    }

    try {
      this.syncState = { status: 'loading', lastAttemptAt: new Date().toISOString() };
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch('/api/master/joao-barber', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        let errorData: any = null;
        try {
          errorData = await response.json();
        } catch {
          // corpo não-JSON
        }
        const errorMsg =
          errorData?.message ||
          errorData?.error ||
          `Erro HTTP ${response.status} ao consultar API /api/master/joao-barber`;

        this.syncState = {
          status: 'error',
          statusCode: response.status,
          errorMessage: errorMsg,
          lastAttemptAt: new Date().toISOString(),
        };

        console.error(
          `[MasterDataService] Erro ${response.status} retornado por /api/master/joao-barber:`,
          errorData || errorMsg
        );
        return null;
      }

      const data: MasterJoaoBarberRealResponse = await response.json();

      this.cachedRealData = data;
      this.lastFetchTime = Date.now();

      this.syncState = {
        status: 'success',
        statusCode: 200,
        lastAttemptAt: new Date().toISOString(),
        responseSummary: data.summary,
      };

      return data;
    } catch (err: any) {
      const errorMsg = err?.message || 'Falha de rede ou conexão com /api/master/joao-barber';
      this.syncState = {
        status: 'error',
        errorMessage: errorMsg,
        lastAttemptAt: new Date().toISOString(),
      };
      console.error('[MasterDataService] Exceção na requisição para /api/master/joao-barber:', err);
      return null;
    }
  }

  async getPlatformMetrics(forceRefresh = false): Promise<PlatformMetrics> {
    const realData = await this.getJoaoBarberRealData(forceRefresh);

    if (realData && realData.success && realData.summary) {
      const totalAppointments = realData.summary.totalAppointments || 0;
      const revenue = realData.summary.calculatedRevenue || 0;
      const avgTicket = totalAppointments > 0 ? revenue / totalAppointments : 0.0;

      return {
        totalBusinesses: 1,
        activeBusinesses: 1,
        trialBusinesses: 0,
        suspendedBusinesses: 0,
        totalAppointments,
        appointmentsThisMonth: totalAppointments,
        platformRevenueMRR: 0.0, // R$ 0,00 real: faturamento SaaS não possui gateway integrado nesta etapa
        totalPlatformUsers: 0,
        averageTicket: Number(avgTicket.toFixed(2)),
        growthRatePercent: 0.0,
      };
    }

    // Se a consulta falhar ou não houver dados, retorna métricas neutras zeradas
    return {
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
  }

  async getRetentionMetrics(): Promise<RetentionMetrics> {
    const realData = await this.getJoaoBarberRealData();
    const hasBusiness = realData && realData.success;

    return {
      newBusinesses: hasBusiness ? 1 : 0,
      churnedBusinesses: 0,
      netGrowth: hasBusiness ? 1 : 0,
      churnRatePercent: 0.0,
      lostMRR: 0.0,
      periodLabel: 'Histórico inicial',
    };
  }

  async getMonthlyCohorts(): Promise<MonthlyCohortDataPoint[]> {
    // Sem histórico de múltiplos meses e sem gateway, retorna lista vazia honesta
    return [];
  }

  /**
   * Retorna apenas negócios reais encontrados na fonte persistida do Firestore.
   * Não concatena barbearias fictícias.
   */
  async getBusinesses(forceRefresh = false): Promise<MasterBusiness[]> {
    try {
      const realData = await this.getJoaoBarberRealData(forceRefresh);

      if (realData && realData.success) {
        const prof = realData.profile;
        const joaoBusiness: MasterBusiness = {
          id: 'joao-barber',
          name: prof?.name || 'João Barber Shop',
          slug: 'joao-barber',
          ownerUserId: 'admin',
          ownerName: prof?.name || 'Administrador',
          ownerEmail: 'contato@joaobarber.com.br',
          ownerPhone: prof?.whatsapp || '',
          status: 'active',
          plan: 'starter',
          appointmentCount: realData.summary?.totalAppointments ?? 0,
          monthlyRevenue: realData.summary?.calculatedRevenue ?? 0,
          cancellationsCount: realData.summary?.cancelledAppointments ?? 0,
          city: prof?.address?.city || '',
          state: prof?.address?.state || '',
          createdAt: '2025-11-10',
          lastActiveAt: 'Sincronizado via Firestore',
          isLiveFirestore: true,
          professionals: Array.isArray(realData.professionals) ? realData.professionals : [],
          liveStats: {
            ...realData.summary,
            lastSyncedAt: realData.timestamp,
          },
        };

        return [joaoBusiness];
      }
    } catch (err) {
      console.error('[MasterDataService] Erro ao carregar negócio persistido:', err);
    }

    return [];
  }

  async getBusinessById(businessId: string): Promise<MasterBusiness | null> {
    const all = await this.getBusinesses();
    const found = all.find((b) => b.id === businessId || b.slug === businessId);
    return found ? { ...found } : null;
  }

  /**
   * Obtém os profissionais reais cadastrados para o negócio canônico.
   */
  async getBusinessProfessionals(businessIdOrSlug: string): Promise<MasterProfessional[]> {
    if (businessIdOrSlug === 'joao-barber' || businessIdOrSlug === 'biz_joao_barber') {
      const realData = await this.getJoaoBarberRealData();
      if (realData && realData.success && Array.isArray(realData.professionals)) {
        return realData.professionals;
      }
    }
    return [];
  }

  /**
   * Sem uma integração segura de listagem administrativa do Firebase Auth,
   * retorna lista vazia para evitar exibir mocks e para não tratar profissionais
   * como contas de acesso à plataforma.
   */
  async getUsers(): Promise<MasterUser[]> {
    return [];
  }

  /**
   * Consome os agendamentos reais disponibilizados pela API server-side do Firestore.
   */
  async getAppointments(forceRefresh = false): Promise<MasterAppointment[]> {
    try {
      const realData = await this.getJoaoBarberRealData(forceRefresh);

      if (realData && realData.success && Array.isArray(realData.recentAppointments)) {
        const businessName = realData.profile?.name || 'João Barber Shop';

        localAppointments = realData.recentAppointments.map((apt: any) => {
          return {
            id: apt.id,
            businessId: apt.businessId || 'joao-barber',
            businessName,
            customerName: apt.customerName || 'Cliente',
            customerPhone: apt.customerPhone || 'Não informado',
            date: apt.date || '',
            time: apt.time || '',
            service: apt.service || 'Serviço da Barbearia',
            totalPrice: typeof apt.totalPrice === 'number' ? apt.totalPrice : Number(apt.totalPrice) || 0,
            status: (apt.status as AppointmentStatus) || 'confirmed',
            barberName: apt.professionalName || 'Profissional',
            durationMinutes: apt.duration || 30,
            createdAt: apt.createdAt || '',
            statusHistory: [],
          };
        });

        return [...localAppointments];
      }
    } catch (err) {
      console.error('[MasterDataService] Erro ao carregar agendamentos reais:', err);
    }

    return [];
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

  /**
   * Sem gateway de pagamento configurado, retorna lista vazia.
   */
  async getSubscriptions(): Promise<MasterSubscription[]> {
    return [];
  }

  /**
   * Retorna atividades baseadas em eventos reais ou lista vazia.
   */
  async getRecentActivities(): Promise<MasterActivityItem[]> {
    return [];
  }

  /**
   * Gráfico de crescimento exige dados consolidados multi-mensais.
   * Retorna lista vazia honesta.
   */
  async getGrowthChart(): Promise<ChartDataPoint[]> {
    return [];
  }
}

export const masterDataService = new MasterDataService();
